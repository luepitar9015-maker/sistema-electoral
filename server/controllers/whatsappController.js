const crypto = require('crypto');
const whatsappAiService = require('../services/whatsappAiService');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const Campaign = require('../models/Campaign');
const Voter = require('../models/Voter');

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'electoral_meta_verify_token_secure_2026';

/**
 * Simulador interactivo en el sistema (utilizado por candidatos, gerentes y superusuarios).
 */
exports.simulate = async (req, res) => {
    try {
        const { mensaje, telefonoRemitente, nombreRemitente, campanaId } = req.body;

        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({ message: 'El mensaje de WhatsApp no puede estar vacío' });
        }

        const targetCampana = req.campana_id || campanaId || req.user?.campana_id || null;

        const result = await whatsappAiService.processIncomingMessage({
            mensaje,
            telefonoRemitente: telefonoRemitente || '+573001234567',
            nombreRemitente: nombreRemitente || 'Líder WhatsApp',
            campanaId: targetCampana,
            userId: req.user?.id || null
        });

        res.json(result);
    } catch (error) {
        console.error('Error procesando mensaje en simulador WhatsApp:', error);
        res.status(500).json({ message: 'Error procesando mensaje', error: error.message });
    }
};

/**
 * Simulador para subida y procesamiento inteligente de archivos (Imágenes/OCR, PDFs o Excels).
 */
exports.simulateFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo' });
        }

        const { caption, telefonoRemitente, nombreRemitente, campanaId } = req.body;
        const targetCampana = req.campana_id || campanaId || req.user?.campana_id || null;

        const result = await whatsappAiService.processIncomingFile({
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            captionText: caption || '',
            telefonoRemitente: telefonoRemitente || '+573001234567',
            nombreRemitente: nombreRemitente || 'Líder WhatsApp',
            campanaId: targetCampana,
            userId: req.user?.id || null
        });

        res.json(result);
    } catch (error) {
        console.error('Error procesando archivo en simulador WhatsApp:', error);
        res.status(500).json({ message: 'Error al procesar el archivo: ' + error.message, error: error.message });
    }
};

/**
 * Webhook GET para verificación de Meta / WhatsApp Business API.
 */
exports.webhookGet = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook de WhatsApp verificado exitosamente');
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    res.sendStatus(400);
};

/**
 * Webhook POST para recibir mensajes reales desde WhatsApp Business Cloud API.
 */
exports.webhookPost = async (req, res) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const appSecret = process.env.WHATSAPP_APP_SECRET;

        // Validar autenticidad de la firma de Meta si está configurada la llave secreta
        if (appSecret) {
            if (!signature) {
                console.warn('[WHATSAPP WEBHOOK] Solicitud rechazada: falta firma X-Hub-Signature-256');
                return res.status(401).send('Firma X-Hub-Signature-256 requerida');
            }
            const hmac = crypto.createHmac('sha256', appSecret);
            const expectedSig = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
            if (signature !== expectedSig) {
                console.warn('[WHATSAPP WEBHOOK] Firma inválida rechazada');
                return res.status(401).send('Firma no válida');
            }
        }

        const body = req.body;

        // Responder 200 inmediatamente a Meta para confirmar recepción
        res.status(200).send('EVENT_RECEIVED');

        if (body.object && body.entry) {
            for (const entry of body.entry) {
                const changes = entry.changes || [];
                for (const change of changes) {
                    const value = change.value;
                    const messages = value?.messages || [];
                    const contacts = value?.contacts || [];

                    for (const message of messages) {
                        if (message.type === 'text') {
                            const senderPhone = message.from;
                            const textBody = message.text?.body;
                            const contactName = contacts.find(c => c.wa_id === senderPhone)?.profile?.name || 'Contacto WhatsApp';

                            console.log(`[WHATSAPP REAL] Mensaje recibido de ${senderPhone} (${contactName}): ${textBody}`);

                            await whatsappAiService.processIncomingMessage({
                                mensaje: textBody,
                                telefonoRemitente: senderPhone,
                                nombreRemitente: contactName
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error en webhook de WhatsApp:', error);
    }
};

/**
 * Obtener historial de interacciones de WhatsApp.
 */
exports.getMessages = async (req, res) => {
    try {
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const { limit = 50 } = req.query;
        const where = {};
        if (campanaId) where.campana_id = campanaId;

        const messages = await WhatsAppMessage.findAll({
            where,
            include: [{ model: Campaign, as: 'campana', attributes: ['id', 'nombre', 'candidato', 'color'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit, 10)
        });

        res.json(messages);
    } catch (error) {
        console.error('Error al obtener mensajes de WhatsApp:', error);
        res.status(500).json({ message: 'Error al obtener mensajes', error: error.message });
    }
};

/**
 * Estadísticas consolidadas del Agente de WhatsApp.
 */
exports.getStats = async (req, res) => {
    try {
        const campanaId = req.campana_id || (req.query.campana_id ? parseInt(req.query.campana_id, 10) : null);
        const where = {};
        if (campanaId) where.campana_id = campanaId;

        const totalMessages = await WhatsAppMessage.count({ where });
        const messages = await WhatsAppMessage.findAll({ where, attributes: ['votantes_procesados', 'lider_registrado'] });

        const totalVotersIngested = messages.reduce((sum, m) => sum + (m.votantes_procesados || 0), 0);
        const totalLeadersRegistered = messages.filter(m => m.lider_registrado).length;

        res.json({
            totalMessages,
            totalVotersIngested,
            totalLeadersRegistered
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al calcular estadísticas', error: error.message });
    }
};

