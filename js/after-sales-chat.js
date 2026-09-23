/**
 * MadeByMitzi — Free After-Sales Chat & Instant Order Tracker Widget
 * 
 * Provides customers with:
 * 1. 1-Click direct chat via Facebook Messenger (m.me/100094438778151)
 * 2. Instant Order Status & Digital Download Tracker (by Order ID)
 * 3. Direct Email Inquiry Fallback (madebymitzi26@gmail.com)
 * 
 * Zero third-party monthly subscriptions, 100% free forever.
 */

(function () {
  if (document.getElementById('mbm-after-sales-widget')) return;

  // Inject Styles
  const style = document.createElement('style');
  style.textContent = `
    .mbm-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9990;
      background: var(--forest-moss, #6B8E5A);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 10px 18px 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(36, 51, 30, 0.28);
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .mbm-chat-btn:hover {
      transform: translateY(-4px) scale(1.04);
      background: var(--forest-dark, #4D6940);
      box-shadow: 0 12px 30px rgba(36, 51, 30, 0.35);
    }
    .mbm-chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--rice-cream, #F3E8C2);
      flex-shrink: 0;
    }
    .mbm-chat-dot {
      width: 10px;
      height: 10px;
      background: #10B981;
      border-radius: 50%;
      border: 2px solid white;
      position: absolute;
      bottom: 10px;
      left: 38px;
    }

    /* Modal Container */
    .mbm-chat-modal {
      position: fixed;
      bottom: 84px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      max-height: 580px;
      background: white;
      border-radius: 20px;
      border: 2px solid var(--cream-border, #E6D8AD);
      box-shadow: 0 20px 50px rgba(36, 51, 30, 0.25);
      z-index: 9995;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: mbmSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      font-family: 'Nunito', sans-serif;
    }
    .mbm-chat-modal.open {
      display: flex;
    }
    @keyframes mbmSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Header */
    .mbm-chat-header {
      background: linear-gradient(135deg, var(--forest-deep, #24331E), var(--forest-moss, #6B8E5A));
      color: white;
      padding: 18px 20px;
      position: relative;
    }
    .mbm-chat-header-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 800;
      font-size: 1.05rem;
      margin-bottom: 2px;
      color: var(--rice-cream, #F3E8C2);
    }
    .mbm-chat-header-sub {
      font-size: 0.78rem;
      color: rgba(243, 232, 194, 0.85);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mbm-chat-close {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: grid;
      place-items: center;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }
    .mbm-chat-close:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Tabs */
    .mbm-chat-tabs {
      display: flex;
      background: var(--cream-light, #FAF6EA);
      border-bottom: 1px solid var(--cream-border, #E6D8AD);
    }
    .mbm-chat-tab {
      flex: 1;
      padding: 10px 8px;
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 0.8rem;
      text-align: center;
      background: none;
      border: none;
      color: var(--gray-600, #52604D);
      cursor: pointer;
      border-bottom: 2.5px solid transparent;
      transition: all 0.2s ease;
    }
    .mbm-chat-tab.active {
      color: var(--forest-deep, #24331E);
      border-color: var(--forest-moss, #6B8E5A);
      background: white;
    }

    /* Body */
    .mbm-chat-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    .mbm-panel { display: none; }
    .mbm-panel.active { display: block; }

    /* Action Buttons */
    .mbm-messenger-card {
      background: #EFF6FF;
      border: 1.5px solid #BFDBFE;
      border-radius: 14px;
      padding: 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .mbm-btn-messenger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #0084FF;
      color: white;
      padding: 11px 20px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
      width: 100%;
      box-shadow: 0 4px 14px rgba(0, 132, 255, 0.3);
      transition: all 0.2s ease;
    }
    .mbm-btn-messenger:hover {
      background: #0073e6;
      transform: translateY(-2px);
    }

    .mbm-track-box {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .mbm-track-input {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid var(--gray-200, #E2E6DD);
      border-radius: 10px;
      font-size: 0.88rem;
      outline: none;
    }
    .mbm-track-input:focus {
      border-color: var(--forest-moss, #6B8E5A);
    }
    .mbm-btn-track {
      background: var(--forest-moss, #6B8E5A);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }
    .mbm-btn-track:hover {
      background: var(--forest-dark, #4D6940);
    }
    .mbm-track-result {
      border: 1.5px solid var(--cream-border, #E6D8AD);
      background: #FAF7F0;
      border-radius: 12px;
      padding: 14px;
      font-size: 0.85rem;
      display: none;
    }

    @media (max-width: 480px) {
      .mbm-chat-btn span { display: none; }
      .mbm-chat-btn { padding: 10px; border-radius: 50%; width: 54px; height: 54px; justify-content: center; }
      .mbm-chat-dot { left: auto; right: 2px; bottom: 2px; }
      .mbm-chat-modal { right: 16px; bottom: 76px; }
    }
  `;
  document.head.appendChild(style);

  // Widget HTML
  const widget = document.createElement('div');
  widget.id = 'mbm-after-sales-widget';
  widget.innerHTML = `
    <!-- Floating Trigger -->
    <button class="mbm-chat-btn" id="mbm-open-chat-btn" aria-label="Open Support & Order Tracker">
      <img src="images/madebymitzi.jpg" class="mbm-chat-avatar" alt="Mitzi" onerror="this.src='../images/madebymitzi.jpg'" />
      <span class="mbm-chat-dot"></span>
      <span>Need Help? Chat & Track</span>
    </button>

    <!-- Modal Popup -->
    <div class="mbm-chat-modal" id="mbm-chat-modal">
      <!-- Header -->
      <div class="mbm-chat-header">
        <button class="mbm-chat-close" id="mbm-close-chat-btn" aria-label="Close">✕</button>
        <div class="mbm-chat-header-title">MadeByMitzi Support 🌿</div>
        <div class="mbm-chat-header-sub">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;"></span>
          Replies fast on Messenger • Mon–Sun
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mbm-chat-tabs">
        <button class="mbm-chat-tab active" data-target="tab-messenger">💬 Chat With Mitzi</button>
        <button class="mbm-chat-tab" data-target="tab-track">📦 Track Order</button>
        <button class="mbm-chat-tab" data-target="tab-email">✉️ Email</button>
      </div>

      <!-- Tab Content Body -->
      <div class="mbm-chat-body">
        
        <!-- Tab 1: Facebook Messenger (1-Click) -->
        <div class="mbm-panel active" id="tab-messenger">
          <div class="mbm-messenger-card">
            <div style="font-size:2rem;margin-bottom:8px;">⚡</div>
            <div style="font-weight:800;font-size:1rem;color:#1E3A8A;margin-bottom:4px;">Direct Facebook Messenger</div>
            <p style="font-size:0.82rem;color:#4B5563;margin-bottom:14px;line-height:1.5;">
              Chat directly with Mitzi for rush orders, customized invitations, or questions before buying.
            </p>
            <a href="https://m.me/100094438778151" target="_blank" class="mbm-btn-messenger">
              <i class="fab fa-facebook-messenger" style="font-size:1.1rem;"></i> Open Messenger Chat
            </a>
          </div>
          <div style="font-size:0.8rem;color:var(--gray-500,#6B7280);text-align:center;">
            Official Store: <strong>MadeByMitzi</strong>
          </div>
        </div>

        <!-- Tab 2: Track Order & Digital Downloads -->
        <div class="mbm-panel" id="tab-track">
          <p style="font-size:0.82rem;color:var(--gray-600,#4B5563);margin-bottom:10px;">
            Enter your <strong>Order ID</strong> (from checkout or email) to view verification status and access downloads:
          </p>
          <div class="mbm-track-box">
            <input type="text" class="mbm-track-input" id="mbm-track-id-input" placeholder="e.g. ORD-1727..." />
            <button class="mbm-btn-track" id="mbm-btn-track-submit">Track</button>
          </div>
          <div class="mbm-track-result" id="mbm-track-result">
            <!-- Results injected here -->
          </div>
        </div>

        <!-- Tab 3: Direct Email -->
        <div class="mbm-panel" id="tab-email">
          <div style="text-align:center;padding:12px 4px;">
            <div style="font-size:2rem;margin-bottom:8px;">💌</div>
            <div style="font-weight:800;font-size:0.95rem;color:var(--forest-deep,#24331E);margin-bottom:4px;">Email Support</div>
            <p style="font-size:0.82rem;color:var(--gray-600,#4B5563);margin-bottom:14px;">
              For invoice copies, formal inquiries, or file questions:
            </p>
            <a href="mailto:madebymitzi26@gmail.com?subject=Inquiry%20from%20MadeByMitzi%20Customer" style="display:inline-block;background:var(--forest-moss,#6B8E5A);color:white;padding:10px 20px;border-radius:999px;font-weight:700;font-size:0.88rem;text-decoration:none;">
              <i class="fas fa-envelope"></i> Send Email to Mitzi
            </a>
            <div style="font-size:0.78rem;color:var(--gray-400,#9CA3AF);margin-top:10px;">
              madebymitzi26@gmail.com
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // Event Listeners
  const openBtn = document.getElementById('mbm-open-chat-btn');
  const closeBtn = document.getElementById('mbm-close-chat-btn');
  const modal = document.getElementById('mbm-chat-modal');

  openBtn.addEventListener('click', () => {
    modal.classList.toggle('open');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  // Tab switching
  const tabs = widget.querySelectorAll('.mbm-chat-tab');
  const panels = widget.querySelectorAll('.mbm-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Track Order Logic
  const trackBtn = document.getElementById('mbm-btn-track-submit');
  const trackInput = document.getElementById('mbm-track-id-input');
  const trackResult = document.getElementById('mbm-track-result');

  async function handleOrderTrack() {
    const rawId = (trackInput.value || '').trim();
    if (!rawId) {
      trackResult.style.display = 'block';
      trackResult.innerHTML = '<span style="color:#DC2626;">Please enter an Order ID.</span>';
      return;
    }

    trackResult.style.display = 'block';
    trackResult.innerHTML = '<div style="text-align:center;"><i class="fas fa-spinner fa-spin"></i> Checking order status...</div>';

    let order = null;
    if (typeof DB !== 'undefined') {
      order = DB.getOrder(rawId);
    }

    if (!order && window.FirebaseService) {
      try {
        if (!window.FirebaseService.isInitialized) {
          await window.FirebaseService.init().catch(() => {});
        }
        const orders = await window.FirebaseService.fetchOrders();
        if (orders) {
          order = orders.find(o => (o.id || '').toLowerCase() === rawId.toLowerCase());
        }
      } catch (e) {
        console.warn('Track order cloud fetch error:', e);
      }
    }

    if (!order) {
      trackResult.innerHTML = `
        <div style="color:#B91C1C;font-weight:700;margin-bottom:4px;">❌ Order Not Found</div>
        <p style="font-size:0.8rem;color:#4B5563;margin:0;">
          Please double check your Order ID. If you just placed this order, it may take 1-2 minutes to register.
        </p>
      `;
      return;
    }

    const isConfirmed = order.status === 'confirmed';
    const statusText = isConfirmed 
      ? '<span style="color:#15803D;font-weight:800;">✅ Confirmed & Delivered</span>' 
      : '<span style="color:#B45309;font-weight:800;">⏳ Payment Under Verification</span>';

    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const receiptHref = `receipt.html?id=${order.id}${orderData ? `&order_data=${orderData}` : ''}`;

    trackResult.innerHTML = `
      <div style="font-weight:800;font-size:0.95rem;color:var(--forest-deep,#24331E);margin-bottom:6px;">
        Order #${order.id}
      </div>
      <div style="font-size:0.82rem;margin-bottom:8px;">Status: ${statusText}</div>
      <div style="font-size:0.8rem;color:#4B5563;margin-bottom:10px;">
        Total: ₱${Number(order.total || 0).toLocaleString()} • ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'GCash'}
      </div>
      <a href="${receiptHref}" target="_blank" style="display:inline-block;background:var(--forest-moss,#6B8E5A);color:white;padding:7px 14px;border-radius:8px;font-weight:700;font-size:0.82rem;text-decoration:none;width:100%;text-align:center;">
        <i class="fas fa-receipt"></i> Open Receipt & Downloads
      </a>
    `;
  }

  if (trackBtn) trackBtn.addEventListener('click', handleOrderTrack);
  if (trackInput) {
    trackInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleOrderTrack();
    });
  }
})();
