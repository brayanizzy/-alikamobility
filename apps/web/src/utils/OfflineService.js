
// Offline/Online synchronization service
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const CACHE_PREFIX = 'alika_cache_';
const QUEUE_KEY = 'alika_sync_queue';

export const isOnline = () => {
  return navigator.onLine;
};

export const cacheData = (key, data) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
};

export const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    return JSON.parse(cached).data;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
};

// Queue a mutation to be synced later
export const queueMutation = (collection, action, data) => {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({
      id: crypto.randomUUID(),
      collection,
      action, // 'create', 'update', 'delete'
      data,
      timestamp: Date.now()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('alika:sync-queued'));
  } catch (error) {
    console.error('Failed to queue mutation:', error);
  }
};

let isSyncing = false;

export const syncQueue = async () => {
  if (!isOnline() || isSyncing) return;
  
  try {
    isSyncing = true;
    window.dispatchEvent(new CustomEvent('alika:sync-start'));
    
    const queueStr = localStorage.getItem(QUEUE_KEY);
    if (!queueStr) {
      window.dispatchEvent(new CustomEvent('alika:sync-end'));
      isSyncing = false;
      return;
    }
    
    const queue = JSON.parse(queueStr);
    if (queue.length === 0) {
      window.dispatchEvent(new CustomEvent('alika:sync-end'));
      isSyncing = false;
      return;
    }

    const failedItems = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          await pb.collection(item.collection).create(item.data, { $autoCancel: false });
        } else if (item.action === 'update') {
          await pb.collection(item.collection).update(item.data.id, item.data, { $autoCancel: false });
        } else if (item.action === 'delete') {
          await pb.collection(item.collection).delete(item.data.id, { $autoCancel: false });
        }
        successCount++;
      } catch (err) {
        console.error(`Failed to sync item ${item.id}:`, err);
        // If conflict or specific error, keep in failedItems to retry
        failedItems.push(item);
      }
    }

    localStorage.setItem(QUEUE_KEY, JSON.stringify(failedItems));
    
    if (successCount > 0) {
      toast.success(`${successCount} actions synchronisées avec le serveur`);
    }
    if (failedItems.length > 0) {
      window.dispatchEvent(new CustomEvent('alika:sync-error'));
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

// Setup auto-retry
setInterval(() => {
  if (isOnline()) {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (queue.length > 0) syncQueue();
  }
}, 30000); // Every 30 seconds

// Setup listeners
window.addEventListener('online', syncQueue);
