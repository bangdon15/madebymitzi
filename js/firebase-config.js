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

      if (this.isInitialized && this.db) {
        // 1. Initial product sync
        this.fetchProducts().then(cloudProds => {
          if (cloudProds && cloudProds.length && typeof window.DB !== 'undefined') {
            window.DB.setProducts(cloudProds);
            window.dispatchEvent(new CustomEvent('mbm_products_synced', { detail: cloudProds }));
          }
        }).catch(() => {});

        // 2. Initial orders sync
        this.fetchOrders().then(cloudOrders => {
          if (cloudOrders && cloudOrders.length && typeof window.DB !== 'undefined') {
            window.DB.setOrders(cloudOrders);
            window.dispatchEvent(new CustomEvent('mbm_orders_synced', { detail: cloudOrders }));
          }
        }).catch(() => {});

        // 3. Initial settings sync
        this.fetchSettings().then(cloudSettings => {
          if (cloudSettings && typeof window.DB !== 'undefined') {
            const current = window.DB.getSettings();
            window.DB.set(window.DB.KEYS.SETTINGS, { ...current, ...cloudSettings });
          }
        }).catch(() => {});

        // 4. Real-time live Firestore listener for Products
        try {
          this.db.collection('mbm_products').onSnapshot(snapshot => {
            if (!snapshot.empty && typeof window.DB !== 'undefined') {
              const cloudProds = [];
              snapshot.forEach(doc => cloudProds.push(doc.data()));
              cloudProds.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              window.DB.setProducts(cloudProds);
              window.dispatchEvent(new CustomEvent('mbm_products_synced', { detail: cloudProds }));
            }
          }, err => console.warn('Products live listener notice:', err.message));
        } catch (e) {}

        // 5. Real-time live Firestore listener for Orders
        try {
          this.db.collection('mbm_orders').onSnapshot(snapshot => {
            if (!snapshot.empty && typeof window.DB !== 'undefined') {
              const cloudOrders = [];
              snapshot.forEach(doc => cloudOrders.push(doc.data()));
              cloudOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
              window.DB.setOrders(cloudOrders);
              window.dispatchEvent(new CustomEvent('mbm_orders_synced', { detail: cloudOrders }));
            }
          }, err => console.warn('Orders live listener notice:', err.message));
        } catch (e) {}

        // 6. Real-time live Firestore listener for Settings
        try {
          this.db.collection('mbm_settings').doc('main_settings').onSnapshot(doc => {
            if (doc.exists && typeof window.DB !== 'undefined') {
              const current = window.DB.getSettings();
              window.DB.set(window.DB.KEYS.SETTINGS, { ...current, ...doc.data() });
              window.dispatchEvent(new CustomEvent('mbm_settings_synced', { detail: doc.data() }));
            }
          }, err => console.warn('Settings live listener notice:', err.message));
        } catch (e) {}

        return true;
      }
    } catch (err) {
      console.warn('Firebase init error (using offline fallback):', err.message);
      this.isInitialized = false;
    }
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
        scriptFirestore.onload = () => resolve();
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
   * Sync a single product to Firestore
   */
  async syncProduct(product) {
    if (!this.isInitialized || !this.db) return false;
    try {
      await this.db.collection('mbm_products').doc(product.id).set(product);
      return true;
    } catch (err) {
      console.warn('Error syncing single product to Firestore:', err);
      return false;
    }
  },

  /**
   * Delete a product from Firestore
   */
  async deleteProductFromCloud(id) {
    if (!this.isInitialized || !this.db) return false;
    try {
      await this.db.collection('mbm_products').doc(id).delete();
      return true;
    } catch (err) {
      console.warn('Error deleting product from Firestore:', err);
      return false;
    }
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
   * Fetch all products from Firestore
   */
  async fetchProducts() {
    if (!this.isInitialized || !this.db) return null;
    try {
      const snapshot = await this.db.collection('mbm_products').get();
      const products = [];
      snapshot.forEach(doc => products.push(doc.data()));
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return products;
    } catch (err) {
      console.warn('Error fetching products from Firestore:', err);
      return null;
    }
  },

  /**
   * Delete all products from Firestore
   */
  async clearAllProductsFromCloud() {
    if (!this.isInitialized || !this.db) return false;
    try {
      const snapshot = await this.db.collection('mbm_products').get();
      const batch = this.db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return true;
    } catch (err) {
      console.warn('Error clearing products from Firestore:', err);
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
   * Sync store settings to Firestore mbm_settings collection
   */
  async syncSettings(settingsData) {
    if (!this.isInitialized || !this.db) return false;
    try {
      await this.db.collection('mbm_settings').doc('main_settings').set(settingsData, { merge: true });
      console.log('✅ Store settings synced to Cloud Firestore.');
      return true;
    } catch (err) {
      console.warn('Error syncing settings to Firestore:', err);
      return false;
    }
  },

  /**
   * Fetch store settings from Firestore mbm_settings collection
   */
  async fetchSettings() {
    if (!this.isInitialized || !this.db) return null;
    try {
      const doc = await this.db.collection('mbm_settings').doc('main_settings').get();
      if (doc.exists) {
        return doc.data();
      }
      return null;
    } catch (err) {
      console.warn('Error fetching settings from Firestore:', err);
      return null;
    }
  }
};

// Expose globally and attempt silent initialization
window.FirebaseService = FirebaseService;
document.addEventListener('DOMContentLoaded', () => {
  FirebaseService.init().catch(() => {});
});
