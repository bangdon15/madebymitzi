/* ===================================================
   MadeByMitzi — Data Layer (localStorage)
=================================================== */

const DB = {
  // ── Keys ──────────────────────────────────────────
  KEYS: {
    PRODUCTS: 'mbm_products',
    ORDERS:   'mbm_orders',
    REVIEWS:  'mbm_reviews',
    CART:     'mbm_cart',
    SESSION:  'mbm_admin_session',
    SETTINGS: 'mbm_settings',
    AUTH:     'mbm_admin_auth',
  },

  // ── Admin Security (Salted SHA-256 Hashing) ─────────
  SALT: 'mbm_salt_2026',
  DEFAULT_ADMIN: {
    username: 'admin_madebymitzi',
    // SHA-256 of ('mbm_salt_2026' + 'superUser112922')
    passwordHash: 'baefadae0d2f2e495749fa12cd1a4261c784da1e048cfa01689b31f3d2898a51',
    email: 'admin@madebymitzi.com',
    role: 'super_admin',
    updatedAt: new Date().toISOString(),
  },

  async hashPassword(password) {
    const text = this.SALT + password;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('SubtleCrypto error, falling back', e);
      }
    }
    // Fallback hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  },

  getAdminAuth() {
    return this.get(this.KEYS.AUTH) || this.DEFAULT_ADMIN;
  },

  async updateAdminCredentials(currentPassword, newUsername, newPassword, newEmail) {
    const auth = this.getAdminAuth();
    const currentHash = await this.hashPassword(currentPassword);
    
    // Check current password (hash or legacy fallback)
    if (currentHash !== auth.passwordHash && currentPassword !== 'superUser112922') {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (newPassword && newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }

    const updated = {
      ...auth,
      username: (newUsername && newUsername.trim()) ? newUsername.trim() : auth.username,
      email: (newEmail && newEmail.trim()) ? newEmail.trim() : auth.email,
      updatedAt: new Date().toISOString()
    };

    if (newPassword && newPassword.trim()) {
      updated.passwordHash = await this.hashPassword(newPassword.trim());
    }

    this.set(this.KEYS.AUTH, updated);

    // Sync to Cloud Firestore if connected
    if (typeof window !== 'undefined' && window.FirebaseService && typeof window.FirebaseService.syncAdminAuth === 'function') {
      window.FirebaseService.syncAdminAuth(updated).catch(err => {
        console.warn('Cloud sync for admin auth error:', err);
      });
    }

    return { success: true, message: 'Admin account security updated successfully! 🔐' };
  },

  // ── Generic helpers ───────────────────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (err) {
      console.warn('Storage set error:', err);
      // If QuotaExceededError, warn the user
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast('Storage quota alert: Please use smaller images.', 'warning');
      }
      return false;
    }
  },

  // ── PRODUCTS ──────────────────────────────────────
  getProducts() {
    const prods = this.get(this.KEYS.PRODUCTS);
    // If the admin has saved products (including an empty catalog [] when all test products are deleted), respect it!
    if (prods !== null && Array.isArray(prods)) {
      return prods;
    }
    // Only seed on initial launch if key does not exist at all
    return this.seedProducts();
  },
  setProducts(arr) { return this.set(this.KEYS.PRODUCTS, arr); },

  clearAllProducts() {
    this.setProducts([]);
    return [];
  },

  getProduct(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },
  addProduct(product) {
    const products = this.getProducts();
    product.id = 'prod_' + Date.now();
    product.createdAt = new Date().toISOString();
    product.sales = 0;
    products.unshift(product);
    this.setProducts(products);
    // Phase 2: Cloud Database sync
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized) {
      window.FirebaseService.syncProduct?.(product)?.catch?.(e => console.warn('Cloud sync error:', e));
    }
    return product;
  },
  updateProduct(id, data) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...data, updatedAt: new Date().toISOString() };
    this.setProducts(products);
    // Phase 2: Cloud Database sync
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized) {
      window.FirebaseService.syncProduct?.(products[idx])?.catch?.(e => console.warn('Cloud sync error:', e));
    }
    return products[idx];
  },
  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.setProducts(products);
    // Phase 2: Cloud Database sync
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized) {
      window.FirebaseService.deleteProductFromCloud?.(id)?.catch?.(e => console.warn('Cloud sync error:', e));
    }
  },

  // ── ORDERS ────────────────────────────────────────
  getOrders() { return this.get(this.KEYS.ORDERS) || []; },
  setOrders(arr) { this.set(this.KEYS.ORDERS, arr); },

  getOrder(id) { return this.getOrders().find(o => o.id === id) || null; },

  addOrder(order) {
    const orders = this.getOrders();
    order.id = 'ORD-' + Date.now();
    order.createdAt = new Date().toISOString();
    order.status = 'pending';
    orders.unshift(order);
    this.setOrders(orders);
    // Update product sales
    if (order.items) {
      order.items.forEach(item => {
        const p = this.getProduct(item.productId);
        if (p) this.updateProduct(item.productId, { sales: (p.sales || 0) + item.qty });
      });
    }
    // Phase 2: Cloud Database sync
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized) {
      window.FirebaseService.syncOrder(order).catch(e => console.warn('Cloud sync error:', e));
    }
    return order;
  },

  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    this.setOrders(orders);
    // Phase 2: Cloud Database sync
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized) {
      window.FirebaseService.syncOrder(orders[idx]).catch(e => console.warn('Cloud sync error:', e));
    }
    return orders[idx];
  },

  getEarnings() {
    const orders = this.getOrders();
    const confirmed = orders.filter(o => o.status === 'confirmed');
    const total = confirmed.reduce((sum, o) => sum + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.total || 0), 0);
    return { total, pending, confirmed: confirmed.length, totalOrders: orders.length };
  },

  // ── REVIEWS ───────────────────────────────────────
  getReviews(productId) {
    const all = this.get(this.KEYS.REVIEWS) || this.seedReviews();
    return productId ? all.filter(r => r.productId === productId) : all;
  },
  addReview(review) {
    const reviews = this.get(this.KEYS.REVIEWS) || this.seedReviews();
    review.id = 'rev_' + Date.now();
    review.createdAt = new Date().toISOString();
    reviews.unshift(review);
    this.set(this.KEYS.REVIEWS, reviews);
    return review;
  },
  getAvgRating(productId) {
    const revs = this.getReviews(productId);
    if (!revs.length) return { avg: 0, count: 0 };
    const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
    return { avg: Math.round(avg * 10) / 10, count: revs.length };
  },

  // ── CART ──────────────────────────────────────────
  getCart() { return this.get(this.KEYS.CART) || []; },
  setCart(arr) { this.set(this.KEYS.CART, arr); },

  addToCart(productId, qty = 1, variant = '') {
    const cart = this.getCart();
    const key = productId + (variant ? '_' + variant : '');
    const existing = cart.find(c => c.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      const product = this.getProduct(productId);
      if (!product) return;
      cart.push({ key, productId, qty, variant,
        name: product.name, price: product.price,
        image: product.images?.[0] || '' });
    }
    this.setCart(cart);
    return cart;
  },
  updateCartQty(key, qty) {
    const cart = this.getCart();
    const item = cart.find(c => c.key === key);
    if (item) { item.qty = qty; if (qty <= 0) return this.removeFromCart(key); }
    this.setCart(cart);
    return cart;
  },
  removeFromCart(key) {
    this.setCart(this.getCart().filter(c => c.key !== key));
  },
  clearCart() { this.set(this.KEYS.CART, []); },
  cartTotal() {
    return this.getCart().reduce((s, c) => s + c.price * c.qty, 0);
  },
  cartCount() {
    return this.getCart().reduce((s, c) => s + c.qty, 0);
  },

  // ── SETTINGS (payments, emails, etc.) ────────────
  getSettings() {
    return this.get(this.KEYS.SETTINGS) || {
      gcashImage: null,
      gcashName: 'MadeByMitzi',
      gcashNumber: '',
      bankImage: null,
      bankName: '',
      bankAccount: '',
      bankNumber: '',
      shopName: 'MadeByMitzi',
      shopTagline: 'Designs That Tell Your Story ✨',
      shopEmail: 'madebymitzi@gmail.com',
      orderNotifyTo: 'orders@madebymitzi.com',
      orderNotifyCc: 'admin@madebymitzi.com',
      emailSenderName: 'MadeByMitzi Orders',
      emailDeliverySubject: '[MadeByMitzi] Your Digital Order #{orderId} is Ready! 🎉',
      emailDeliveryNote: 'Thank you for your order! Here are your digital download links and Canva editable templates below. If you need any assistance with printing or editing, feel free to reply directly to this email or message our Facebook page.',
      shopFacebook: 'https://www.facebook.com/profile.php?id=100094438778151',
      shopEtsy: 'https://www.etsy.com/shop/MadeBymitzidigital',
      web3FormsKey: '3a8a2077-18e1-4a7c-a3aa-8a3b08b341e7',
    };
  },
  saveSettings(data) {
    const current = this.getSettings();
    this.set(this.KEYS.SETTINGS, { ...current, ...data });
  },

  // Generate Email Draft for Customer & Notification
  generateOrderEmailDraft(orderId) {
    const order = this.getOrder(orderId);
    if (!order) return null;
    const settings = this.getSettings();
    const cust = order.customer || {};
    const to = cust.email || '';
    const cc = settings.orderNotifyCc || '';
    const subject = (settings.emailDeliverySubject || '[MadeByMitzi] Your Digital Order #{orderId} is Ready! 🎉')
      .replace('{orderId}', order.id)
      .replace('{customerName}', cust.name || 'Valued Customer');

    let itemsText = '';
    if (order.items && order.items.length) {
      itemsText = order.items.map((item, idx) => {
        const prod = this.getProduct(item.productId);
        const canva = (prod && prod.canvaLink) ? `\n   🔗 Canva Editable Template: ${prod.canvaLink}` : '';
        const pdf = (prod && prod.pdfLink) ? `\n   📥 Printable PDF Link: ${prod.pdfLink}` : '';
        return `${idx + 1}. ${item.name || prod?.name || 'Item'} (Qty: ${item.qty})${canva}${pdf}`;
      }).join('\n\n');
    }

    const body = `Hi ${cust.name || 'Valued Customer'},

Thank you so much for your purchase with MadeByMitzi! Your payment of ₱${order.total || 0} has been verified and confirmed.

Here are your digital design links:
---------------------------------------------
${itemsText || 'Digital design links ready'}
---------------------------------------------

A Note from Mitzi:
${settings.emailDeliveryNote || 'Enjoy your designs! Tag us on Facebook or leave us a review.'}

Need help editing or printing?
Reply directly to this email or message us on Facebook:
${settings.shopFacebook || 'https://www.facebook.com/profile.php?id=100094438778151'}

Warm regards,
Mitzi Santos — MadeByMitzi ✨`;

    const mailtoUrl = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return {
      to,
      cc,
      subject,
      body,
      mailtoUrl,
      order
    };
  },

  // ── SECURED ADMIN SESSION ─────────────────────────
  isAdmin() {
    try {
      const sessionRaw = sessionStorage.getItem(this.KEYS.SESSION);
      if (!sessionRaw) return false;
      if (sessionRaw === 'true') return true; // backward compatible
      const session = JSON.parse(sessionRaw);
      if (session && session.token && session.expiresAt && Date.now() < session.expiresAt) {
        return true;
      }
      this.adminLogout();
      return false;
    } catch {
      return false;
    }
  },

  async adminLogin(username, password) {
    const attemptsKey = 'mbm_login_attempts';
    let attempts = { count: 0, lockUntil: 0 };
    try {
      attempts = JSON.parse(sessionStorage.getItem(attemptsKey) || '{"count":0,"lockUntil":0}');
    } catch {}

    if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
      const waitSec = Math.ceil((attempts.lockUntil - Date.now()) / 1000);
      return { success: false, message: `Account locked due to multiple failed attempts. Please wait ${waitSec}s.` };
    }

    // If Firebase is initialized or configured, fetch freshest credentials from cloud first
    if (typeof window !== 'undefined' && window.FirebaseService) {
      try {
        if (!window.FirebaseService.isInitialized) {
          await window.FirebaseService.init();
        }
        if (window.FirebaseService.isInitialized && typeof window.FirebaseService.fetchAdminAuth === 'function') {
          const cloudAuth = await window.FirebaseService.fetchAdminAuth();
          if (cloudAuth && cloudAuth.passwordHash) {
            this.set(this.KEYS.AUTH, cloudAuth);
          }
        }
      } catch (e) {
        console.warn('Cloud auth fetch during login skipped:', e.message);
      }
    }

    const auth = this.getAdminAuth();
    const inputHash = await this.hashPassword(password);
    
    // Check credentials against salted hash or legacy default
    const validUser = (username === auth.username || (auth.email && username === auth.email));
    const validPass = (inputHash === auth.passwordHash || (password === 'superUser112922' && username === auth.username));

    if (validUser && validPass) {
      sessionStorage.removeItem(attemptsKey);
      const token = 'mbm_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const session = {
        token,
        username: auth.username,
        email: auth.email,
        loginAt: new Date().toISOString(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24-hour validity
      };
      sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
      return { success: true, session };
    }

    // Handle failed attempt & rate-limiting
    attempts.count = (attempts.count || 0) + 1;
    if (attempts.count >= 5) {
      attempts.lockUntil = Date.now() + 60 * 1000; // 1 minute lockout
      sessionStorage.setItem(attemptsKey, JSON.stringify(attempts));
      return { success: false, message: 'Too many failed login attempts! Security lock active for 60 seconds.' };
    }
    sessionStorage.setItem(attemptsKey, JSON.stringify(attempts));
    const left = 5 - attempts.count;
    return { success: false, message: `Invalid username or password. (${left} attempt${left === 1 ? '' : 's'} remaining)` };
  },

  adminLogout() {
    sessionStorage.removeItem(this.KEYS.SESSION);
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = '../login.html';
      return false;
    }
    return true;
  },

  // ── SEED DATA ─────────────────────────────────────
  seedProducts() {
    const products = [
      {
        id: 'prod_001', name: 'Birthday Celebration Sticker Pack',
        category: 'Stickers', price: 149,
        description: 'A fun pack of 20 high-quality waterproof birthday-themed stickers. Perfect for gifts, planners, and decorations! Each sticker is vibrant and fade-resistant.',
        images: ['assets/placeholder-sticker1.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['birthday', 'sticker', 'celebration'],
        status: 'active', sales: 42, featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_002', name: 'Floral Birthday Invitation — Editable',
        category: 'Invitations', price: 299,
        description: 'Elegant floral birthday invitation design. Fully editable via Canva. Perfect for garden parties, bridal showers, and elegant celebrations. Comes with a printable PDF + digital version.',
        images: ['assets/placeholder-invite1.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['invitation', 'floral', 'birthday'],
        status: 'active', sales: 87, featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_003', name: 'Princess Party Sticker Bundle',
        category: 'Stickers', price: 199,
        description: '30 princess-themed stickers featuring crowns, wands, stars, and castles. Perfect for little girls\' birthdays and scrapbooking!',
        images: ['assets/placeholder-sticker2.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['princess', 'sticker', 'kids'],
        status: 'active', sales: 61, featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_004', name: 'Minimalist Wedding Invitation Set',
        category: 'Invitations', price: 499,
        description: 'Modern minimalist wedding invitation set including main invite, RSVP card, and details card. Fully editable in Canva. Available in 3 color variations.',
        images: ['assets/placeholder-invite2.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['wedding', 'invitation', 'minimalist'],
        status: 'active', sales: 34, featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_005', name: 'Kawaii Food Sticker Set',
        category: 'Stickers', price: 129,
        description: 'Adorable kawaii-style food stickers — ramen, sushi, boba, cake and more! Great for phones, laptops, water bottles, and planners.',
        images: ['assets/placeholder-sticker3.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['kawaii', 'food', 'sticker'],
        status: 'active', sales: 119, featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_006', name: 'Safari Adventure Birthday Invite',
        category: 'Invitations', price: 249,
        description: 'Jungle-themed birthday invitation perfect for kids\' parties. Features cute safari animals, tropical leaves, and vibrant colors. Editable template with custom name/date.',
        images: ['assets/placeholder-invite3.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['safari', 'kids', 'invitation', 'jungle'],
        status: 'active', sales: 55, featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_007', name: 'Cute Daily Planner Stickers (File Only)',
        category: 'Sticker (File only)', price: 99,
        description: 'Instant digital download! High-resolution transparent PNG cut files, GoodNotes sticker book, and printable A4 PDF. Perfect for iPad planning, scrapbooking, and home DIY printing.',
        images: ['assets/placeholder-sticker1.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['digital', 'planner', 'stickers', 'goodnotes', 'file-only'],
        status: 'active', sales: 78, featured: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_008', name: 'Pastel Aesthetic Doodles Cut Files (SVG & PNG)',
        category: 'Sticker (File only)', price: 119,
        description: 'Instant digital cut files only! 30+ aesthetic hand-drawn doodles formatted for Cricut, Silhouette, and digital bullet journals. Pre-cropped individual PNGs + vector SVG cut lines.',
        images: ['assets/placeholder-sticker2.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['svg', 'cricut', 'doodles', 'file-only', 'cut-files'],
        status: 'active', sales: 64, featured: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_009', name: 'Coffee & Daily Motivation Digital Stickers (File Only)',
        category: 'Sticker (File only)', price: 89,
        description: 'Digital file only! Warm aesthetic coffee quotes, study trackers, and cup designs for digital journals and printable sticker sheets.',
        images: ['assets/placeholder-sticker3.svg'],
        pdfLink: '', canvaLink: '', sampleImages: [],
        tags: ['coffee', 'motivation', 'digital-stickers', 'file-only'],
        status: 'active', sales: 92, featured: false,
        createdAt: new Date().toISOString(),
      },
    ];
    this.setProducts(products);
    return products;
  },

  seedReviews() {
    const reviews = [
      { id: 'rev_001', productId: 'prod_001', name: 'Maria S.', rating: 5, text: 'Super ganda ng designs! Natuwa talaga ang anak ko sa mga stickers. Very high quality and waterproof!', createdAt: '2026-08-10T10:00:00Z' },
      { id: 'rev_002', productId: 'prod_002', name: 'Jasmine R.', rating: 5, text: 'The invitation was absolutely beautiful! Easy to edit in Canva and the colors were exactly as shown. Will definitely order again!', createdAt: '2026-08-15T14:30:00Z' },
      { id: 'rev_003', productId: 'prod_001', name: 'Carla M.', rating: 4, text: 'Very cute stickers! Ang bilis pa ng delivery. Highly recommended!', createdAt: '2026-08-20T09:15:00Z' },
      { id: 'rev_004', productId: 'prod_004', name: 'Angela T.', rating: 5, text: 'Our guests loved the wedding invitations! So elegant and classy. Mitzi was very accommodating with our customizations.', createdAt: '2026-08-25T16:00:00Z' },
      { id: 'rev_005', productId: 'prod_005', name: 'Bea L.', rating: 5, text: 'The kawaii stickers are so adorable! Perfect for my bullet journal. The quality is amazing — very durable!', createdAt: '2026-09-01T11:30:00Z' },
      { id: 'rev_006', productId: 'prod_003', name: 'Kristine P.', rating: 5, text: 'My daughter loved the princess stickers for her party! Lahat ng bisita nagtatanong kung saan nabili. So worth it!', createdAt: '2026-09-05T08:45:00Z' },
    ];
    this.set(this.KEYS.REVIEWS, reviews);
    return reviews;
  },
};

// Make globally available
window.DB = DB;
