/**
 * MadeByMitzi — Mobile Order Manager (Phase 5)
 * Real-time Order Alert, GCash Verification & 1-Tap Dispatch Engine
 */

(function () {
  'use strict';

  // State Management
  let currentFilter = 'pending';
  let searchQuery = '';
  let knownOrderIds = new Set();
  let isSoundEnabled = localStorage.getItem('mbm_sound_enabled') !== 'false';
  let activeOrder = null;
  let hasUserInteracted = false;

  // Initialize Web Audio Chime Synthesizer (No external MP3 required)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Pleasant kawaii artisan notification chime (F#6 -> A#6 -> C#7 chime)
  function playSweetChime() {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 739.99, time: 0.00, dur: 0.15 }, // F#5
        { freq: 932.33, time: 0.12, dur: 0.18 }, // A#5
        { freq: 1108.73, time: 0.24, dur: 0.35 } // C#6
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.3, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });

      // Phone vibration if supported
      if (navigator.vibrate) {
        navigator.vibrate([150, 80, 200]);
      }
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  // Toast Notification
  function showToast(msg, icon = '✨') {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Enable Notifications
  async function requestNotificationPermission() {
    if (!('Notification' in window)) {
      showToast('Notifications not supported by this browser', 'ℹ️');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showToast('Push Notifications enabled! 🔔', '🎉');
        new Notification('MadeByMitzi Orders Active 🌸', {
          body: 'You will receive immediate alerts when new orders arrive!',
          icon: '../images/madebymitzi.jpg'
        });
      } else {
        showToast('Notifications permission was ' + perm, '⚠️');
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  }

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('SW registration error:', err);
      });
    });
  }

  // First User Interaction Unlock for Audio
  function unlockAudioOnInteraction() {
    if (!hasUserInteracted) {
      hasUserInteracted = true;
      getAudioContext();
    }
  }
  window.addEventListener('click', unlockAudioOnInteraction, { once: true });
  window.addEventListener('touchstart', unlockAudioOnInteraction, { once: true });

  // Format Philippine Currency
  function formatMoney(amount) {
    return '₱' + Number(amount || 0).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Format Relative / Date Time
  function formatTime(isoStr) {
    if (!isoStr) return 'Just now';
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Load and Render Orders
  function loadAndRender() {
    if (typeof DB === 'undefined') return;
    const allOrders = DB.getOrders() || [];

    // Calculate metrics
    let pendingCount = 0;
    let todaySales = 0;
    const todayStr = new Date().toDateString();

    allOrders.forEach((o) => {
      if (o.status === 'pending' || o.status === 'pending_verification' || !o.status) {
        pendingCount++;
      }
      if (o.status === 'confirmed' && o.createdAt) {
        if (new Date(o.createdAt).toDateString() === todayStr) {
          todaySales += Number(o.total || 0);
        }
      }
    });

    // Update metric cards
    const mPending = document.getElementById('metric-pending');
    const mToday = document.getElementById('metric-today');
    const mTotalOrders = document.getElementById('metric-total-orders');
    const navBadge = document.getElementById('nav-pending-badge');
    const chipPendingCount = document.getElementById('chip-pending-count');

    if (mPending) mPending.textContent = pendingCount;
    if (mToday) mToday.textContent = formatMoney(todaySales);
    if (mTotalOrders) mTotalOrders.textContent = allOrders.length;
    if (chipPendingCount) chipPendingCount.textContent = pendingCount;

    if (navBadge) {
      if (pendingCount > 0) {
        navBadge.style.display = 'flex';
        navBadge.textContent = pendingCount > 99 ? '99+' : pendingCount;
      } else {
        navBadge.style.display = 'none';
      }
    }

    // Filter list
    let filtered = allOrders.filter((o) => {
      const isPending = o.status === 'pending' || o.status === 'pending_verification' || !o.status;
      if (currentFilter === 'pending') return isPending;
      if (currentFilter === 'confirmed') return o.status === 'confirmed';
      if (currentFilter === 'rejected') return o.status === 'rejected';
      return true; // 'all'
    });

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((o) => {
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const nameMatch = (o.customer?.name || '').toLowerCase().includes(q);
        const phoneMatch = (o.customer?.phone || '').toLowerCase().includes(q);
        const refMatch = (o.refNumber || '').toLowerCase().includes(q);
        return idMatch || nameMatch || phoneMatch || refMatch;
      });
    }

    // Sort: newest first
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Render feed
    const container = document.getElementById('orders-feed');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${currentFilter === 'pending' ? '✨' : '📦'}</div>
          <h3 style="font-family:var(--font-head);font-size:1.1rem;color:var(--dark);margin-bottom:6px;">
            ${currentFilter === 'pending' ? 'All Caught Up!' : 'No Orders Found'}
          </h3>
          <p style="font-size:0.85rem;color:var(--gray-subtle);max-width:280px;margin:0 auto;line-height:1.4;">
            ${currentFilter === 'pending' 
              ? 'No pending orders waiting for approval right now. New orders will pop up here with an alert chime!' 
              : 'Try switching filters or clearing your search term.'}
          </p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((o) => {
      const isPending = o.status === 'pending' || o.status === 'pending_verification' || !o.status;
      const isConfirmed = o.status === 'confirmed';
      const isRejected = o.status === 'rejected';

      const cardClass = isPending ? 'pending-card' : isConfirmed ? 'confirmed-card' : 'rejected-card';
      const statusText = isPending ? '⏳ Pending Review' : isConfirmed ? '✓ Confirmed' : '✗ Declined';
      const statusClass = isPending ? 'status-pending' : isConfirmed ? 'status-confirmed' : 'status-rejected';

      const itemsSummary = (o.items || [])
        .map((it) => `<strong>${it.name}</strong> (×${it.qty})`)
        .join(', ') || 'No item details';

      return `
        <div class="order-card ${cardClass}" onclick="window.openOrderSheet('${o.id}')">
          <div class="card-top">
            <div class="card-id-block">
              <span class="order-id">${o.id}</span>
              <span class="order-time">${formatTime(o.createdAt)}</span>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>

          <div class="card-customer-row">
            <span class="cust-name">
              <i class="fas fa-user-circle" style="color:var(--pink);"></i>
              ${o.customer?.name || 'Customer'}
            </span>
            <span class="cust-pay-badge">${(o.paymentMethod || 'gcash').toUpperCase()}</span>
          </div>

          <div class="card-items-teaser">
            ${itemsSummary}
          </div>

          <div class="card-bottom-actions">
            <div>
              <span style="font-size:0.75rem;color:var(--gray-subtle);display:block;line-height:1;">Total Amount</span>
              <span class="card-total">${formatMoney(o.total)}</span>
            </div>
            <div class="btn-group-sm" onclick="event.stopPropagation()">
              ${isPending ? `
                <button class="btn-pill btn-pill-green" onclick="window.quickApproveOrder('${o.id}')">
                  <i class="fas fa-check"></i> Approve
                </button>
              ` : ''}
              <button class="btn-pill btn-pill-outline" onclick="window.openOrderSheet('${o.id}')">
                Details <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Detect New Incoming Orders via Real-time Snapshot
  function checkNewOrders(orders) {
    if (!orders || !Array.isArray(orders)) return;

    let hasNewPending = false;
    let newestOrder = null;

    orders.forEach((o) => {
      if (!knownOrderIds.has(o.id)) {
        knownOrderIds.add(o.id);
        const isPending = o.status === 'pending' || o.status === 'pending_verification' || !o.status;
        if (isPending) {
          hasNewPending = true;
          newestOrder = o;
        }
      }
    });

    if (hasNewPending && newestOrder) {
      playSweetChime();
      showToast(`🔔 New Order ${newestOrder.id} from ${newestOrder.customer?.name || 'Buyer'}!`, '🌸');

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New Order # ${newestOrder.id}! 🛍️`, {
          body: `${newestOrder.customer?.name || 'Customer'} placed an order for ${formatMoney(newestOrder.total)} via ${(newestOrder.paymentMethod || 'GCash').toUpperCase()}`,
          icon: '../images/madebymitzi.jpg'
        });
      }
    }
  }

  // Open Order Detail Bottom Sheet
  function openOrderSheet(id) {
    if (typeof DB === 'undefined') return;
    activeOrder = DB.getOrder(id);
    if (!activeOrder) return;

    const overlay = document.getElementById('order-sheet-modal');
    if (!overlay) return;

    document.getElementById('sheet-order-id').textContent = activeOrder.id;
    document.getElementById('sheet-order-time').textContent = new Date(activeOrder.createdAt).toLocaleString('en-PH');
    document.getElementById('sheet-cust-name').textContent = activeOrder.customer?.name || 'Customer';
    document.getElementById('sheet-cust-email').textContent = activeOrder.customer?.email || '—';
    document.getElementById('sheet-cust-phone').textContent = activeOrder.customer?.phone || '—';
    document.getElementById('sheet-cust-notes').textContent = activeOrder.customer?.notes ? `"${activeOrder.customer.notes}"` : 'None';

    document.getElementById('sheet-pay-method').textContent = (activeOrder.paymentMethod || 'GCash').toUpperCase();
    document.getElementById('sheet-pay-ref').textContent = activeOrder.refNumber || '—';
    document.getElementById('sheet-pay-total').textContent = formatMoney(activeOrder.total);

    // Proof of Payment Box
    const proofWrap = document.getElementById('sheet-proof-wrap');
    if (activeOrder.receiptImage) {
      proofWrap.innerHTML = `
        <div style="font-weight:700;font-size:0.82rem;color:var(--dark);margin-bottom:6px;display:flex;align-items:center;justify-content:center;gap:6px;">
          <i class="fas fa-receipt" style="color:var(--pink);"></i> Customer Payment Proof
        </div>
        <img src="${activeOrder.receiptImage}" class="proof-img-thumb" alt="GCash Screenshot" onclick="window.openLightbox('${activeOrder.receiptImage}')" />
        <div class="zoom-hint" onclick="window.openLightbox('${activeOrder.receiptImage}')">
          <i class="fas fa-search-plus"></i> Tap to Zoom Screenshot
        </div>
      `;
    } else {
      proofWrap.innerHTML = `
        <div style="font-size:0.82rem;color:var(--gray-subtle);padding:10px;">
          No screenshot image attached. Reference provided: <strong>${activeOrder.refNumber || '—'}</strong>
        </div>
      `;
    }

    // Items list
    const itemsList = document.getElementById('sheet-items-list');
    itemsList.innerHTML = (activeOrder.items || []).map((it) => `
      <div class="modal-item-row">
        <div>
          <span style="font-weight:700;color:var(--dark);">${it.name}</span>
          <span style="font-size:0.75rem;color:var(--gray-subtle);display:block;">Digital Download × ${it.qty}</span>
        </div>
        <strong style="color:var(--pink-dark);">${formatMoney(it.price * it.qty)}</strong>
      </div>
    `).join('');

    // Actions depending on status
    const isPending = activeOrder.status === 'pending' || activeOrder.status === 'pending_verification' || !activeOrder.status;
    const actionsBox = document.getElementById('sheet-actions-box');
    if (isPending) {
      actionsBox.innerHTML = `
        <button class="btn-big-approve" onclick="window.confirmApproveActiveOrder()">
          <i class="fas fa-check-circle"></i> Approve & Dispatch Files
        </button>
        <button class="btn-big-decline" onclick="window.declineActiveOrder()">
          <i class="fas fa-times-circle"></i> Decline / Cancel Order
        </button>
      `;
    } else if (activeOrder.status === 'confirmed') {
      actionsBox.innerHTML = `
        <div style="text-align:center;font-size:0.85rem;font-weight:700;color:var(--sage);background:var(--sage-light);padding:10px;border-radius:var(--radius-sm);border:1px solid #BFE0BA;margin-bottom:8px;">
          ✓ Order already confirmed & download links sent!
        </div>
        <button class="btn-pill btn-pill-outline" style="width:100%;justify-content:center;padding:11px;" onclick="window.confirmApproveActiveOrder(true)">
          <i class="fas fa-paper-plane"></i> Resend Download Links Email
        </button>
      `;
    } else {
      actionsBox.innerHTML = `
        <div style="text-align:center;font-size:0.85rem;font-weight:700;color:var(--danger);background:var(--danger-light);padding:10px;border-radius:var(--radius-sm);">
          ✗ This order was declined.
        </div>
      `;
    }

    overlay.classList.add('open');
  }

  function closeOrderSheet() {
    const overlay = document.getElementById('order-sheet-modal');
    if (overlay) overlay.classList.remove('open');
  }

  // Quick Approve Order from list card
  async function quickApproveOrder(id) {
    if (typeof DB === 'undefined') return;
    const order = DB.getOrder(id);
    if (!order) return;

    showToast('Confirming order & emailing buyer...', '⏳');

    try {
      DB.updateOrderStatus(order.id, 'confirmed');
      order.status = 'confirmed';
      loadAndRender();

      if (window.EmailService) {
        await window.EmailService.sendBuyerDigitalDelivery(order);
      }
      showToast('Order Approved! Canva & PDF links emailed to customer! 🎉', '🌸');
      playSweetChime();
    } catch (e) {
      showToast('Error: ' + e.message, '⚠️');
    }
  }

  // Confirm and Approve Active Order in sheet
  async function confirmApproveActiveOrder(isResend = false) {
    if (!activeOrder || typeof DB === 'undefined') return;

    showToast('Confirming & sending digital files...', '⏳');
    try {
      DB.updateOrderStatus(activeOrder.id, 'confirmed');
      activeOrder.status = 'confirmed';
      closeOrderSheet();
      loadAndRender();

      if (window.EmailService) {
        const res = await window.EmailService.sendBuyerDigitalDelivery(activeOrder);
        if (res && res.success) {
          showToast('Payment Approved! Printable & Canva links sent to buyer! 💌', '🎉');
        } else {
          showToast('Order confirmed! Ready to dispatch to buyer.', '✓');
        }
      } else {
        showToast('Order marked as confirmed!', '✓');
      }
      playSweetChime();
    } catch (err) {
      showToast('Failed to approve order: ' + err.message, '⚠️');
    }
  }

  // Decline Active Order
  function declineActiveOrder() {
    if (!activeOrder || typeof DB === 'undefined') return;
    if (!confirm(`Are you sure you want to decline order ${activeOrder.id}?`)) return;

    DB.updateOrderStatus(activeOrder.id, 'rejected');
    activeOrder.status = 'rejected';
    closeOrderSheet();
    loadAndRender();
    showToast(`Order ${activeOrder.id} declined`, 'ℹ️');
  }

  // Lightbox Zoom Handler
  function openLightbox(imgSrc) {
    const lb = document.getElementById('lightbox-overlay');
    const lbImg = document.getElementById('lightbox-img');
    if (!lb || !lbImg) return;
    lbImg.src = imgSrc;
    lb.classList.add('open');
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox-overlay');
    if (lb) lb.classList.remove('open');
  }

  // Tab Filtering Switcher
  function setTabFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    if (el) el.classList.add('active');
    loadAndRender();
  }

  // Switch Bottom Nav Screens
  function switchNav(screenId, el) {
    document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const ordersView = document.getElementById('view-orders');
    const settingsView = document.getElementById('view-settings');
    const statsView = document.getElementById('view-stats');

    if (screenId === 'orders') {
      if (ordersView) ordersView.style.display = 'block';
      if (settingsView) settingsView.style.display = 'none';
      if (statsView) statsView.style.display = 'none';
    } else if (screenId === 'settings') {
      if (ordersView) ordersView.style.display = 'none';
      if (settingsView) settingsView.style.display = 'block';
      if (statsView) statsView.style.display = 'none';
    } else if (screenId === 'stats') {
      if (ordersView) ordersView.style.display = 'none';
      if (settingsView) settingsView.style.display = 'none';
      if (statsView) statsView.style.display = 'block';
      renderStatsDetails();
    }
  }

  // Sound Toggle
  function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    localStorage.setItem('mbm_sound_enabled', isSoundEnabled ? 'true' : 'false');
    const statusEl = document.getElementById('sound-toggle-status');
    const banner = document.getElementById('sound-banner-top');
    if (statusEl) statusEl.textContent = isSoundEnabled ? 'Sound ON 🔔' : 'Sound OFF 🔇';
    if (banner) banner.style.display = isSoundEnabled ? 'flex' : 'none';
    showToast(isSoundEnabled ? 'Notification chime ON' : 'Notification chime muted', isSoundEnabled ? '🔔' : '🔇');
    if (isSoundEnabled) playSweetChime();
  }

  // Render Stats Tab Details
  function renderStatsDetails() {
    if (typeof DB === 'undefined') return;
    const orders = DB.getOrders() || [];
    const confirmed = orders.filter((o) => o.status === 'confirmed');
    const totalRev = confirmed.reduce((s, o) => s + (o.total || 0), 0);
    const pendingRev = orders.filter((o) => o.status === 'pending' || !o.status).reduce((s, o) => s + (o.total || 0), 0);

    const sRev = document.getElementById('stat-total-revenue');
    const sConf = document.getElementById('stat-confirmed-count');
    const sPend = document.getElementById('stat-pending-rev');
    if (sRev) sRev.textContent = formatMoney(totalRev);
    if (sConf) sConf.textContent = confirmed.length;
    if (sPend) sPend.textContent = formatMoney(pendingRev);
  }

  // Initial Setup
  document.addEventListener('DOMContentLoaded', () => {
    // Populate initial known IDs without alert
    if (typeof DB !== 'undefined') {
      const existing = DB.getOrders() || [];
      existing.forEach((o) => knownOrderIds.add(o.id));
    }

    loadAndRender();

    // Listen to real-time events from Cloud Firestore Sync
    window.addEventListener('mbm_orders_synced', (e) => {
      const orders = e.detail || [];
      checkNewOrders(orders);
      loadAndRender();
    });

    // Search bar listener
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        loadAndRender();
      });
    }

    // Expose globals for UI buttons
    window.openOrderSheet = openOrderSheet;
    window.closeOrderSheet = closeOrderSheet;
    window.quickApproveOrder = quickApproveOrder;
    window.confirmApproveActiveOrder = confirmApproveActiveOrder;
    window.declineActiveOrder = declineActiveOrder;
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;
    window.setTabFilter = setTabFilter;
    window.switchNav = switchNav;
    window.toggleSound = toggleSound;
    window.playSweetChime = playSweetChime;
    window.requestNotificationPermission = requestNotificationPermission;
  });
})();
