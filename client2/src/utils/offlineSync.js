import { API } from '../config/api';

const OFFLINE_QUEUE_KEY = 'electoral_offline_votes_queue';

export const offlineSync = {
    isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true,

    getQueue: () => {
        try {
            const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    saveQueue: (queue) => {
        try {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        } catch (e) {
            console.error('Error guardando cola offline:', e);
        }
    },

    queueCheckIn: (voter) => {
        const queue = offlineSync.getQueue();
        const existingIndex = queue.findIndex(item => item.voterId === voter.id || item.cedula === voter.cedula);
        const record = {
            voterId: voter.id,
            cedula: voter.cedula,
            nombres: `${voter.nombres} ${voter.apellidos}`,
            puesto: voter.lugar_votacion,
            mesa: voter.mesa,
            hora_voto: new Date().toISOString(),
            offlineTimestamp: Date.now()
        };

        if (existingIndex >= 0) {
            queue[existingIndex] = record;
        } else {
            queue.push(record);
        }
        offlineSync.saveQueue(queue);
        return queue.length;
    },

    removeCompleted: (count) => {
        const queue = offlineSync.getQueue();
        offlineSync.saveQueue(queue.slice(count));
    },

    syncNow: async (token) => {
        const queue = offlineSync.getQueue();
        if (queue.length === 0) return { synced: 0, pending: 0 };
        if (!navigator.onLine) return { synced: 0, pending: queue.length, offline: true };

        try {
            const response = await fetch(`${API}/dia-d/sync-offline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ checkIns: queue })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.removeItem(OFFLINE_QUEUE_KEY);
                return { synced: data.procesados || queue.length, pending: 0, success: true };
            } else {
                return { synced: 0, pending: queue.length, error: true };
            }
        } catch (err) {
            console.error('Error enviando sincronización offline:', err);
            return { synced: 0, pending: queue.length, error: true };
        }
    }
};

// Listener automático cuando vuelve el internet
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        const queue = offlineSync.getQueue();
        if (queue.length > 0) {
            console.log(`[OFFLINE SYNC] Internet reestablecido. ${queue.length} registros listos para sincronizar.`);
            const token = localStorage.getItem('token');
            if (token) {
                offlineSync.syncNow(token).then(res => {
                    if (res.success) {
                        window.dispatchEvent(new CustomEvent('electoral-offline-synced', { detail: res }));
                    }
                });
            }
        }
    });
}
