/**
 * IndexedDB utility for Bnusa Platform
 * Handles offline data storage and synchronization
 */

// Database name and version
const DB_NAME = 'bnusa-offline-db';
const DB_VERSION = 1;

// Store names
const STORES = {
  PENDING_UPLOADS: 'pendingUploads',
  ARTICLES: 'articles',
  USER_DATA: 'userData',
  CACHED_IMAGES: 'cachedImages'
};

/**
 * Initialize the IndexedDB database
 */
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser doesn\'t support IndexedDB'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Error opening IndexedDB'));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PENDING_UPLOADS)) {
        const pendingUploadsStore = db.createObjectStore(STORES.PENDING_UPLOADS, { keyPath: 'id', autoIncrement: true });
        pendingUploadsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.ARTICLES)) {
        const articlesStore = db.createObjectStore(STORES.ARTICLES, { keyPath: 'id' });
        articlesStore.createIndex('slug', 'slug', { unique: true });
        articlesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CACHED_IMAGES)) {
        const cachedImagesStore = db.createObjectStore(STORES.CACHED_IMAGES, { keyPath: 'url' });
        cachedImagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

/**
 * Get a reference to the database
 */
export const getDB = async (): Promise<IDBDatabase> => {
  try {
    return await initializeDB();
  } catch (error) {
    console.error('Failed to get IndexedDB:', error);
    throw error;
  }
};

/**
 * Perform a transaction on a specific store
 */
const withStore = async <T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    const request = callback(store);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Add a pending image upload to be processed when online
 */
export const addPendingUpload = async (uploadData: {
  file: Blob,
  fileName: string, 
  mimeType: string,
  folder: string,
  headers: Record<string, string>
}): Promise<number> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_UPLOADS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_UPLOADS);
    
    const request = store.add({
      ...uploadData,
      timestamp: Date.now(),
      attempts: 0
    });
    
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all pending uploads
 */
export const getPendingUploads = async (): Promise<any[]> => {
  return withStore<any[]>(STORES.PENDING_UPLOADS, 'readonly', (store) => {
    return store.getAll();
  });
};

/**
 * Remove a pending upload by ID
 */
export const removePendingUpload = async (id: number): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.PENDING_UPLOADS, 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_UPLOADS);
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save article data for offline access
 */
export const saveArticle = async (article: any): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.ARTICLES, 'readwrite');
    const store = transaction.objectStore(STORES.ARTICLES);
    
    article.timestamp = Date.now();
    const request = store.put(article);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get an article by ID
 */
export const getArticleById = async (id: string): Promise<any> => {
  return withStore<any>(STORES.ARTICLES, 'readonly', (store) => {
    return store.get(id);
  });
};

/**
 * Get an article by slug
 */
export const getArticleBySlug = async (slug: string): Promise<any> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.ARTICLES, 'readonly');
    const store = transaction.objectStore(STORES.ARTICLES);
    const index = store.index('slug');
    const request = index.get(slug);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all saved articles
 */
export const getAllArticles = async (): Promise<any[]> => {
  return withStore<any[]>(STORES.ARTICLES, 'readonly', (store) => {
    return store.getAll();
  });
};

/**
 * Save user data for offline access
 */
export const saveUserData = async (userData: any): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.USER_DATA, 'readwrite');
    const store = transaction.objectStore(STORES.USER_DATA);
    
    userData.timestamp = Date.now();
    const request = store.put(userData);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get user data
 */
export const getUserData = async (userId: string): Promise<any> => {
  return withStore<any>(STORES.USER_DATA, 'readonly', (store) => {
    return store.get(userId);
  });
};

/**
 * Save image data (URL and metadata) for offline access
 */
export const saveImageCache = async (imageData: {
  url: string,
  data?: Blob,
  metadata?: any
}): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CACHED_IMAGES, 'readwrite');
    const store = transaction.objectStore(STORES.CACHED_IMAGES);
    
    const request = store.put({
      ...imageData,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get cached image data
 */
export const getCachedImage = async (url: string): Promise<any> => {
  return withStore<any>(STORES.CACHED_IMAGES, 'readonly', (store) => {
    return store.get(url);
  });
};

/**
 * Clean up old cached data
 */
export const cleanupOldCache = async (maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> => {
  const now = Date.now();
  const cutoff = now - maxAge;
  
  // Clean up old articles
  const articles = await getAllArticles();
  const db = await getDB();
  const articleTransaction = db.transaction(STORES.ARTICLES, 'readwrite');
  const articleStore = articleTransaction.objectStore(STORES.ARTICLES);
  
  articles.forEach(article => {
    if (article.timestamp < cutoff) {
      articleStore.delete(article.id);
    }
  });
  
  // Clean up old cached images
  const imageTransaction = db.transaction(STORES.CACHED_IMAGES, 'readwrite');
  const imageStore = imageTransaction.objectStore(STORES.CACHED_IMAGES);
  const imageIndex = imageStore.index('timestamp');
  
  const imageCursorRequest = imageIndex.openCursor(IDBKeyRange.upperBound(cutoff));
  
  imageCursorRequest.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      imageStore.delete(cursor.value.url);
      cursor.continue();
    }
  };
};

// Register background sync if available
export const registerBackgroundSync = () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration: ServiceWorkerRegistration) => {
      // The sync property may not be recognized by TypeScript but it exists in supported browsers
      return (registration as any).sync.register('sync-pending-uploads');
    }).catch((err: Error) => {
      console.error('Background sync registration failed:', err);
    });
  }
};

// Export store names for reference
export const STORE_NAMES = STORES; 