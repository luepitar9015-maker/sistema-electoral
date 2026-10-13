const SocialAccount = require('../models/SocialAccount');
const { syncAccountPostsAndComments } = require('./socialSyncService');

/**
 * socialSchedulerService
 * Motor de sincronización automática y periódica con control de cuotas y reintentos.
 */
let schedulerInterval = null;
let isSyncRunning = false;

async function runScheduledSweep() {
    if (isSyncRunning) {
        console.log('⏰ Sincronización programada previa aún en ejecución, omitiendo ciclo.');
        return;
    }

    isSyncRunning = true;
    try {
        const activeAccounts = await SocialAccount.findAll({
            where: { is_active: true }
        });

        const now = new Date();

        for (const account of activeAccounts) {
            const freqMinutes = account.frecuencia_sync_minutos || 60;
            const lastSync = account.ultimo_sync_exitoso ? new Date(account.ultimo_sync_exitoso) : null;

            // Verificar si es momento de sincronizar según la frecuencia configurada
            const shouldSync = !lastSync || ((now.getTime() - lastSync.getTime()) >= freqMinutes * 60 * 1000);

            if (shouldSync) {
                console.log(`⏰ Sincronizador automático: procesando cuenta ${account.handle} (${account.plataforma})...`);
                try {
                    await syncAccountPostsAndComments({
                        accountId: account.id,
                        campanaId: account.campana_id,
                        limit: 15,
                        syncOrigin: 'cron_automatico'
                    });
                    // Pequeña pausa entre cuentas para respetar límites de cuota de API
                    await new Promise(r => setTimeout(r, 2000));
                } catch (err) {
                    console.warn(`Aviso en sincronización programada de ${account.handle}:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('Error general en el ciclo de sincronización programada:', error);
    } finally {
        isSyncRunning = false;
    }
}

function startScheduler(intervalMs = 15 * 60 * 1000) { // Cada 15 minutos evalúa cuentas pendientes
    if (schedulerInterval) return;
    console.log('✓ Sincronizador programado de redes sociales iniciado (Ciclo cada 15 min).');
    // Ejecutar una evaluación inicial diferida a 30 segundos
    setTimeout(() => {
        runScheduledSweep().catch(e => console.warn('Aviso sweep inicial:', e.message));
    }, 30000);

    schedulerInterval = setInterval(() => {
        runScheduledSweep().catch(e => console.warn('Aviso sweep periódico:', e.message));
    }, intervalMs);
}

function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('Sincronizador programado de redes detenido.');
    }
}

module.exports = {
    startScheduler,
    stopScheduler,
    runScheduledSweep
};
