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

  // Default / stored config
  getConfig() {
    try {
      return JSON.parse(localStorage.getItem('mbm_firebase_config')) || null;
    } catch {
      return null;
    }
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
      // Not yet configured by admin; remain in offline/local mode
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
        return true;
      } else if (window.firebase && window.firebase.apps.length) {
        this.app = window.firebase.app();
        this.db = window.firebase.firestore();
        this.isInitialized = true;
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
   * Fetch all orders from Firestore
   */
  async fetchOrders() {
    if (!this.isInitialized || !this.db) return null;
    try {
      const snapshot = await this.db.collection('mbm_orders').orderBy('createdAt', 'desc').get();
      const orders = [];
      snapshot.forEach(doc => orders.push(doc.data()));
      return orders;
    } catch (err) {
      console.warn('Error fetching orders from Firestore:', err);
      return null;
    }
  }
};

// Expose globally and attempt silent initialization
window.FirebaseService = FirebaseService;
document.addEventListener('DOMContentLoaded', () => {
  FirebaseService.init().catch(() => {});
});
