import {
  isOnline,
  syncQueue,
  getQueueItems,
  getPendingSyncCount,
  updateQueueItemStatus,
  removeQueueItem,
  clearSyncedQueueItems,
  getLastSyncTimestamp,
  getMetadata,
} from '@/utils/OfflineService.js';

const isSyncing = () => {
  let syncing = false;
  const handler = () => { syncing = true; };
  const endHandler = () => { syncing = false; };
  window.addEventListener('alika:sync-start', handler, { once: false });
  window.addEventListener('alika:sync-end', endHandler, { once: false });
  window.addEventListener('alika:sync-error', endHandler, { once: false });
  setTimeout(() => {
    window.removeEventListener('alika:sync-start', handler);
    window.removeEventListener('alika:sync-end', endHandler);
    window.removeEventListener('alika:sync-error', endHandler);
  }, 100);
  return syncing;
};

export const triggerSync = async () => {
  if (!isOnline()) return { synced: false, reason: 'offline' };
  if (document.querySelector('[data-syncing]')) return { synced: false, reason: 'already_syncing' };
  try {
    await syncQueue();
    const remaining = await getPendingSyncCount();
    return { synced: remaining === 0, remaining };
  } catch (e) {
    return { synced: false, reason: e.message };
  }
};

export const getSyncSummary = async () => {
  const queue = await getQueueItems();
  return {
    total: queue.length,
    pending: queue.filter((i) => i.sync_status === 'pending').length,
    syncing: queue.filter((i) => i.sync_status === 'syncing').length,
    synced: queue.filter((i) => i.sync_status === 'synced').length,
    failed: queue.filter((i) => i.sync_status === 'failed').length,
    conflict: queue.filter((i) => i.sync_status === 'conflict').length,
  };
};

export const getQueueItemsByStatus = async (status) => {
  return getQueueItems(status);
};

export const retryQueueItem = async (itemId) => {
  await updateQueueItemStatus(itemId, { sync_status: 'pending', last_error: null, attempts: 0 });
  if (isOnline()) syncQueue();
};

export const retryAllFailed = async () => {
  const failed = await getQueueItems('failed');
  for (const item of failed) {
    await updateQueueItemStatus(item.id, { sync_status: 'pending', last_error: null, attempts: 0 });
  }
  if (isOnline()) syncQueue();
};

export const clearSyncedItems = async () => {
  await clearSyncedQueueItems();
};

export const formatLastSync = async () => {
  const ts = await getLastSyncTimestamp();
  if (!ts) return 'Jamais';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const getNetworkStatus = () => {
  return {
    online: isOnline(),
    type: isOnline() ? (navigator.connection?.effectiveType || 'unknown') : 'offline',
  };
};

export { isOnline, getLastSyncTimestamp, getPendingSyncCount, getQueueItems, removeQueueItem };
