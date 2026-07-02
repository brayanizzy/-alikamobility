import pb from '@/lib/apiClient';
import { toast } from 'sonner';

const DB_NAME = 'alikaOfflineDB';
const DB_VERSION = 4;
const STORES = {
  MEMBERS: 'members',
  MEMBER_CARDS: 'member_cards',
  DEBTS: 'debts',
  PARKINGS: 'parkings',
  PAYMENTS: 'payments',
  QUEUE: 'sync_queue',
  SCAN_HISTORY: 'scan_history',
  CACHE: 'api_cache',
  METADATA: 'metadata',
};

const SCAN_HISTORY_MAX = 100;
const SYNC_RETRY_MAX_ATTEMPTS = 10;
const SYNC_RETRY_BASE_MS = 2000;
const SYNC_INTERVAL_MS = 30000;

// ─────────────────────────────────────────────────────────────
// IndexedDB - initialisation et helpers
// ─────────────────────────────────────────────────────────────

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const allStores = [
        STORES.MEMBERS, STORES.MEMBER_CARDS, STORES.DEBTS, STORES.PARKINGS, STORES.PAYMENTS,
        STORES.QUEUE, STORES.SCAN_HISTORY, STORES.CACHE, STORES.METADATA,
      ];
      for (const name of allStores) {
        if (!db.objectStoreNames.contains(name)) {
          const opts = (name === STORES.QUEUE || name === STORES.SCAN_HISTORY)
            ? { keyPath: 'id', autoIncrement: true }
            : { keyPath: 'id' };
          db.createObjectStore(name, opts);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (storeName, mode, callback) => {
  const db = await openDB();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await callback(store);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
};

const getAllFromStore = (store) =>
  new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

const putInStore = (store, data) =>
  new Promise((resolve, reject) => {
    const req = store.put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const clearStore = (store) =>
  new Promise((resolve, reject) => {
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

const countFromStore = (store) =>
  new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// ─────────────────────────────────────────────────────────────
// Members
// ─────────────────────────────────────────────────────────────

export const syncMembersToDB = async (members) => {
  try {
    await withStore(STORES.MEMBERS, 'readwrite', async (store) => {
      for (const member of members) {
        await putInStore(store, member);
      }
    });
  } catch (error) {
    console.error('Failed to sync members to IndexedDB:', error);
  }
};

export const getMembersFromDB = async (organizationId = null) => {
  try {
    const all = await withStore(STORES.MEMBERS, 'readonly', getAllFromStore);
    if (organizationId) return all.filter((m) => m.organization_id === organizationId);
    return all;
  } catch (error) {
    console.error('Failed to get members from IndexedDB:', error);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// Member Cards
// ─────────────────────────────────────────────────────────────

export const syncMemberCardsToDB = async (cards) => {
  try {
    await withStore(STORES.MEMBER_CARDS, 'readwrite', async (store) => {
      for (const card of cards) {
        await putInStore(store, card);
      }
    });
  } catch (error) {
    console.error('Failed to sync member cards to IndexedDB:', error);
  }
};

export const getMemberCardFromDB = async (cardNumber) => {
  try {
    const all = await withStore(STORES.MEMBER_CARDS, 'readonly', getAllFromStore);
    return all.find(c => c.card_number === cardNumber) || null;
  } catch {
    return null;
  }
};

export const getMemberCardByMemberId = async (memberId) => {
  try {
    const all = await withStore(STORES.MEMBER_CARDS, 'readonly', getAllFromStore);
    return all.find(c => c.member_id === memberId) || null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Debts
// ─────────────────────────────────────────────────────────────

export const syncDebtsToDB = async (debts) => {
  try {
    await withStore(STORES.DEBTS, 'readwrite', async (store) => {
      for (const debt of debts) {
        await putInStore(store, debt);
      }
    });
  } catch (error) {
    console.error('Failed to sync debts to IndexedDB:', error);
  }
};

export const getDebtsFromDB = async (memberId = null) => {
  try {
    const all = await withStore(STORES.DEBTS, 'readonly', getAllFromStore);
    if (memberId) return all.filter(d => d.member_id === memberId);
    return all;
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// Parkings
// ─────────────────────────────────────────────────────────────

export const syncParkingsToDB = async (parkings) => {
  try {
    await withStore(STORES.PARKINGS, 'readwrite', async (store) => {
      await clearStore(store);
      for (const p of parkings) {
        await putInStore(store, p);
      }
    });
  } catch (error) {
    console.error('Failed to sync parkings to IndexedDB:', error);
  }
};

export const getParkingsFromDB = async () => {
  try {
    return await withStore(STORES.PARKINGS, 'readonly', getAllFromStore);
  } catch (error) {
    console.error('Failed to get parkings from IndexedDB:', error);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// Payments / History
// ─────────────────────────────────────────────────────────────

export const syncPaymentsToDB = async (payments) => {
  try {
    await withStore(STORES.PAYMENTS, 'readwrite', async (store) => {
      for (const p of payments) {
        await putInStore(store, p);
      }
    });
  } catch (error) {
    console.error('Failed to sync payments to IndexedDB:', error);
  }
};

export const getPaymentsFromDB = async () => {
  try {
    return await withStore(STORES.PAYMENTS, 'readonly', getAllFromStore);
  } catch (error) {
    console.error('Failed to get payments from IndexedDB:', error);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// Scan History (IndexedDB)
// ─────────────────────────────────────────────────────────────

export const getScanHistory = async () => {
  try {
    return await withStore(STORES.SCAN_HISTORY, 'readonly', getAllFromStore);
  } catch {
    return [];
  }
};

export const addScanToHistory = async (member) => {
  try {
    await withStore(STORES.SCAN_HISTORY, 'readwrite', async (store) => {
      const entry = {
        memberId: member.id,
        memberName: member.name,
        memberCode: member.member_code || null,
        timestamp: Date.now(),
      };
      await putInStore(store, entry);
      const count = await countFromStore(store);
      if (count > SCAN_HISTORY_MAX) {
        const all = await getAllFromStore(store);
        const excess = all.sort((a, b) => a.timestamp - b.timestamp).slice(0, count - SCAN_HISTORY_MAX);
        for (const e of excess) {
          store.delete(e.id);
        }
      }
    });
    window.dispatchEvent(new CustomEvent('alika:scan-added'));
  } catch (error) {
    console.error('Failed to add scan to history:', error);
  }
};

export const clearScanHistory = async () => {
  try {
    await withStore(STORES.SCAN_HISTORY, 'readwrite', clearStore);
    window.dispatchEvent(new CustomEvent('alika:scan-cleared'));
  } catch (error) {
    console.error('Failed to clear scan history:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// Sync Queue (IndexedDB)
// ─────────────────────────────────────────────────────────────

const QSTATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed',
  CONFLICT: 'conflict',
};

export const queueMutation = async (collection, action, data) => {
  try {
    if (collection === 'payments' && data.client_payment_id) {
      const existing = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
      const alreadyQueued = existing.some(
        (item) =>
          item.collection === 'payments' &&
          item.data?.client_payment_id === data.client_payment_id &&
          (item.sync_status === QSTATUS.PENDING || item.sync_status === QSTATUS.SYNCING)
      );
      if (alreadyQueued) return;
    }

    await withStore(STORES.QUEUE, 'readwrite', async (store) => {
      await putInStore(store, {
        collection,
        action,
        data,
        timestamp: Date.now(),
        attempts: 0,
        lastAttempt: null,
        sync_status: QSTATUS.PENDING,
        last_error: null,
      });
    });

    window.dispatchEvent(new CustomEvent('alika:sync-queued'));
    window.dispatchEvent(new CustomEvent('alika:sync-count-changed'));
  } catch (error) {
    console.error('Failed to queue mutation:', error);
  }
};

export const getPendingSyncCount = async (status = null) => {
  try {
    if (!status) return await withStore(STORES.QUEUE, 'readonly', countFromStore);
    const all = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
    return all.filter((item) => item.sync_status === status).length;
  } catch {
    return 0;
  }
};

export const getQueueItems = async (statusFilter = null) => {
  try {
    const all = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
    if (statusFilter) return all.filter((item) => item.sync_status === statusFilter);
    return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch {
    return [];
  }
};

export const updateQueueItemStatus = async (itemId, updates) => {
  try {
    await withStore(STORES.QUEUE, 'readwrite', async (store) => {
      const item = await new Promise((resolve, reject) => {
        const req = store.get(itemId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (item) {
        Object.assign(item, updates);
        await putInStore(store, item);
      }
    });
    window.dispatchEvent(new CustomEvent('alika:sync-count-changed'));
  } catch (error) {
    console.error('Failed to update queue item:', error);
  }
};

export const removeQueueItem = async (itemId) => {
  try {
    await withStore(STORES.QUEUE, 'readwrite', async (store) => {
      store.delete(itemId);
    });
    window.dispatchEvent(new CustomEvent('alika:sync-count-changed'));
  } catch (error) {
    console.error('Failed to remove queue item:', error);
  }
};

export const clearSyncedQueueItems = async () => {
  try {
    await withStore(STORES.QUEUE, 'readwrite', async (store) => {
      const all = await getAllFromStore(store);
      for (const item of all) {
        if (item.sync_status === QSTATUS.SYNCED || item.sync_status === QSTATUS.CONFLICT) {
          store.delete(item.id);
        }
      }
    });
    window.dispatchEvent(new CustomEvent('alika:sync-count-changed'));
  } catch (error) {
    console.error('Failed to clear synced items:', error);
  }
};

let isSyncing = false;
let syncTimer = null;

const getRetryDelay = (attempts) => {
  return Math.min(SYNC_RETRY_BASE_MS * Math.pow(2, attempts), 60000);
};

export const syncQueue = async () => {
  if (!isOnline() || isSyncing) return;
  if (!pb.authStore.isValid) return;

  try {
    isSyncing = true;
    window.dispatchEvent(new CustomEvent('alika:sync-start'));

    const queue = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
    const pending = queue.filter(
      (item) => item.sync_status === QSTATUS.PENDING || item.sync_status === QSTATUS.FAILED
    );

    if (pending.length === 0) {
      await setLastSyncTimestamp(Date.now());
      window.dispatchEvent(new CustomEvent('alika:sync-end'));
      isSyncing = false;
      return;
    }

    let successCount = 0;

    for (const item of pending) {
      await updateQueueItemStatus(item.id, { sync_status: QSTATUS.SYNCING });

      try {
        let result;
        if (item.action === 'create') {
          result = await pb.collection(item.collection).create(item.data, { $autoCancel: false });
        } else if (item.action === 'update') {
          result = await pb.collection(item.collection).update(item.data.id, item.data, { $autoCancel: false });
        } else if (item.action === 'delete') {
          await pb.collection(item.collection).delete(item.data.id, { $autoCancel: false });
        }

        const isDuplicate =
          result?.status === 'duplicate' ||
          (result?.error && result.error.includes('client_payment_id'));

        await updateQueueItemStatus(item.id, {
          sync_status: isDuplicate ? QSTATUS.CONFLICT : QSTATUS.SYNCED,
          lastAttempt: Date.now(),
          last_error: isDuplicate ? 'Doublon détecté (client_payment_id existant)' : null,
        });
        successCount++;
      } catch (err) {
        console.error(`Sync failed for item ${item.id}:`, err);
        const statusCode = err.status || err.httpStatus || 0;
        const isFatal = statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429;
        const isDuplicate = statusCode === 409 || (err.response?.error || '').includes('client_payment_id');
        const attempts = (item.attempts || 0) + 1;

        if (isDuplicate) {
          await updateQueueItemStatus(item.id, {
            sync_status: QSTATUS.CONFLICT,
            attempts,
            lastAttempt: Date.now(),
            last_error: 'Doublon client_payment_id',
          });
          successCount++;
        } else if (isFatal || attempts >= SYNC_RETRY_MAX_ATTEMPTS) {
          await updateQueueItemStatus(item.id, {
            sync_status: QSTATUS.FAILED,
            attempts,
            lastAttempt: Date.now(),
            last_error: isFatal
              ? `Erreur ${statusCode} — ${err.message || 'Données invalides'}`
              : `Échec après ${SYNC_RETRY_MAX_ATTEMPTS} tentatives`,
          });
        } else {
          await updateQueueItemStatus(item.id, {
            sync_status: QSTATUS.PENDING,
            attempts,
            lastAttempt: Date.now(),
            last_error: `${err.message || 'Erreur réseau'} (tentative ${attempts}/${SYNC_RETRY_MAX_ATTEMPTS})`,
          });
        }
      }
    }

    await setLastSyncTimestamp(Date.now());

    if (successCount > 0) {
      toast.success(`${successCount} opération${successCount > 1 ? 's' : ''} synchronisée${successCount > 1 ? 's' : ''}`);
      window.dispatchEvent(new CustomEvent('alika:sync-count-changed'));
    }

    const remaining = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
    const stillPending = remaining.filter(
      (item) => item.sync_status === QSTATUS.PENDING || item.sync_status === QSTATUS.FAILED
    );

    if (stillPending.length > 0) {
      window.dispatchEvent(new CustomEvent('alika:sync-error'));
      scheduleNextSync();
    } else {
      window.dispatchEvent(new CustomEvent('alika:sync-end'));
    }
  } catch (error) {
    console.error('Sync process failed:', error);
    window.dispatchEvent(new CustomEvent('alika:sync-error'));
  } finally {
    isSyncing = false;
  }
};

const scheduleNextSync = async () => {
  if (syncTimer) clearTimeout(syncTimer);
  const queue = await withStore(STORES.QUEUE, 'readonly', getAllFromStore);
  const pending = queue.filter(
    (item) => item.sync_status === QSTATUS.PENDING || item.sync_status === QSTATUS.FAILED
  );
  if (pending.length === 0) return;
  const maxDelay = Math.max(...pending.map((i) => getRetryDelay(i.attempts || 0)));
  syncTimer = setTimeout(() => {
    if (isOnline()) syncQueue();
  }, maxDelay);
};

// ─────────────────────────────────────────────────────────────
// API Cache (IndexedDB)
// ─────────────────────────────────────────────────────────────

export const cacheData = async (key, data) => {
  try {
    await withStore(STORES.CACHE, 'readwrite', async (store) => {
      await putInStore(store, { id: key, data, timestamp: Date.now() });
    });
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
};

export const getCachedData = async (key) => {
  try {
    return await withStore(STORES.CACHE, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result?.data ?? null);
        req.onerror = () => reject(req.error);
      });
    });
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
};

export const clearExpiredCache = async (maxAgeMs = 3600000) => {
  try {
    await withStore(STORES.CACHE, 'readwrite', async (store) => {
      const all = await getAllFromStore(store);
      const now = Date.now();
      for (const entry of all) {
        if (now - (entry.timestamp || 0) > maxAgeMs) {
          store.delete(entry.id);
        }
      }
    });
  } catch (error) {
    console.error('Failed to clear expired cache:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────

export const setLastSyncTimestamp = async (timestamp) => {
  try {
    await withStore(STORES.METADATA, 'readwrite', async (store) => {
      await putInStore(store, { id: 'last_sync', value: timestamp });
    });
  } catch (error) {
    console.error('Failed to set last sync timestamp:', error);
  }
};

export const getLastSyncTimestamp = async () => {
  try {
    return await withStore(STORES.METADATA, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get('last_sync');
        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => reject(req.error);
      });
    });
  } catch {
    return null;
  }
};

export const setMetadata = async (key, value) => {
  try {
    await withStore(STORES.METADATA, 'readwrite', async (store) => {
      await putInStore(store, { id: key, value });
    });
  } catch (error) {
    console.error('Failed to set metadata:', error);
  }
};

export const getMetadata = async (key) => {
  try {
    return await withStore(STORES.METADATA, 'readonly', async (store) => {
      return new Promise((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => reject(req.error);
      });
    });
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Cache readiness helpers — cache data for offline use
// ─────────────────────────────────────────────────────────────

const CACHE_MEMBERS_KEY = 'members_list';

export const ensureMembersCached = async (orgId, parkingId) => {
  if (!isOnline()) return;
  try {
    const filter = [`organization_id = "${orgId}"`];
    if (parkingId) filter.push(`parking_id = "${parkingId}"`);
    const members = await pb.collection('members').getAllPaginated({ filter: filter.join(' && '), $autoCancel: false });
    await cacheData(CACHE_MEMBERS_KEY, members);
    await syncMembersToDB(members);
  } catch (e) {
    console.error('Failed to cache members:', e);
  }
};

export const ensureMemberCardsCached = async (orgId) => {
  if (!isOnline()) return;
  try {
    const cards = await pb.collection('member_cards').getList(1, 500, {
      filter: `organization_id = "${orgId}" && status = "active"`,
      $autoCancel: false,
    });
    await syncMemberCardsToDB(cards.items || []);
  } catch (e) {
    console.error('Failed to cache member cards:', e);
  }
};

export const ensureDebtsCached = async (orgId) => {
  if (!isOnline()) return;
  try {
    const debts = await pb.collection('debts').getList(1, 200, {
      filter: `organization_id = "${orgId}" && status IN ("pending","partially_paid")`,
      sort: '-created',
      $autoCancel: false,
    });
    await syncDebtsToDB(debts.items || []);
  } catch (e) {
    console.error('Failed to cache debts:', e);
  }
};

// ─────────────────────────────────────────────────────────────
// client_payment_id generator
// ─────────────────────────────────────────────────────────────

export const generateClientPaymentId = (agentId, memberId) => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `offline_${agentId}_${ts}_${rand}`;
};

// ─────────────────────────────────────────────────────────────
// Connectivity
// ─────────────────────────────────────────────────────────────

export const isOnline = () => navigator.onLine;

// ─────────────────────────────────────────────────────────────
// Auto-sync
// ─────────────────────────────────────────────────────────────

const autoSyncCheck = async () => {
  if (!isOnline()) return;
  const count = await getPendingSyncCount();
  if (count > 0 && !isSyncing) syncQueue();
};

setInterval(autoSyncCheck, SYNC_INTERVAL_MS);
window.addEventListener('online', syncQueue);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') autoSyncCheck();
});
