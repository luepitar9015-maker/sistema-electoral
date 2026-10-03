const Voter = require('../models/Voter');
const CensoElectoral = require('../models/CensoElectoral');
const Campaign = require('../models/Campaign');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const ExcelJS = require('exceljs');
const pdf = require('pdf-parse');
const { createWorker } = require('tesseract.js');

/**
 * Agente de IA para WhatsApp que interpreta mensajes en texto,
 * imágenes de formularios físicos (OCR), archivos PDF y planillas Excel,
 * consulta el censo electoral oficial y alimenta automáticamente la base de datos electoral.
 */
class WhatsAppAiService {

    /**
     * Procesa un archivo entrante de WhatsApp (Imagen, PDF o Excel).
     */
    async processIncomingFile({ fileBuffer, fileName, mimeType, captionText = '', telefonoRemitente, nombreRemitente, campanaId, userId }) {
        if (!fileBuffer || !fileBuffer.length) {
            throw new Error('El archivo recibido está vacío');
        }

        const nameLower = (fileName || '').toLowerCase();
        const mimeLower = (mimeType || '').toLowerCase();
        let extractedText = '';
        let fileCategory = 'documento';

        // 1. Detectar tipo de archivo y extraer su contenido textual
        if (
            nameLower.endsWith('.xlsx') ||
            nameLower.endsWith('.xls') ||
            mimeLower.includes('spreadsheet') ||
            mimeLower.includes('excel')
        ) {
            fileCategory = 'excel';
            extractedText = await this.extractTextFromExcel(fileBuffer);
        } else if (nameLower.endsWith('.pdf') || mimeLower.includes('pdf')) {
            fileCategory = 'pdf';
            extractedText = await this.extractTextFromPdf(fileBuffer);
        } else if (
            nameLower.endsWith('.jpg') ||
            nameLower.endsWith('.jpeg') ||
            nameLower.endsWith('.png') ||
            nameLower.endsWith('.webp') ||
            mimeLower.startsWith('image/')
        ) {
            fileCategory = 'imagen';
            extractedText = await this.extractTextFromImage(fileBuffer);
        } else {
            // Intentar como PDF o texto plano
            try {
                extractedText = await this.extractTextFromPdf(fileBuffer);
                fileCategory = 'pdf';
            } catch (e) {
                extractedText = fileBuffer.toString('utf-8');
            }
        }

        console.log(`[WHATSAPP FILE] Archivo: ${fileName} (${fileCategory}). Caracteres extraídos: ${extractedText.length}`);

        // 2. Combinar texto extraído con cualquier mensaje que acompañe el archivo
        const fullText = [captionText, extractedText].filter(Boolean).join('\n\n');

        // 3. Procesar mediante el pipeline de IA
        return await this.processIncomingMessage({
            mensaje: fullText,
            telefonoRemitente,
            nombreRemitente,
            campanaId,
            userId,
            fileMeta: {
                fileName,
                fileCategory
            }
        });
    }

