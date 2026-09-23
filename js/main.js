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

// ── File to base64 with auto-compression (Tablet & Mobile Optimized) ──────────
function fileToBase64(file, maxDimension = 560, quality = 0.68, maxBytes = 140000) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // If SVG, read directly as data URL
    if (file.type && file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Use URL.createObjectURL for memory safety on Android tablets
    const hasObjectUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    let blobUrl = null;

    const cleanup = () => {
      if (blobUrl && hasObjectUrl) {
        try { URL.revokeObjectURL(blobUrl); } catch (e) {}
      }
    };

    const processImage = (img) => {
      try {
        const compressWith = (dim, q) => {
          const canvas = document.createElement('canvas');
          let { naturalWidth: width, naturalHeight: height } = img;
          if (!width || !height) {
            width = img.width || dim;
            height = img.height || dim;
          }
          if (width > dim || height > dim) {
            if (width > height) {
              height = Math.round((height * dim) / width);
              width = dim;
            } else {
              width = Math.round((width * dim) / height);
              height = dim;
            }
          }
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', q);
        };

        let compressed = compressWith(maxDimension, quality);
        // If still over maxBytes, perform secondary pass to protect tablet localStorage & Firestore
        if (compressed.length > maxBytes) {
          if (maxDimension >= 1200) {
            compressed = compressWith(1080, 0.65);
          } else {
            compressed = compressWith(420, 0.55);
          }
        }
        cleanup();
        resolve(compressed);
      } catch (err) {
        console.warn('Canvas compression fallback to raw dataURL:', err);
        cleanup();
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    };

    if (hasObjectUrl) {
      try {
        blobUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => {
          cleanup();
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        };
        img.src = blobUrl;
        return;
      } catch (e) {
        cleanup();
      }
    }

    // Fallback: standard FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
window.fileToBase64 = fileToBase64;

// ── Lightweight Markdown to HTML Renderer ──────────
function renderMarkdown(md) {
  if (!md || typeof md !== 'string') return '';
  // 1. Escape HTML tags to prevent XSS
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Headers (### Header, ## Header, # Header)
  html = html.replace(/^### (.*$)/gim, '<h4 style="font-size:1.02rem;font-weight:750;margin:12px 0 6px;color:var(--gray-800);">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="font-size:1.12rem;font-weight:800;margin:14px 0 6px;color:var(--gray-800);">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="font-size:1.22rem;font-weight:800;margin:16px 0 8px;color:var(--gray-800);">$1</h2>');

  // 3. Blockquotes (> Quote)
  html = html.replace(/^> (.*$)/gim, '<blockquote style="border-left:3px solid var(--forest, #6B8E5A);padding-left:12px;margin:8px 0;color:var(--gray-600);font-style:italic;">$1</blockquote>');

  // 4. Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:var(--gray-900);">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong style="font-weight:700;color:var(--gray-900);">$1</strong>');

  // 5. Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 6. Badges [badge: text]
  html = html.replace(/\[badge:\s*([^\]]+)\]/gi, '<span style="display:inline-block;background:var(--sage-light, #E8F0E6);color:var(--forest, #6B8E5A);padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;margin:2px 4px;">$1</span>');

  // 7. Unordered lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom:4px;list-style-type:disc;margin-left:18px;">$1</li>');

  // 8. Ordered lists (1. item)
  html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<li style="margin-bottom:4px;list-style-type:decimal;margin-left:18px;">$2</li>');

  // 9. Convert newlines
  html = html.replace(/\n\n/g, '<div style="height:8px;"></div>');
  html = html.replace(/(<\/(?:h2|h3|h4|li|blockquote)>)\n/gi, '$1');
  html = html.replace(/\n/g, '<br/>');

  return html;
}
window.renderMarkdown = renderMarkdown;

// ── Marquee clone (seamless) ──────────────────────
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}

// ── Add to cart (global handler) ─────────────────
function handleAddToCart(productId, qty = 1) {
  const res = DB.addToCart(productId, 1);
  updateCartBadge();
  if (res && res.alreadyExists) {
    showToast('Item is already in your cart! 🛍️', 'info');
  } else {
    showToast('Added to cart! 🛍️', 'cart');
  }
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
