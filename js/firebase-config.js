/**
 * MadeByMitzi — Phase 2 Cloud Database Service (Firebase Firestore)
 * 
 * Provides seamless cloud synchronization between local browser storage (localStorage)
 * and Google Cloud Firestore. If Firebase credentials are not yet configured, the system
 * gracefully falls back to local high-availability storage without errors.
 */

const FirebaseService = {
  db: null,
  app: null,
  isInitialized: false,

  // Default Production Firebase Cloud Database Configuration
  DEFAULT_CONFIG: {
    apiKey: "AIzaSyDbrdkhW1PUG94N2K0xoR-V9-VcmPMcYw0",
    authDomain: "madebymitzi-store.firebaseapp.com",
    projectId: "madebymitzi-store",
    storageBucket: "madebymitzi-store.firebasestorage.app",
    messagingSenderId: "1054421281150",
    appId: "1:1054421281150:web:6f2a0eade70f675e322b2f",
    measurementId: "G-D1824348H4"
  },

  // Default / stored config
  getConfig() {
    try {
      const stored = JSON.parse(localStorage.getItem('mbm_firebase_config'));
      if (stored && stored.apiKey && stored.projectId) return stored;
    } catch {}
    return this.DEFAULT_CONFIG;
  },

  saveConfig(config) {
    localStorage.setItem('mbm_firebase_config', JSON.stringify(config));
  },

  /**
   * Initializes Firebase using compat SDK
   */
  async init() {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return false;
    }

    try {
      // Ensure Firebase scripts are loaded
      await this.ensureFirebaseLoaded();

      if (window.firebase && !window.firebase.apps.length) {
        this.app = window.firebase.initializeApp(config);
        this.db = window.firebase.firestore();
        this.isInitialized = true;
        console.log('✅ Firebase Firestore Cloud DB connected successfully for project:', config.projectId);
      } else if (window.firebase && window.firebase.apps.length) {
        this.app = window.firebase.app();
        this.db = window.firebase.firestore();
        this.isInitialized = true;
      }

      if (this.isInitialized && window.firebase && typeof window.firebase.analytics === 'function' && config.measurementId) {
        try {
          this.analytics = window.firebase.analytics();
          console.log('📊 Firebase Analytics active (' + config.measurementId + ')');
        } catch (e) {}
      }

      if (this.isInitialized || true) {
        // 1. Initial product sync with Cloud Firestore as authoritative source
        this.fetchProducts().then(cloudProds => {
          if (typeof window.DB !== 'undefined' && Array.isArray(cloudProds)) {
            const cleanedCloudProds = cloudProds.filter(cp => !window.DB.isTestProduct(cp));
            cleanedCloudProds.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            window.DB.setProducts(cleanedCloudProds);
            window.dispatchEvent(new CustomEvent('mbm_products_synced', { detail: cleanedCloudProds }));
          }
        }).catch((err) => console.warn('Initial fetchProducts error:', err));

        // 2. Initial orders sync
        this.fetchOrders().then(cloudOrders => {
          if (typeof window.DB !== 'undefined') {
            window.DB.setOrders(cloudOrders || []);
            window.dispatchEvent(new CustomEvent('mbm_orders_synced', { detail: cloudOrders || [] }));
          }
        }).catch(() => {});

        // 3. Initial settings sync (Dispatches live UI update on initial fetch)
        this.fetchSettings().then(cloudSettings => {
          if (cloudSettings && typeof window.DB !== 'undefined') {
            const current = window.DB.getSettings();
            const merged = { ...current, ...cloudSettings };
            window.DB.set(window.DB.KEYS.SETTINGS, merged);
            window.dispatchEvent(new CustomEvent('mbm_settings_synced', { detail: merged }));
          }
        }).catch(() => {});

        // 4. Real-time live Firestore listener for Products
        if (this.db) {
          try {
            this.db.collection('mbm_products').onSnapshot(snapshot => {
              if (typeof window.DB !== 'undefined') {
                const cloudProds = [];
                snapshot.forEach(doc => {
                  const data = doc.data();
                  if (!window.DB.isTestProduct(data)) {
                    cloudProds.push(data);
                  }
                });
                cloudProds.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                window.DB.setProducts(cloudProds);
                window.dispatchEvent(new CustomEvent('mbm_products_synced', { detail: cloudProds }));
              }
            }, err => console.warn('Products live listener notice:', err.message));
          } catch (e) {}
        }

        // 5. Real-time live Firestore listener for Orders
        if (this.db) {
          try {
            this.db.collection('mbm_orders').onSnapshot(snapshot => {
              if (typeof window.DB !== 'undefined') {
                const cloudOrders = [];
                if (!snapshot.empty) {
                  snapshot.forEach(doc => cloudOrders.push(doc.data()));
                  cloudOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                }
                window.DB.setOrders(cloudOrders);
                window.dispatchEvent(new CustomEvent('mbm_orders_synced', { detail: cloudOrders }));
              }
            }, err => console.warn('Orders live listener notice:', err.message));
          } catch (e) {}
        }

        // 6. Real-time live Firestore listener for Settings
        if (this.db) {
          try {
            this.db.collection('mbm_settings').doc('main_settings').onSnapshot(doc => {
              if (doc.exists && typeof window.DB !== 'undefined') {
                const current = window.DB.getSettings();
                const merged = { ...current, ...doc.data() };
                window.DB.set(window.DB.KEYS.SETTINGS, merged);
                window.dispatchEvent(new CustomEvent('mbm_settings_synced', { detail: merged }));
              }
            }, err => console.warn('Settings live listener notice:', err.message));
          } catch (e) {}
        }

        return true;
      }
    } catch (err) {
      console.warn('Firebase init error (using offline fallback):', err.message);
      this.isInitialized = false;
    }
    return false;
    return false;
  },

  /**
   * Dynamically loads Firebase SDK scripts if not already present on the page
   */
  ensureFirebaseLoaded() {
    return new Promise((resolve, reject) => {
      if (window.firebase && window.firebase.firestore) {
        return resolve();
      }

      const scriptApp = document.createElement('script');
      scriptApp.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js';
      scriptApp.onload = () => {
        const scriptFirestore = document.createElement('script');
        scriptFirestore.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js';
        scriptFirestore.onload = () => {
          const config = this.getConfig();
          if (config && config.measurementId) {
            const scriptAnalytics = document.createElement('script');
            scriptAnalytics.src = 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics-compat.js';
            scriptAnalytics.onload = () => resolve();
            scriptAnalytics.onerror = () => resolve(); // don't fail if analytics blocked
            document.head.appendChild(scriptAnalytics);
          } else {
            resolve();
          }
        };
        scriptFirestore.onerror = (e) => reject(new Error('Failed to load Firebase Firestore script'));
        document.head.appendChild(scriptFirestore);
      };
      scriptApp.onerror = (e) => reject(new Error('Failed to load Firebase App script'));
      document.head.appendChild(scriptApp);
    });
  },

  /**
   * Test connection with a provided configuration object
   */
  async testConnection(config) {
    try {
      await this.ensureFirebaseLoaded();
      const testAppName = 'test_app_' + Date.now();
      const testApp = window.firebase.initializeApp(config, testAppName);
      const testDb = testApp.firestore();
      
      // Perform a ping read/write in a health-check document
      const pingRef = testDb.collection('mbm_system').doc('health_check');
      await pingRef.set({
        status: 'online',
        testedAt: new Date().toISOString(),
        client: 'MadeByMitzi Admin'
      });

      // Cleanup test app
      await testApp.delete();
      return { success: true, message: 'Cloud Firestore connected and ping succeeded! 🎉' };
    } catch (err) {
      return { success: false, message: 'Connection failed: ' + err.message };
    }
  },

  /**
   * Sync an order directly to Firestore
   */
  async syncOrder(order) {
    if (!this.isInitialized || !this.db) return false;
    try {
      await this.db.collection('mbm_orders').doc(order.id).set(order);
      return true;
    } catch (err) {
      console.warn('Error syncing order to Firestore:', err);
      return false;
    }
  },

  /**
   * Remove undefined fields recursively before writing to Firestore
   * Ensures numbers, arrays, and nested structures are strictly clean
   */
  sanitizeProduct(product) {
    function cleanObj(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObj).filter(x => x !== undefined);
      const res = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
          res[k] = (typeof v === 'object' && v !== null) ? cleanObj(v) : v;
        }
      }
      return res;
    }
    const clean = cleanObj(product);
    if (clean.price !== undefined) {
      clean.price = Number(clean.price) || 0;
    }
    if (!clean.status) {
      clean.status = 'active';
    }
    return clean;
  },

  // ── FIRESTORE REST API SERIALIZERS & DIRECT HTTP ENGINE ──
  toFirestoreValue(val) {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return { integerValue: val.toString() };
      return { doubleValue: val };
    }
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) {
      return {
        arrayValue: {
          values: val.map(item => this.toFirestoreValue(item))
        }
      };
    }
    if (typeof val === 'object') {
      return {
        mapValue: {
          fields: this.toFirestoreFields(val)
        }
      };
    }
    return { stringValue: String(val) };
  },

  toFirestoreFields(obj) {
    const fields = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        fields[k] = this.toFirestoreValue(v);
      }
    }
    return fields;
  },

  fromFirestoreValue(val) {
    if (!val || typeof val !== 'object') return null;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('nullValue' in val) return null;
    if ('timestampValue' in val) return val.timestampValue;
    if ('arrayValue' in val) {
      return (val.arrayValue.values || []).map(item => this.fromFirestoreValue(item));
    }
    if ('mapValue' in val) {
      return this.fromFirestoreFields(val.mapValue.fields || {});
    }
    return null;
  },

  fromFirestoreFields(fields) {
    const obj = {};
    for (const [k, v] of Object.entries(fields || {})) {
      obj[k] = this.fromFirestoreValue(v);
    }
    return obj;
  },

  /**
   * Direct REST fallback: Sync single product via HTTP PATCH
   */
  async syncProductRest(product) {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) {
      return { success: false, error: 'Firebase config missing' };
    }
    const sanitized = this.sanitizeProduct(product);
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_products/${product.id}?key=${config.apiKey}`;
    try {
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: this.toFirestoreFields(sanitized) })
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${resp.status}`);
      }
      console.log('✅ Product synced via Firestore REST API:', product.id);
      return { success: true };
    } catch (e) {
      console.error('REST API syncProduct error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Direct REST fallback: Fetch products via HTTP GET
   */
  async fetchProductsRest() {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return null;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_products?key=${config.apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (!resp.ok || !data.documents) return [];
      const prods = data.documents.map(d => this.fromFirestoreFields(d.fields));
      prods.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return prods;
    } catch (e) {
      console.warn('REST API fetchProducts error:', e);
      return null;
    }
  },

  /**
   * Direct REST fallback: Delete product via HTTP DELETE
   */
  async deleteProductRest(id) {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return false;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_products/${id}?key=${config.apiKey}`;
    try {
      const resp = await fetch(url, { method: 'DELETE' });
      return resp.ok;
    } catch (e) {
      console.warn('REST API deleteProduct error:', e);
      return false;
    }
  },

  /**
   * Sync a single product to Firestore (dual SDK + direct REST fallback)
   */
  async syncProduct(product) {
    if (typeof window !== 'undefined' && window.DB && window.DB.isTestProduct(product)) {
      console.log('Skipping cloud sync for test product:', product.id);
      return { success: true };
    }

    const sanitized = this.sanitizeProduct(product);

    // Safeguard against exceeding Firestore 1MB document limit
    const payloadSize = JSON.stringify(sanitized).length;
    if (payloadSize > 980000) {
      const sizeKb = Math.round(payloadSize / 1024);
      console.error(`Product ${product.id} exceeds Firestore 1MB limit (${sizeKb} KB).`);
      return {
        success: false,
        error: `Payload size (${sizeKb} KB) exceeds Firestore 1MB limit. Please compress images.`
      };
    }

    // Try SDK first if available
    if (this.db) {
      try {
        await this.db.collection('mbm_products').doc(product.id).set(sanitized);
        console.log('✅ Product synced via Firestore SDK:', product.id);
        return { success: true };
      } catch (sdkErr) {
        console.warn('Firestore SDK sync failed, trying REST API fallback:', sdkErr.message);
      }
    }

    // Direct REST API fallback (works on any tablet/device without SDK dependency)
    const restRes = await this.syncProductRest(sanitized);
    if (restRes.success) return { success: true };

    return {
      success: false,
      error: restRes.error || 'Failed to sync to cloud database'
    };
  },

  /**
   * Upload printable PDF file to Firestore mbm_files
   * Supports chunking for files up to 5MB
   */
  async uploadPdfFile(fileId, fileData) {
    if (!this.isInitialized || !this.db) {
      await this.init().catch(() => {});
    }
    if (!this.isInitialized || !this.db) {
      try {
        localStorage.setItem('mbm_file_' + fileId, JSON.stringify(fileData));
        return { success: true, localOnly: true };
      } catch (e) {
        return { success: false, error: 'Storage full: ' + e.message };
      }
    }

    try {
      const { name, size, type, base64 } = fileData;
      const CHUNK_SIZE = 700000;
      const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

      if (totalChunks <= 1) {
        await this.db.collection('mbm_files').doc(fileId).set({
          id: fileId,
          name: name || 'printable.pdf',
          size: size || base64.length,
          type: type || 'application/pdf',
          chunksCount: 1,
          data: base64,
          uploadedAt: new Date().toISOString()
        });
      } else {
        await this.db.collection('mbm_files').doc(fileId).set({
          id: fileId,
          name: name || 'printable.pdf',
          size: size || base64.length,
          type: type || 'application/pdf',
          chunksCount: totalChunks,
          uploadedAt: new Date().toISOString()
        });
        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await this.db.collection('mbm_files').doc(`${fileId}_chunk_${i}`).set({
            fileId,
            chunkIndex: i,
            data: chunkStr
          });
        }
      }

      console.log(`✅ Uploaded PDF file ${fileId} (${totalChunks} chunk${totalChunks !== 1 ? 's' : ''}) to Firestore.`);
      return { success: true };
    } catch (err) {
      console.error('Error uploading PDF file to Firestore:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch printable PDF file from Firestore mbm_files
   */
  async getPdfFile(fileId) {
    if (!this.isInitialized || !this.db) {
      await this.init().catch(() => {});
    }
    if (!this.isInitialized || !this.db) {
      try {
        const local = localStorage.getItem('mbm_file_' + fileId);
        return local ? JSON.parse(local) : null;
      } catch { return null; }
    }

    try {
      const doc = await this.db.collection('mbm_files').doc(fileId).get();
      if (!doc.exists) return null;
      const fileMeta = doc.data();

      if (fileMeta.chunksCount <= 1 && fileMeta.data) {
        return fileMeta;
      }

      let fullBase64 = '';
      for (let i = 0; i < fileMeta.chunksCount; i++) {
        const chunkDoc = await this.db.collection('mbm_files').doc(`${fileId}_chunk_${i}`).get();
        if (chunkDoc.exists) {
          fullBase64 += chunkDoc.data().data || '';
        }
      }
      return { ...fileMeta, data: fullBase64 };
    } catch (err) {
      console.warn('Error fetching PDF file from Firestore:', err);
      return null;
    }
  },

  /**
   * Delete printable PDF file and chunks from Firestore
   */
  async deletePdfFile(fileId) {
    if (!this.isInitialized || !this.db) return false;
    try {
      const doc = await this.db.collection('mbm_files').doc(fileId).get();
      if (doc.exists) {
        const meta = doc.data();
        if (meta.chunksCount > 1) {
          for (let i = 0; i < meta.chunksCount; i++) {
            await this.db.collection('mbm_files').doc(`${fileId}_chunk_${i}`).delete().catch(() => {});
          }
        }
        await this.db.collection('mbm_files').doc(fileId).delete();
      }
      return true;
    } catch (err) {
      console.warn('Error deleting PDF file:', err);
      return false;
    }
  },

  /**
   * Delete a product from Firestore (SDK + REST fallback)
   */
  async deleteProductFromCloud(id) {
    if (this.db) {
      try {
        await this.db.collection('mbm_products').doc(id).delete();
        return true;
      } catch (err) {
        console.warn('Firestore SDK delete failed, trying REST:', err.message);
      }
    }
    return await this.deleteProductRest(id);
  },

  /**
   * Sync all local products to Firestore
   */
  async syncAllProducts(products) {
    if (!this.isInitialized || !this.db) return false;
    try {
      const batch = this.db.batch();
      products.forEach(p => {
        const ref = this.db.collection('mbm_products').doc(p.id);
        batch.set(ref, p);
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.warn('Error syncing products to Firestore:', err);
      return false;
    }
  },

  /**
   * Fetch all products from Firestore (SDK + REST fallback)
   */
  async fetchProducts() {
    if (this.db) {
      try {
        const snapshot = await this.db.collection('mbm_products').get();
        const products = [];
        snapshot.forEach(doc => products.push(doc.data()));
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return products;
      } catch (err) {
        console.warn('Firestore SDK fetchProducts error, trying REST:', err.message);
      }
    }
    return await this.fetchProductsRest();
  },

  /**
   * Delete all products from Firestore (SDK + REST fallback)
   */
  async clearAllProductsFromCloud() {
    // 1. Try SDK if available
    if (this.db) {
      try {
        const snapshot = await this.db.collection('mbm_products').get();
        if (!snapshot.empty) {
          const batch = this.db.batch();
          snapshot.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        console.log('✅ Cleared all products from Firestore SDK');
        return true;
      } catch (err) {
        console.warn('SDK clearAllProducts error, trying REST:', err.message);
      }
    }

    // 2. Direct REST fallback
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return false;
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_products?key=${config.apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.documents && data.documents.length) {
        for (const doc of data.documents) {
          const docId = doc.name.split('/').pop();
          await this.deleteProductRest(docId);
        }
      }
      console.log('✅ Cleared all products via Firestore REST API');
      return true;
    } catch (e) {
      console.error('REST clearAllProducts error:', e);
      return false;
    }
  },

  /**
   * Fetch all orders from Firestore
   */
  async fetchOrders() {
    if (!this.isInitialized || !this.db) return null;
    try {
      const snapshot = await this.db.collection('mbm_orders').get();
      const orders = [];
      snapshot.forEach(doc => orders.push(doc.data()));
      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return orders;
    } catch (err) {
      console.warn('Error fetching orders from Firestore:', err);
      return null;
    }
  },

  /**
   * Delete an individual order from Firestore
   */
  async deleteOrderFromCloud(orderId) {
    if (!orderId) return false;
    if (this.db) {
      try {
        await this.db.collection('mbm_orders').doc(orderId).delete();
        console.log('✅ Order deleted from Firestore SDK:', orderId);
        return true;
      } catch (err) {
        console.warn('SDK deleteOrder error, falling back to REST:', err.message);
      }
    }
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return false;
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_orders/${orderId}?key=${config.apiKey}`;
      const res = await fetch(url, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      console.warn('REST deleteOrder error:', e);
      return false;
    }
  },

  /**
   * Clear all orders from Firestore (SDK + REST fallback)
   */
  async clearAllOrdersFromCloud() {
    if (this.db) {
      try {
        const snapshot = await this.db.collection('mbm_orders').get();
        if (!snapshot.empty) {
          const batch = this.db.batch();
          snapshot.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        console.log('✅ Cleared all orders from Firestore SDK');
        return true;
      } catch (err) {
        console.warn('SDK clearAllOrders error, falling back to REST:', err.message);
      }
    }
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return false;
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_orders?key=${config.apiKey}&pageSize=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.documents && data.documents.length) {
        for (const doc of data.documents) {
          const docId = doc.name.split('/').pop();
          await this.deleteOrderFromCloud(docId);
        }
      }
      console.log('✅ Cleared all orders via Firestore REST API');
      return true;
    } catch (e) {
      console.error('REST clearAllOrders error:', e);
      return false;
    }
  },

  /**
   * Sync admin credentials to Firestore mbm_admin collection
   */
  async syncAdminAuth(authData) {
    if (!this.isInitialized || !this.db) return false;
    try {
      await this.db.collection('mbm_admin').doc('credentials').set({
        username: authData.username,
        passwordHash: authData.passwordHash,
        email: authData.email || '',
        role: authData.role || 'super_admin',
        updatedAt: authData.updatedAt || new Date().toISOString()
      }, { merge: true });
      console.log('✅ Admin credentials synced to Firestore cloud.');
      return true;
    } catch (err) {
      console.warn('Error syncing admin auth to Firestore:', err);
      return false;
    }
  },

  /**
   * Fetch admin credentials from Firestore mbm_admin collection
   */
  async fetchAdminAuth() {
    if (!this.isInitialized || !this.db) return null;
    try {
      const doc = await this.db.collection('mbm_admin').doc('credentials').get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (err) {
      console.warn('Error fetching admin auth from Firestore:', err);
      return null;
    }
  },

  /**
   * Direct REST fallback: Sync settings via HTTP PATCH
   */
  async syncSettingsRest(settingsData) {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return false;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_settings/main_settings?key=${config.apiKey}`;
    try {
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: this.toFirestoreFields(settingsData) })
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        throw new Error(data.error?.message || `HTTP ${resp.status}`);
      }
      console.log('✅ Store settings synced via Firestore REST API.');
      return true;
    } catch (e) {
      console.warn('REST API syncSettings error:', e);
      return false;
    }
  },

  /**
   * Direct REST fallback: Fetch settings via HTTP GET
   */
  async fetchSettingsRest() {
    const config = this.getConfig();
    if (!config || !config.apiKey || !config.projectId) return null;
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/mbm_settings/main_settings?key=${config.apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (!resp.ok || !data.fields) return null;
      return this.fromFirestoreFields(data.fields);
    } catch (e) {
      console.warn('REST API fetchSettings error:', e);
      return null;
    }
  },

  /**
   * Sync store settings to Firestore mbm_settings collection (Dual SDK + REST fallback)
   */
  async syncSettings(settingsData) {
    if (this.db) {
      try {
        await this.db.collection('mbm_settings').doc('main_settings').set(settingsData, { merge: true });
        console.log('✅ Store settings synced to Cloud Firestore SDK.');
        return true;
      } catch (err) {
        console.warn('Firestore SDK syncSettings error, trying REST API fallback:', err.message);
      }
    }
    return await this.syncSettingsRest(settingsData);
  },

  /**
   * Fetch store settings from Firestore mbm_settings collection (Dual SDK + REST fallback)
   */
  async fetchSettings() {
    if (this.db) {
      try {
        const doc = await this.db.collection('mbm_settings').doc('main_settings').get();
        if (doc.exists) {
          return doc.data();
        }
      } catch (err) {
        console.warn('Firestore SDK fetchSettings error, trying REST API fallback:', err.message);
      }
    }
    return await this.fetchSettingsRest();
  }
};

// Expose globally and attempt instant initialization
window.FirebaseService = FirebaseService;
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      FirebaseService.init().catch(() => {});
    });
  } else {
    FirebaseService.init().catch(() => {});
  }
}
