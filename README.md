# 🎨 MadeByMitzi — Digital Sticker & Invitation Shop

<p align="center">
  <img src="images/madebymitzi.jpg" width="100" height="100" style="border-radius: 50%; border: 4px solid #FFD700;" alt="MadeByMitzi Logo" />
</p>

<p align="center">
  <b>Handcrafted Digital Sticker Packs & Editable Birthday Invitations</b><br>
  <i>A creative, Shopee-inspired e-commerce showcase built for digital creators.</i>
</p>

<p align="center">
  <a href="https://madebymitzi-web.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Live%20Demo-madebymitzi--web.vercel.app-00A86B?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo on Vercel" /></a>
</p>

<p align="center">
  <a href="#-phase-1-interactive-prototype--visual-showcase"><img src="https://img.shields.io/badge/Status-Phase%201%20Complete-brightgreen" alt="Phase 1 Complete" /></a>
  <a href="#-phase-2-roadmap"><img src="https://img.shields.io/badge/Roadmap-Phase%202%20Planned-blue" alt="Phase 2 Planned" /></a>
  <a href="https://www.facebook.com/profile.php?id=100094438778151" target="_blank"><img src="https://img.shields.io/badge/Facebook-MadeByMitzi-1877F2?logo=facebook&logoColor=white" alt="Facebook" /></a>
  <a href="https://www.etsy.com/shop/MadeBymitzidigital" target="_blank"><img src="https://img.shields.io/badge/Etsy-MadeBymitzidigital-F1641E?logo=etsy&logoColor=white" alt="Etsy" /></a>
</p>

---

## 🌟 Project Overview

**MadeByMitzi** is a web storefront inspired by our active [Facebook Page](https://www.facebook.com/profile.php?id=100094438778151) and [Etsy Shop](https://www.etsy.com/shop/MadeBymitzidigital). 

It provides an engaging, showcase-style shopping experience for local and international customers, supporting instant digital downloads, printable files, Canva editable templates, customer reviews, and local Philippine payments (**GCash** and **Bank Transfer**).

---

## 🚀 Phase 1: Interactive Prototype & Visual Showcase (Current)

Phase 1 focuses on visual excellence, responsive layout, Shopee-style e-commerce workflows, and interactive prototype features.

### 📸 Visual Gallery

#### 1. Home Page — Pixel Art Hero & Dynamic Gradient
A nostalgic pixel-art themed hero section with moving multi-stop gradients, floating feature cards, and key business metrics.

![Home Page Desktop](screenshots/01_home_desktop.png)

#### 2. Mobile-Optimized Responsive Experience
Custom portrait mobile mode aligns the background illustration to the left (avoiding centered text overlaps) while positioning the **Shopping Cart icon** directly beside the **Hamburger menu** on the top right.

<p align="center">
  <img src="screenshots/02_home_mobile.png" width="380" alt="Mobile View" />
</p>

#### 3. Call-To-Action (CTA) Section
Features an animated moving gradient (**White ➔ Blue ➔ Red ➔ Pink**) with official brand buttons for **Facebook** (`#1877F2`) and **Etsy** (`#F1641E`).

![CTA Section](screenshots/03_cta_section.png)

#### 4. Product Catalog & Category Filtering
Showcases three distinct product categories with instant client-side filtering, sorting, price range sliders, and search:
- 🎨 **Sticker Packs** (Physical/Printable waterproof sticker packs)
- 💌 **Birthday Invitations** (Canva editable & printable templates)
- ✂️ **Sticker (File only)** (Digital cut files, SVG, PNG, and GoodNotes files)

![Shop Catalog](screenshots/04_shop_catalog.png)

#### 5. Product Details & Star Ratings
Displays high-resolution previews, instant digital delivery badges, quantity selector, and verified customer testimonials with an interactive "Write a Review" form.

![Product Details](screenshots/05_product_detail.png)

#### 6. Shopping Cart & Local Checkout Flow
Shopee-style cart with live subtotal calculation, coupon discounts (`MITZI10` / `WELCOME`), and a checkout flow for **GCash** and **Bank Transfer** with payment screenshot upload and reference number verification.

![Shopping Cart](screenshots/06_checkout_gcash.png)

#### 7. Admin Portal & Management System
Dedicated admin login and management suite at `/admin` for tracking orders, approving payments, inspecting customer receipts, adding/editing products, and updating payment QR codes.

![Admin Portal](screenshots/07_admin_dashboard.png)

---

### 🔑 Phase 1 Demo Credentials

For testing the prototype admin features:
- **Admin URL**: `/login.html` or `/admin/dashboard.html`
- **Username**: `admin_madebymitzi`
- **Password**: `superUser112922`

---

## 🛠️ Technology Stack (Phase 1)

- **Frontend Core**: Semantic HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Modern Vanilla CSS3 with Custom Variables, Keyframe Animations, Glassmorphism & Flexbox/Grid
- **Icons**: FontAwesome 6.5.0 + Custom SVG Pixel Art
- **Typography**: Google Fonts (Poppins & Nunito)
- **Data Persistence**: Browser `localStorage` simulation layer (`js/data.js`)

---

## 📁 Repository Structure

```text
Madebymitzi-web/
├── index.html              # Homepage with animated hero & CTA
├── shop.html               # Product catalog & filter sidebar
├── product.html            # Product detail & customer reviews
├── cart.html               # Shopping cart & coupon code system
├── checkout.html           # GCash & Bank Transfer checkout + receipt upload
├── order-confirm.html      # Order tracking stepper & receipt confirmation
├── login.html              # Admin login page
├── admin/                  # Protected admin area
│   ├── dashboard.html      # Sales metrics & revenue overview
│   ├── products.html       # Product management (add/edit/delete)
│   ├── orders.html         # Payment verification & order approval
│   └── settings.html       # GCash QR & Bank details configuration
├── css/
│   ├── style.css           # Global design system & mobile responsiveness
│   └── admin.css           # Admin panel layout & components
├── js/
│   ├── data.js             # Data layer & localStorage schema
│   └── main.js             # Cart helper, toast alerts & UI utilities
├── images/                 # Brand assets, logos & background illustrations
└── screenshots/            # Showcase screenshots for documentation
```

---

## 🔮 Phase 2 Roadmap: Production Database & Security

In Phase 2, the prototype will be elevated into a secure, production-grade cloud store:

1. **Cloud Database Integration**:
   - Migrate from `localStorage` to **Firebase Cloud Firestore** or **Supabase (PostgreSQL)** for synchronized multi-device data.
2. **Server-Side Admin Security**:
   - Implement real encrypted authentication (OAuth / JWT session tokens) so admin credentials are never stored in client code.
   - Enforce database security rules so only the verified admin can approve orders and view customer payment receipts.
3. **Cloud Media Storage**:
   - Store customer receipt screenshots and high-res digital product files in cloud storage (Firebase Storage / AWS S3 / Supabase Storage).
4. **Automated Notifications**:
   - Automatic email notifications with digital file download links sent upon admin payment confirmation.
5. **Custom Domain & Production Hosting**:
   - Deploy live via **Vercel** with automatic SSL, continuous deployment, and a custom branded domain.

---

## 💻 Local Development

To run this project locally:

```bash
# 1. Clone repository
git clone <YOUR_REPOSITORY_URL>
cd Madebymitzi-web

# 2. Serve static files
npx serve . --listen 3000

# 3. Open in browser
http://localhost:3000
```

---

<p align="center">
  Crafted with ❤️ for <b>MadeByMitzi</b>
</p>
