/**
 * TASK 8: Offline Cart System using IndexedDB
 * Stores pending orders locally so they survive network loss, tab close, and reload.
 */

const DB_NAME = 'webmaa_offline_db';
const DB_VERSION = 1;
const PENDING_STORE = 'pending_orders';
const CART_STORE = 'offline_cart';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject('No window');
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'localId' });
      }
      if (!db.objectStoreNames.contains(CART_STORE)) {
        db.createObjectStore(CART_STORE, { keyPath: 'shopId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Pending Order Store ─────────────────────────

/**
 * Save an order locally before sending to API.
 * @param {Object} order - Full order payload + localId
 */
export async function savePendingOrder(order) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).put(order);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all pending (failed) orders.
 */
export async function getPendingOrders() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readonly');
    const req = tx.objectStore(PENDING_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove a pending order after successful submission.
 */
export async function removePendingOrder(localId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PENDING_STORE, 'readwrite');
    tx.objectStore(PENDING_STORE).delete(localId);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

// ── Offline Cart Store (IndexedDB backup) ───────

/**
 * Save cart to IndexedDB (as a backup alongside localStorage).
 */
export async function saveCartIDB(shopId, items) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CART_STORE, 'readwrite');
      tx.objectStore(CART_STORE).put({ shopId, items, updatedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — localStorage is primary
  }
}

/**
 * Load cart from IndexedDB (fallback if localStorage is unavailable).
 */
export async function loadCartIDB(shopId) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CART_STORE, 'readonly');
      const req = tx.objectStore(CART_STORE).get(shopId);
      req.onsuccess = () => resolve(req.result?.items || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
