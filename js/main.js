/* ===================================================
   MadeByMitzi — Global JS (main.js)
=================================================== */

// ── Navbar scroll effect ──────────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── Hamburger menu ────────────────────────────────
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  // Close on link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });
}

// ── Active nav link ───────────────────────────────
(function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── Cart badge update ─────────────────────────────
function updateCartBadge() {
  const count = DB.cartCount();
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  });
}

// ── Toast notifications ───────────────────────────
const toastContainer = document.querySelector('.toast-container');

function showToast(msg, type = 'success', duration = 3000) {
  if (!toastContainer) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', cart: '🛒' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span class="toast-msg">${msg}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}
window.showToast = showToast;

// ── Scroll reveal animation ───────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// ── Format currency ───────────────────────────────
function formatPrice(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
window.formatPrice = formatPrice;

// ── Star rating renderer ──────────────────────────
function renderStars(rating, total = 5, small = false) {
  let html = '';
  for (let i = 1; i <= total; i++) {
    const filled = i <= Math.round(rating) ? ' filled' : '';
    html += `<span class="star${filled}">★</span>`;
  }
  return html;
}
window.renderStars = renderStars;

// ── Confirm modal ─────────────────────────────────
function showConfirm({ icon = '⚠️', iconClass = 'danger', title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-icon ${iconClass}">${icon}</div>
      <h2>${title}</h2>
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-outline-blue" id="confirm-cancel">${cancelText}</button>
        <button class="btn btn-${iconClass === 'danger' ? 'danger' : 'green'}" id="confirm-ok">${confirmText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
    overlay.remove(); onCancel?.();
  });
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    overlay.remove(); onConfirm?.();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); onCancel?.(); } });
}
window.showConfirm = showConfirm;

// ── Confetti ──────────────────────────────────────
function launchConfetti(duration = 3000) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const colors = ['#FFD700','#00A86B','#0F52BA','#BFEFFF','#FF6B9D','#FF8C42'];
  const pieces = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * 360,
    speed: Math.random() * 4 + 2,
    spin: (Math.random() - 0.5) * 10,
  }));

  let start = null;
  function draw(ts) {
    if (!start) start = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.angle += p.spin;
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (ts - start < duration) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  }
  requestAnimationFrame(draw);
}
window.launchConfetti = launchConfetti;

// ── File to base64 ────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
window.fileToBase64 = fileToBase64;

// ── Marquee clone (seamless) ──────────────────────
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}

// ── Add to cart (global handler) ─────────────────
function handleAddToCart(productId, qty = 1) {
  DB.addToCart(productId, qty);
  updateCartBadge();
  showToast('Added to cart! 🛒', 'cart');
}
window.handleAddToCart = handleAddToCart;

// ── Placeholder SVG generator ─────────────────────
function getPlaceholderSVG(category, index) {
  const colors = [
    ['#0F52BA','#FFD700'], ['#00A86B','#BFEFFF'],
    ['#FFD700','#0F52BA'], ['#00553A','#FFD700'],
    ['#3A6FD8','#00A86B'], ['#0F52BA','#00A86B'],
  ];
  const [bg, accent] = colors[index % colors.length];
  const emojis = { Stickers: '🎨', Invitations: '💌', 'Sticker (File only)': '✂️', default: '✨' };
  const emoji = emojis[category] || emojis.default;
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${bg}"/>
      <circle cx="200" cy="160" r="80" fill="${accent}" opacity="0.3"/>
      <text x="200" y="180" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <rect x="60" y="270" width="280" height="12" rx="6" fill="${accent}" opacity="0.5"/>
      <rect x="100" y="298" width="200" height="8" rx="4" fill="${accent}" opacity="0.3"/>
    </svg>
  `)}`;
}
window.getPlaceholderSVG = getPlaceholderSVG;

// ── Init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initReveal();
  initMarquee();
});