    /**
     * Extrae texto y registros de una planilla Excel (.xlsx / .xls).
     */
    async extractTextFromExcel(buffer) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const lines = [];
            workbook.eachSheet((worksheet) => {
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    const rowValues = [];
                    row.eachCell({ includeEmpty: false }, (cell) => {
                        let val = cell.value;
                        if (typeof val === 'number') val = String(Math.round(val));
                        else if (val && typeof val === 'object' && val.text) val = val.text;
                        else if (val !== null && val !== undefined) val = String(val).trim();
                        if (val) rowValues.push(val);
                    });
                    if (rowValues.length > 0) {
                        lines.push(rowValues.join(' '));
                    }
                });
            });

            return lines.join('\n');
        } catch (error) {
            console.error('Error al extraer texto de Excel:', error);
            throw new Error('No se pudo procesar el archivo Excel: ' + error.message);
        }
    }

    /**
     * Extrae texto de un documento PDF.
     */
    async extractTextFromPdf(buffer) {
        try {
            if (pdf.PDFParse) {
                const parser = new pdf.PDFParse({ data: buffer });
                const result = await parser.getText();
                await parser.destroy();
                return typeof result === 'string' ? result : (result.text || '');
            } else if (typeof pdf === 'function') {
                const data = await pdf(buffer);
                return data.text || '';
            }
            return '';
        } catch (error) {
            console.error('Error al extraer texto de PDF:', error);
            throw new Error('No se pudo leer el documento PDF: ' + error.message);
        }
    }

    /**
     * Extrae texto de una fotografía de formulario mediante OCR (Tesseract).
     */
    async extractTextFromImage(buffer) {
        try {
            // Inicializar worker OCR (eng o spa)
            const worker = await createWorker(['spa', 'eng']);
            const ret = await worker.recognize(buffer);
            await worker.terminate();
            return ret.data.text || '';
        } catch (error) {
            console.error('Error en OCR de imagen:', error);
            // Intentar fallback solo en 'eng' si falla idioma español
            try {
                const worker = await createWorker('eng');
                const ret = await worker.recognize(buffer);
                await worker.terminate();
                return ret.data.text || '';
            } catch (fallbackErr) {
                throw new Error('No se pudo realizar el reconocimiento óptico (OCR) de la imagen: ' + error.message);
            }
        }
    }

    /**
     * Procesa un mensaje entrante de WhatsApp (texto o extraído de archivo).
     */
    async processIncomingMessage({ mensaje, telefonoRemitente, nombreRemitente, campanaId, userId, fileMeta }) {
        if (!mensaje || typeof mensaje !== 'string') {
            throw new Error('El mensaje no puede estar vacío');
        }

        const rawText = mensaje.trim();

        // 1. Obtener la campaña correspondiente
        let campaign = null;
        if (campanaId) {
            campaign = await Campaign.findByPk(campanaId);
        }
        if (!campaign) {
            campaign = await Campaign.findOne({ where: { activa: true } }) || await Campaign.findOne();
        }

        // 2. Extraer entidades mediante procesamiento inteligente
        const parsed = this.parseMessageEntities(rawText, nombreRemitente, telefonoRemitente);

        // 2.1 Detectar intención de Consulta Ciudadana de Puesto de Votación
        const isQueryIntent = /(?:donde|d[oó]nde\s+(?:me\s+toca\s+)?voto|puesto|mesa|consultar?\s*(?:puesto|cedula|c[eé]dula)?|^c[eé]dula\s*\d+|^\d{6,11}$)/i.test(rawText);
        const singleCedMatch = rawText.match(/\b\d{6,11}\b/);

        if (isQueryIntent && singleCedMatch && parsed.voters.length <= 1 && !parsed.leader) {
            const queryCedula = singleCedMatch[0];
            const censoInfo = await CensoElectoral.findOne({ where: { cedula: queryCedula } });
            const voterRecord = await Voter.findOne({ where: { cedula: queryCedula } });

            let queryResponse = '';
            if (censoInfo) {
                const nombreCiudadano = (censoInfo.nombres ? `${censoInfo.nombres} ${censoInfo.apellidos || ''}` : voterRecord ? `${voterRecord.nombres} ${voterRecord.apellidos}` : 'Ciudadano').trim();
                const liderAsignado = voterRecord?.lider_nombre ? `${voterRecord.lider_nombre}` : (campaign?.candidato ? `Equipo de ${campaign.candidato}` : 'Coordinación Electoral');

                queryResponse = `🗳️ *CONSULTA OFICIAL DE PUESTO DE VOTACIÓN* 🇨🇴\n\n` +
                    `¡Hola, *${nombreCiudadano}*!\n\n` +
                    `Tu información electoral registrada es:\n` +
                    `📍 *Puesto de Votación:* ${censoInfo.puesto_votacion || 'Principal'}\n` +
                    `🏢 *Dirección:* ${censoInfo.direccion || 'Casco Urbano'}\n` +
                    `🗳️ *Mesa Asignada:* *Mesa ${censoInfo.mesa || '1'}*\n` +
                    `🗺️ *Municipio:* ${censoInfo.municipio || ''} (${censoInfo.departamento || ''})\n\n` +
                    `👥 *Tu Enlace / Líder de Campaña:* ${liderAsignado}\n\n` +
                    `⏰ *Horario de votación:* 8:00 AM a 4:00 PM.\n` +
                    `⚠️ *Recuerda:* Presenta tu cédula de ciudadanía física o digital original.\n\n` +
                    `_${campaign?.nombre ? 'Campaña ' + campaign.nombre + ' te desea una excelente jornada.' : '¡Tu voto construye el futuro!'}_`;
            } else if (voterRecord) {
                queryResponse = `🗳️ *CONSULTA DE PUESTO DE VOTACIÓN* 🇨🇴\n\n` +
                    `¡Hola, *${voterRecord.nombres} ${voterRecord.apellidos}*!\n\n` +
                    `Estás registrado(a) en nuestra campaña electoral:\n` +
                    `📍 *Puesto:* ${voterRecord.lugar_votacion || 'Por confirmar'}\n` +
                    `🗳️ *Mesa:* ${voterRecord.mesa || 'Por confirmar'}\n` +
                    `🗺️ *Municipio:* ${voterRecord.municipio || ''}\n` +
                    `👥 *Líder Asignado:* ${voterRecord.lider_nombre || 'Equipo Central'}\n\n` +
                    `⚠️ Tu puesto exacto se confirmará en cuanto se actualice el censo oficial. ¡Tu líder te contactará!`;
            } else {
                queryResponse = `🔍 *CONSULTA ELECTORAL*\n\n` +
                    `No encontramos un registro asignado con la cédula *${queryCedula}* en nuestro censo territorial local.\n\n` +
                    `👉 Por favor verifica que el número esté bien escrito o consulta directamente en la Registraduría Nacional.\n\n` +
                    `Si deseas unirte a la campaña o registrarte con un líder, responde con tu nombre completo y barrio.`;
            }

            await WhatsAppMessage.create({
                campana_id: campaign?.id || null,
                remitente_telefono: telefonoRemitente || '+573000000000',
                remitente_nombre: nombreRemitente || 'Ciudadano Consulta',
                mensaje: rawText,
                respuesta: queryResponse,
                tipo_mensaje: 'consulta_puesto',
                votantes_procesados: 0,
                lider_registrado: false,
                detalles_json: JSON.stringify({ queryCedula, found: !!censoInfo })
            });

            return {
                reply: queryResponse,
                tipo: 'consulta_puesto',
                success: true,
                resultado: { queryCedula, puesto: censoInfo?.puesto_votacion, mesa: censoInfo?.mesa }
            };
        }

        // 3. Autoconsulta del Líder en el Censo si se detectó cédula
        let leaderData = null;
        if (parsed.leader) {
            leaderData = { ...parsed.leader };
            if (leaderData.cedula) {
                const censoLeader = await CensoElectoral.findOne({ where: { cedula: leaderData.cedula } });
                if (censoLeader) {
                    leaderData.departamento = censoLeader.departamento || leaderData.departamento;
                    leaderData.municipio = censoLeader.municipio || leaderData.municipio;
                    leaderData.lugar_votacion = censoLeader.puesto_votacion || censoLeader.lugar_votacion || leaderData.lugar_votacion;
                    leaderData.mesa = censoLeader.mesa || leaderData.mesa;
                    if (!leaderData.nombres && censoLeader.nombres) leaderData.nombres = censoLeader.nombres;
                    if (!leaderData.apellidos && censoLeader.apellidos) leaderData.apellidos = censoLeader.apellidos;
                }
            }

            // Registrar o actualizar al Líder en la base de datos
            await this.registerOrUpdateLeader(leaderData, campaign?.id, userId);
        } else {
            // Verificar si el remitente ya es un líder registrado por su número de teléfono
            const cleanPhone = telefonoRemitente ? telefonoRemitente.replace(/\D/g, '').slice(-10) : '';
            if (cleanPhone) {
                const existingLeader = await Voter.findOne({
                    where: { isLeader: true, direccion: cleanPhone }
                });
                if (existingLeader) {
                    leaderData = {
                        nombres: existingLeader.nombres,
                        apellidos: existingLeader.apellidos,
                        cedula: existingLeader.cedula,
                        departamento: existingLeader.departamento,
                        municipio: existingLeader.municipio,
                        lugar_votacion: existingLeader.lugar_votacion
                    };
                }
            }
        }

        // 4. Procesar y registrar cada Votante extraído
        const processedVoters = [];
        const duplicates = [];
        const notFoundInCenso = [];

        for (const voterItem of parsed.voters) {
            const cleanCedula = String(voterItem.cedula || '').replace(/\D/g, '').trim();
            if (!cleanCedula || cleanCedula.length < 5) continue;

            // Verificar si ya existe en la base de datos de votantes
            const existingVoter = await Voter.findOne({ where: { cedula: cleanCedula } });
            if (existingVoter) {
                duplicates.push({
                    cedula: cleanCedula,
                    nombres: `${existingVoter.nombres} ${existingVoter.apellidos}`.trim()
                });
                continue;
            }

            // Buscar en el Censo Electoral Local para Autodiligenciar
            const censoMatch = await CensoElectoral.findOne({ where: { cedula: cleanCedula } });

            // Si el nombre viene de OCR y en el censo oficial está registrado, preferir el nombre oficial del censo
            let nombresFinal = voterItem.nombres;
            let apellidosFinal = voterItem.apellidos;

            if (censoMatch && censoMatch.nombres) {
                nombresFinal = censoMatch.nombres;
                apellidosFinal = censoMatch.apellidos || apellidosFinal;
            } else if (!nombresFinal || nombresFinal.startsWith('Votante CC')) {
                nombresFinal = censoMatch?.nombres || `Votante CC ${cleanCedula}`;
                apellidosFinal = censoMatch?.apellidos || '';
            }

            const deptoFinal = censoMatch?.departamento || voterItem.departamento || campaign?.departamento || '';
            const muniFinal = censoMatch?.municipio || voterItem.municipio || campaign?.municipio || '';
            const puestoFinal = censoMatch?.puesto_votacion || censoMatch?.lugar_votacion || voterItem.lugar_votacion || '';
            const mesaFinal = censoMatch?.mesa || voterItem.mesa || '';

            if (!censoMatch) {
                notFoundInCenso.push(cleanCedula);
            }

            // Inserción automática en la Base de Datos
            const createdVoter = await Voter.create({
                nombres: nombresFinal.trim(),
                apellidos: apellidosFinal.trim(),
                cedula: cleanCedula,
                direccion: voterItem.direccion || (voterItem.telefono ? `Tel: ${voterItem.telefono}` : ''),
                lugar_votacion: puestoFinal,
                mesa: mesaFinal,
                departamento: deptoFinal,
                municipio: muniFinal,
                lider_nombre: leaderData ? `${leaderData.nombres || ''} ${leaderData.apellidos || ''}`.trim() : (nombreRemitente || 'Líder WhatsApp'),
                lider_cedula: leaderData?.cedula || '',
                campana_id: campaign?.id || null,
                isLeader: false,
                usuario_registro_id: userId || null
            });

            processedVoters.push({
                id: createdVoter.id,
                nombres: `${nombresFinal} ${apellidosFinal}`.trim(),
                cedula: cleanCedula,
                lugar_votacion: puestoFinal || 'Pendiente por asignar',
                mesa: mesaFinal,
                municipio: muniFinal,
                censoAutodiligenciado: !!censoMatch
            });
        }

        // 5. Construir Respuesta Inteligente en Formato WhatsApp
        const botResponse = this.generateWhatsAppResponse({
            campaign,
            leaderData,
            nombreRemitente,
            processedVoters,
            duplicates,
            notFoundInCenso,
            totalFound: parsed.voters.length,
            fileMeta
        });

        // 6. Determinar el tipo de mensaje para el historial
        let finalType = parsed.type;
        if (fileMeta?.fileCategory) {
            finalType = `archivo_${fileMeta.fileCategory}`;
        }

        // Guardar en el historial de WhatsAppMessages
        const savedMessage = await WhatsAppMessage.create({
            campana_id: campaign?.id || null,
            remitente_telefono: telefonoRemitente || '+573000000000',
            remitente_nombre: leaderData ? `${leaderData.nombres || ''} ${leaderData.apellidos || ''}`.trim() : (nombreRemitente || 'Contacto WhatsApp'),
            mensaje: fileMeta ? `[${fileMeta.fileCategory.toUpperCase()}: ${fileMeta.fileName}] ${rawText.slice(0, 300)}` : rawText,
            respuesta: botResponse,
            tipo_mensaje: finalType,
            votantes_procesados: processedVoters.length,
            lider_registrado: !!leaderData,
            detalles_json: JSON.stringify({
                leader: leaderData,
                fileMeta,
                processedCount: processedVoters.length,
                duplicatesCount: duplicates.length,
                voters: processedVoters
            }),
            estado: 'procesado'
        });

        return {
            success: true,
            messageId: savedMessage.id,
            respuesta: botResponse,
            fileMeta,
            campana: campaign ? { id: campaign.id, nombre: campaign.nombre, candidato: campaign.candidato } : null,
            lider: leaderData,
            votantesIngresados: processedVoters,
            duplicados: duplicates,
            totalProcesados: processedVoters.length
        };
    }

    /**
     * Extrae estructuradamente líderes y votantes desde lenguaje natural o listas.
     */
    parseMessageEntities(text, defaultName, defaultPhone) {
        const result = {
            leader: null,
            voters: [],
            type: 'lista_votantes'
        };

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

        // Patrones para detectar Líder
        const leaderLine = lines.find(l => /(?:soy\s+(?:el\s+|la\s+)?l[ií]der|l[ií]der\s*[:\-])/i.test(l));
        if (leaderLine) {
            const cedMatch = leaderLine.match(/(?:c[eé]dula|cc|doc)\s*[:#]?\s*(\d{5,12})/i) || leaderLine.match(/\b\d{6,12}\b/);
            const leaderCedula = cedMatch ? (cedMatch[1] || cedMatch[0]) : null;
            let leaderName = leaderLine
                .replace(/(?:hola|buenos\s+d[ií]as|tardes|noches|[!¡,;])/gi, '')
                .replace(/(?:soy\s+(?:el\s+|la\s+)?l[ií]der|l[ií]der\s*[:\-])/gi, '')
                .replace(/(?:con\s+)?(?:c[eé]dula|cc|doc)\s*[:#]?\s*\d{5,12}/gi, '')
                .replace(/(?:de|en|municipio)\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+/gi, '')
                .replace(/[\.\:\-]+/g, ' ')
                .trim();

            if (leaderName.length >= 2) {
                const words = leaderName.split(/\s+/).filter(w => !/^(el|la|los|de|con|mi|mis|y)$/i.test(w));
                const mid = Math.ceil(words.length / 2);
                result.leader = {
                    nombres: words.slice(0, mid).join(' ') || leaderName,
                    apellidos: words.slice(mid).join(' ') || '',
                    cedula: leaderCedula,
                    telefono: defaultPhone
                };
            }
        }

        // Extraer votantes línea por línea
        for (const line of lines) {
            // Ignorar la línea de declaración del líder
            if (leaderLine && line === leaderLine) continue;
            if (/^(hola|buenos|saludos|te\s+envio|adjunto|mis\s+votantes|campa[nñ]a|nombres|cedula)/i.test(line) && !/\d{6,11}/.test(line)) {
                continue;
            }

            // Buscar número de cédula en la línea (de 5 a 11 dígitos consecutivos)
            const cedulaMatches = line.match(/\b\d{5,11}\b/g);

            if (cedulaMatches && cedulaMatches.length > 0) {
                // Si la línea contiene solo números separados por comas o espacios
                if (cedulaMatches.length > 1 && /^[\d\s,;\.\-]+$/.test(line)) {
                    for (const singleCed of cedulaMatches) {
                        if (result.leader && result.leader.cedula === singleCed) continue;
                        result.voters.push({
                            cedula: singleCed,
                            nombres: `Votante CC ${singleCed}`,
                            apellidos: ''
                        });
                    }
                    continue;
                }

                // Línea con nombre y cédula: ej: "1. Carlos Mario Gómez - CC 71234567 - Tel: 3001234567"
                const cedula = cedulaMatches[0];
                if (result.leader && result.leader.cedula === cedula) continue;

                // Limpiar prefijos de viñetas: "1.", "1)", "- ", "* "
                let namePart = line
                    .replace(/^[\d\.\-\)\*\s]+/, '')
                    .replace(new RegExp(`(?:c[eé]dula|cc|doc|identificaci[oó]n)?\\s*[:#]?\\s*${cedula}`, 'gi'), '')
                    .replace(/(?:tel|cel|celular|tel[eé]fono)\s*[:#]?\s*\d{7,12}/gi, '')
                    .replace(/[\-\,\:\;\|]+/g, ' ')
                    .trim();

                if (!namePart || namePart.length < 3) {
                    namePart = `Votante CC ${cedula}`;
                }

                const words = namePart.split(/\s+/).filter(w => !/^(cc|cedula|doc|de|la|el|true|false)$/i.test(w));
                const mid = Math.ceil(words.length / 2);
                const nombres = words.slice(0, mid).join(' ') || namePart;
                const apellidos = words.slice(mid).join(' ') || '';

                const telMatch = line.match(/(?:tel|cel|celular|tel[eé]fono)\s*[:#]?\s*(\d{7,12})/i);

                result.voters.push({
                    cedula,
                    nombres,
                    apellidos,
                    telefono: telMatch ? telMatch[1] : ''
                });
            }
        }

        // Si no se encontraron líneas pero hay cédulas sueltas en el texto
        if (result.voters.length === 0) {
            const allCeds = text.match(/\b\d{6,11}\b/g) || [];
            for (const c of allCeds) {
                if (result.leader && result.leader.cedula === c) continue;
                result.voters.push({
                    cedula: c,
                    nombres: `Votante CC ${c}`,
                    apellidos: ''
                });
            }
        }

        if (result.leader && result.voters.length > 0) result.type = 'mixto';
        else if (result.leader) result.type = 'datos_lider';
        else result.type = 'lista_votantes';

        return result;
    }

    /**
     * Registra o actualiza al Líder en la tabla Voter con isLeader: true.
     */
    async registerOrUpdateLeader(leaderData, campanaId, userId) {
        if (!leaderData || (!leaderData.cedula && !leaderData.nombres)) return null;

        let existing = null;
        if (leaderData.cedula) {
            existing = await Voter.findOne({ where: { cedula: leaderData.cedula } });
        }

        if (existing) {
            existing.isLeader = true;
            if (campanaId && !existing.campana_id) existing.campana_id = campanaId;
            if (leaderData.lugar_votacion && !existing.lugar_votacion) existing.lugar_votacion = leaderData.lugar_votacion;
            if (leaderData.mesa && !existing.mesa) existing.mesa = leaderData.mesa;
            await existing.save();
            return existing;
        }

        return await Voter.create({
            nombres: leaderData.nombres || 'Líder',
            apellidos: leaderData.apellidos || '',
            cedula: leaderData.cedula || String(Date.now()).slice(-8),
            direccion: leaderData.telefono ? `Tel: ${leaderData.telefono}` : '',
            lugar_votacion: leaderData.lugar_votacion || '',
            mesa: leaderData.mesa || '',
            departamento: leaderData.departamento || '',
            municipio: leaderData.municipio || '',
            isLeader: true,
            campana_id: campanaId || null,
            usuario_registro_id: userId || null
        });
    }

    /**
     * Genera la respuesta del Bot con formato y estética de WhatsApp.
     */
    generateWhatsAppResponse({ campaign, leaderData, nombreRemitente, processedVoters, duplicates, notFoundInCenso, totalFound, fileMeta }) {
        const leaderName = leaderData
            ? `${leaderData.nombres || ''} ${leaderData.apellidos || ''}`.trim()
            : (nombreRemitente || 'Líder');

        const campName = campaign ? campaign.nombre : 'Campaña Electoral';
        const candidate = campaign ? campaign.candidato : 'nuestro candidato';
        const slogan = campaign?.eslogan ? `\n> _"${campaign.eslogan}"_\n` : '';

        let msg = `¡Hola *${leaderName}*! 👋🤖\n`;
        msg += `Soy el *Agente de Inteligencia Artificial* de la campaña *${campName}* (${candidate}).${slogan}\n`;

        // Indicador de Archivo Procesado
        if (fileMeta) {
            const iconMap = {
                imagen: '📸 *FORMULARIO EN IMAGEN ANALIZADO CON IA (OCR)*',
                pdf: '📑 *FORMULARIO PDF LEÍDO Y PROCESADO*',
                excel: '📊 *PLANILLA EXCEL PROCESADA AUTOMÁTICAMENTE*'
            };
            const fileHeader = iconMap[fileMeta.fileCategory] || '📎 *ARCHIVO PROCESADO*';
            msg += `${fileHeader}\n• Archivo: _${fileMeta.fileName}_\n\n`;
        }

        if (leaderData) {
            msg += `✅ *LÍDER IDENTIFICADO Y REGISTRADO*\n`;
            msg += `• Nombre: *${leaderName}*\n`;
            if (leaderData.cedula) msg += `• Cédula: *${leaderData.cedula}*\n`;
            if (leaderData.lugar_votacion) msg += `• Puesto: ${leaderData.lugar_votacion} ${leaderData.mesa ? `(Mesa ${leaderData.mesa})` : ''}\n`;
            msg += `\n`;
        }

        if (processedVoters.length > 0) {
            msg += `🗳️ *SE HAN INGRESADO ${processedVoters.length} VOTANTES A LA BASE DE DATOS:*\n\n`;

            processedVoters.forEach((v, idx) => {
                const icon = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][idx] || '▪️';
                msg += `${icon} *${v.nombres}* (CC ${v.cedula})\n`;
                if (v.lugar_votacion && v.lugar_votacion !== 'Pendiente por asignar') {
                    msg += `   📍 *Puesto:* ${v.lugar_votacion}${v.mesa ? ` (Mesa ${v.mesa})` : ''}\n`;
                    if (v.municipio) msg += `   🏙️ *Municipio:* ${v.municipio}\n`;
                } else {
                    msg += `   📍 *Puesto:* Registrado en sistema (pendiente consulta Registraduría)\n`;
                }
            });
            msg += `\n`;
        } else if (duplicates.length > 0 && totalFound > 0) {
            msg += `⚠️ Los *${duplicates.length}* votantes extraídos ya se encontraban registrados en nuestra base de datos.\n\n`;
        } else if (!leaderData) {
            msg += `ℹ️ Para registrar votantes, puedes enviarme un mensaje con los nombres y cédulas, adjuntar una foto del formulario físico, un PDF o una planilla Excel.\n\n`;
        }

        if (duplicates.length > 0 && processedVoters.length > 0) {
            msg += `ℹ️ *${duplicates.length}* votantes del archivo ya estaban previamente registrados.\n`;
        }

        msg += `\n📊 *Estado de la Base de Datos:* Actualizada en tiempo real.`;
        msg += `\n¡Gracias por tu liderazgo y compromiso! Sigue enviando tus formularios y listados por este medio.`;

        return msg;
    }
}

module.exports = new WhatsAppAiService();
