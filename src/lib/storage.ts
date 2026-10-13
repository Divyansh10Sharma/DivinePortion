// IOS-10: ask the browser to keep our IndexedDB data (best effort — iOS may still evict).

export type PersistenceStatus = 'persistent' | 'may-be-evicted' | 'unsupported';

export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  if (!navigator.storage?.persist) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'persistent';
    return (await navigator.storage.persist()) ? 'persistent' : 'may-be-evicted';
  } catch {
    return 'may-be-evicted';
  }
}

export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  if (!navigator.storage?.persisted) return 'unsupported';
  try {
    return (await navigator.storage.persisted()) ? 'persistent' : 'may-be-evicted';
  } catch {
    return 'may-be-evicted';
  }
}
