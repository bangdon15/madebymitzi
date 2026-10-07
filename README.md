# 🎨 MadeByMitzi — Digital Sticker & Invitation Shop

<p align="center">
  <img src="images/madebymitzi.jpg" width="115" height="115" style="border-radius: 50%; border: 4px solid #FF84BA; box-shadow: 0 8px 24px rgba(255, 132, 186, 0.35);" alt="MadeByMitzi Logo" />
</p>

<p align="center">
  <b>Handcrafted Digital Sticker Packs & Editable Birthday Invitations</b><br>
  <i>A sweet artisan digital storefront powered by Google Cloud Firebase, Brevo, and Vercel.</i>
</p>

<p align="center">
  <a href="https://madebymitziph.com" target="_blank"><img src="https://img.shields.io/badge/Official%20Store-madebymitziph.com-FF84BA?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Official Store at madebymitziph.com" /></a>
  <a href="https://madebymitziph.com/mobile/" target="_blank"><img src="https://img.shields.io/badge/Mobile%20App-PWA%20Order%20Manager-FF84BA?style=for-the-badge&logo=pwa&logoColor=white" alt="Mobile Order Manager PWA" /></a>
  <a href="https://github.com/bangdon15/madebymitzi/releases/latest" target="_blank"><img src="https://img.shields.io/badge/Android%20APK-v1.3.3%20Universal-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Download Android APK" /></a>
  <a href="https://madebymitzi-web.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Vercel%20Mirror-madebymitzi--web.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Mirror" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready%20🚀-brightgreen?style=flat-square&logo=checkmarx" alt="Production Ready" />
  <img src="https://img.shields.io/badge/Android%20Target-API%2034%20(Android%2014)-3DDC84?style=flat-square&logo=android" alt="Android 14 Ready" />
  <img src="https://img.shields.io/badge/Voice%20Alert-Pabileeeee!%20🇵🇭-FF6B6B?style=flat-square&logo=airplayvideo" alt="Pabili Voice Alert" />
  <img src="https://img.shields.io/badge/Theme-Sweet%20Artisan%20Kawaii-FF84BA?style=flat-square&logo=sparkles" alt="Sweet Artisan Kawaii Theme" />
  <img src="https://img.shields.io/badge/Database-Firebase%20Firestore-FFA611?style=flat-square&logo=firebase" alt="Firebase Firestore" />
  <img src="https://img.shields.io/badge/Delivery-Direct%20PDF%20Upload-E11D48?style=flat-square&logo=adobeacrobatreader" alt="Direct PDF Upload" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions%20Release-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="GitHub Actions Release" />
  <img src="https://img.shields.io/badge/Support-Free%20After--Sales%20Suite-99C2FF?style=flat-square&logo=messenger" alt="After-Sales Chat" />
  <img src="https://img.shields.io/badge/Hosting-Hostinger%20Production-673DE6?style=flat-square&logo=hostinger" alt="Hostinger Production" />
  <a href="https://www.facebook.com/profile.php?id=100094438778151" target="_blank"><img src="https://img.shields.io/badge/Facebook-MadeByMitzi-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook" /></a>
  <a href="https://www.etsy.com/shop/MadeBymitzidigital" target="_blank"><img src="https://img.shields.io/badge/Etsy-MadeBymitzidigital-F1641E?style=flat-square&logo=etsy&logoColor=white" alt="Etsy" /></a>
</p>

---

## 🌟 Project Overview

**MadeByMitzi** is a modern, responsive e-commerce web application inspired by our active [Facebook Community](https://www.facebook.com/profile.php?id=100094438778151) and [Etsy Shop](https://www.etsy.com/shop/MadeBymitzidigital).

Created for digital planners, party organizers, and stationery enthusiasts, it provides an instant digital fulfillment experience:
- 💌 **Editable Canva Invitations**: 1-click Canva template links with customer customization guides.
- 🎨 **Printable & Waterproof Sticker Packs**: High-resolution print-ready PDF files and pre-cut digital sticker books.
- ✂️ **Digital Cut Files (File-Only)**: Transparent PNGs and vector SVGs optimized for GoodNotes, Cricut, and Silhouette.
- 📱 **Mobile Order Manager (Native Android & PWA)**: Real-time store order feed, authentic Filipino **"Pabileeeee!"** voice alerts, 24/7 background sleep polling via `AlarmManager`, GCash proof zoom, and 1-tap dispatching.
- 📝 **Live Markdown Product Description Editor**: Interactive split-view editor in the Admin panel supporting bold, italic, lists, badges, and emojis with real-time customer-facing rendering.
- 🇵🇭 **Philippine Payment Integrations**: Native checkout workflows for **GCash** and **Bank Transfer** with payment screenshot uploads and reference verification.
- ⚡ **Instant Automated Dispatch**: Real-time receipt delivery and transactional order updates powered by the **Brevo API**.

---

## 🎨 Visual Identity & Sweet Artisan Kawaii Design System

The application features a cheerful, warm **Sweet Artisan Kawaii** aesthetic designed to spark joy, inspire creativity, and build buyer trust:

| Color Token | Hex Code | Visual Role |
| :--- | :--- | :--- |
| **Bubblegum Pink** | `#FF84BA` | Primary brand accent, announcement bar, badges, active toggles & hover highlights |
| **Lemon Honey** | `#FFDF82` | Secondary warm accent, sparkle highlights, review star ratings & notification pills |
| **Sky Candy Blue** | `#99C2FF` | Section titles ("Our Bestsellers", "How It Works", "Shop by Category") & primary CTA buttons |
| **Warm Cream** | `#FFEFE3` / `#FFFDF9` | Frosted glassmorphism navbar background, footer container, and card canvas |
| **Friendly Mocha Plum** | `#442D48` / `#6E506B` | High-contrast body typography, readable footer links, and subtitle text |

### Key UI Innovations
- **Frosted Glass Navbar**: Persistent floating navigation with high-blur backdrop (`backdrop-filter: blur(12px)`) ensuring seamless legibility across all hero backgrounds.
- **Sparkling Announcement Banner**: Edge-to-edge announcement ribbon with soft Lemon Honey sparkles and real-time broadcast sync from Admin Settings.
- **Mitzi Artisan Hero Showcase**: Prominent hero card featuring Mitzi's digital creator showcase with floating status badge (`✨ Digital Creator`) and artisan tape styling.
- **Dynamic Community Slideshow**: Dual-card slideshow carousel bridging customer engagement between our official Facebook page and Etsy store.

---

## 🏗️ System Architecture & Core Capabilities

```mermaid
flowchart TD
    subgraph ClientLayer ["Customer, Admin & Mobile Clients"]
        BuyerBrowser["Customer Browser<br/>(Mobile / Tablet / Desktop)"]
        AdminBrowser["Admin Workstation<br/>(Any Device / No Master Device)"]
        AdminMobile["📱 Mitzi Mobile App (.APK & PWA)<br/>• Universal Android 14 APK (v1.3.3)<br/>• 24/7 Background Wakeup Alert<br/>• Filipino 'Pabileeeee!' Audio<br/>• 1-Tap Verification & Dispatch"]
        ChatWidget["After-Sales Widget<br/>(Order Tracker & Live Chat)"]
    end

    subgraph CloudDatabase ["Google Cloud Platform (Firebase)"]
        FirestoreDB[("Firestore Cloud DB<br/>• mbm_products<br/>• mbm_orders<br/>• mbm_settings<br/>• mbm_reviews")]
        ChunkedFiles[("Chunked File Store<br/>• mbm_files (PDF Chunks up to 5MB)")]
        Analytics["Google Analytics (G-D1824348H4)"]
    end

    subgraph ServerlessBackend ["Vercel Edge Network"]
        EmailAPI["/api/send-email<br/>(Serverless Node.js Relay)"]
    end

    subgraph ThirdPartyGateways ["External Messaging & Notification Gateways"]
        Brevo["Brevo API<br/>(Transactional Email Delivery)"]
        Web3Forms["Web3Forms API<br/>(Emergency Fallback Dispatch)"]
        FBMessenger["Facebook Messenger<br/>(m.me/100094438778151)"]
        BuyerInbox["Buyer Inbox<br/>(Receipt & Download Access)"]
        AdminInbox["Admin Inbox<br/>(madebymitzi26@gmail.com)"]
    end

    subgraph DevOpsPipeline ["GitHub Actions CI/CD Release Pipeline"]
        GHActions["GitHub Actions Runner<br/>(.github/workflows/build-apk.yml)"]
        GHReleases["GitHub Releases<br/>(MadeByMitzi-Orders.apk)"]
    end

    %% Customer Purchasing Flow
    BuyerBrowser -- "1. Submits Order & Payment Proof" --> FirestoreDB
    BuyerBrowser -- "2. Triggers Email Notification" --> EmailAPI
    BuyerBrowser -. "3. Tracks Order Status" .-> FirestoreDB
    ChatWidget -- "Direct Maker Inquiries" --> FBMessenger

    %% Direct Delivery Flow
    BuyerBrowser -- "Downloads Printable PDF" --> ChunkedFiles
    ChunkedFiles -. "Reassembles Chunks to Blob" .-> BuyerBrowser

    %% Mobile Admin Real-time Operations Flow
    AdminMobile -- "1. Polls Orders & 24/7 Sleep Alarm" --> FirestoreDB
    FirestoreDB -. "2. Real-time onSnapshot & REST Sync" .-> AdminMobile
    AdminMobile -- "3. Triggers Loud 'Pabileeeee!' Alert" --> AdminMobile
    AdminMobile -- "4. 1-Tap Approves & Dispatches" --> FirestoreDB
    AdminMobile -- "5. Fires Brevo Receipt Delivery" --> EmailAPI

    %% Email Notification Flow
    EmailAPI -- "Dispatches Buyer Receipt" --> Brevo
    EmailAPI -- "Dispatches Admin Notification" --> Brevo
    EmailAPI -- "Fallback Failover" --> Web3Forms
    Brevo --> BuyerInbox
    Brevo --> AdminInbox

    %% Admin Operations Flow
    AdminBrowser -- "Uploads Products & PDF Chunks" --> ChunkedFiles
    AdminBrowser -- "Manages Hero, Slideshow & Settings" --> FirestoreDB
    FirestoreDB -. "Real-Time onSnapshot Sync" .-> AdminBrowser
    FirestoreDB -. "Real-Time Catalog Sync" .-> BuyerBrowser
    BuyerBrowser -. "Telemetry & Pageviews" .-> Analytics

    %% CI/CD Android App Flow
    GHActions -- "Compiles Gradle 8 & Android 14 App" --> GHReleases
    GHReleases -. "Installs to Seller Smartphone" .-> AdminMobile
```

---

## 🔑 Key Engineering Milestones Accomplished

### 1. Dual-Engine Real-Time Cloud Database (Firestore SDK + REST Fallback)
- **Zero Master Device Dependency**: All products, customer orders, payment settings, and reviews live permanently in Google Cloud Firestore (`madebymitzi-store`).
- **Resilient Fallback Mechanism**: If the Firebase SDK is blocked by client ad-blockers or aggressive mobile networks, the application seamlessly switches to the direct **Firestore REST API** without dropping user operations.
- **Multi-Device Synchronization**: Built-in real-time listeners (`onSnapshot` / custom DOM events) instantly synchronize order statuses, catalog changes, and settings across phones, tablets, and desktop workstations simultaneously.

### 2. Direct In-House Chunked PDF File Storage (Up to 5MB)
- **Zero External Link Vulnerabilities**: Product files are hosted directly within the application's cloud infrastructure—eliminating broken Google Drive or Dropbox links.
- **Firestore Chunker Engine (`mbm_files`)**: Automatically partitions PDF files into ordered ~700KB Base64 chunks to operate within Firestore's 1MB single-document constraint.
- **Instant Client-Side Reassembly**: On order verification, `downloadDirectPdf()` reconstructs the chunks into an in-memory binary Blob, triggering an instant native browser download.

### 3. Automated Dual-Channel Brevo Email Notification System
- **Buyer Order Confirmation**: Instant branded receipt with transaction ID and live tracking link dispatched upon checkout.
- **Admin Instant Alert**: Real-time order notification with customer details and 1-click verification links delivered to `madebymitzi26@gmail.com`.
- **Digital Asset Delivery**: Automatic dispatch of Canva editable links and printable PDF buttons immediately upon admin payment confirmation.

### 4. 100% Free After-Sales Customer Support & Order Tracker
- **Zero Recurring SaaS Costs**: Built-in floating widget (`💬 Need Help?`) available on all storefront pages without third-party subscriptions.
- **Real-Time Order Lookup**: Customers can query order progress (`ORD-XXXXXX`) to inspect verification status and access their verified digital receipt.
- **Direct Maker Chat**: 1-click deep-link to Facebook Messenger (`m.me/100094438778151`) with pre-filled order context for instant human support.

### 5. Dynamic Cloud Media & Gallery Control Center
- **Custom Hero Backgrounds**: Store owner can upload custom background artwork directly in `/admin/settings.html`.
- **Community Slideshow Gallery**: Upload, order, and toggle images in the Facebook/Etsy community cross-promotion banner across all devices.
- **Dual Gradient Controls**: Independent toggles in Admin Settings to enable/disable flowing theme gradients over the hero and community sections.

### 6. Clean Production Launch & Dashboard Reset Routine
- **Fresh Launch State**: All mock/test transactions have been scrubbed from Cloud Firestore and localStorage.
- **Admin Reset Safeguards**: One-click **"Clear All Orders"** and **"Clear All Products"** tools with security confirmation dialogs allow the store owner to reset test data cleanly at any time.

### 7. MadeByMitzi Mobile Order Manager (Native Android APK & PWA)
- **Universal Native Android App (`com.madebymitzi.orders` v1.3.3)**:
  - Built targeting Android 14 (API 34) with backwards compatibility down to Android 7.0 (API 24).
  - Universal hardware & screen support (`<supports-screens>` for phones & tablets) with hardware acceleration.
  - Signed Release packaging with v1 (JAR) & v2 (Full APK) certificates, allowing seamless installation on strict OEM phones (Infinix XOS, Xiaomi MIUI, Samsung One UI) and tablets without security or package parser rejections.
  - Safe Android lifecycle management: foreground service startup and exact alarm initialization bound to `onResume()` with graceful fallback for aggressive battery savers.
- **Crash-Proof Notification Architecture**:
  - Monochrome vector notification icon (`ic_notification.xml`) preventing `BadForegroundServiceNotificationException` crashes on Android 12, 13, and 14.
  - Full multi-density adaptive launcher mipmaps (`mdpi` through `xxxhdpi`) plus round icons.
- **24/7 Sleep & Closed Screen Monitoring**:
  - Leverages Android's native `AlarmManager` (`OrderAlarmReceiver`) to intermittently wake up the device and query Firestore for new pending orders, even when the phone is locked, asleep, or the app is killed.
  - Automatic re-registration upon device restart via `BootReceiver` (`RECEIVE_BOOT_COMPLETED`).
  - High-priority notification channel (`OrderNotificationService`) delivering immediate heads-up alert banners with vibration and custom sound.
  - Notification intent handler configured to open the order modal silently without triggering re-alert loops.
- **Authentic Filipino "Pabileeeee!" Voice Alert**:
  - Extracted authentic 2-second **"Pabileeeee!"** audio from actual store footage, normalized and acoustic-tuned for immediate audibility in busy or noisy environments.
  - Native fallback chime with volume control and manual test button.
- **1-Tap Fast Dispatch & GCash Proof Inspector**:
  - Responsive order cards with customer names, GCash references, order items, and badge status counters.
  - Dedicated bottom sheet / tablet modal with 1-tap **"Approve & Dispatch"** (instantly triggering Brevo digital link delivery) and **"Decline"** actions.
  - Clickable proof-of-payment zoom modal for instant verification of GCash/Bank screenshots.
- **Automated GitHub Actions Release Pipeline**:
  - Full CI/CD workflow (`.github/workflows/build-apk.yml`) triggered on pushes to `android/**` or `mobile/**`.
  - Automatically installs JDK 17 & Gradle 8.5, builds both signed Release and Debug APKs, creates GitHub Release tag `mobile-v1.3.2`, and uploads `MadeByMitzi-Orders.apk` as a downloadable asset.

### 8. Live Markdown Description Editor & Rich Product Showcase
- **Split-Screen Markdown Editor**: Built into the Admin Products modal with quick formatting buttons for **Bold**, *Italic*, Headings (`###`), Bullet Lists (`-`), and Badges (`[badge: Text]`).
- **Live Preview Tab**: Instant rendering preview allowing the maker to review product descriptions before publishing to the live catalog.
- **Client-Side Markdown Engine**: Lightweight parser in `js/main.js` (`renderMarkdown()`) rendering clean typography, styled lists, and colorful badge pills on customer product pages.

---

## 🛡️ Security Risk Assessment & Production Hardening

| Component | Security Concern | Production Mitigation Implemented |
| :--- | :--- | :--- |
| **Firebase API Key** | Public exposure in frontend code | Verified public client identifier by Google Cloud design. Enforced domain-level restrictions and locked backend collections via Firestore Security Rules. |
| **Firestore Security** | Unauthorized writes/deletions | Scoped security rules (`firestore.rules`): Public catalog read; authenticated admin write for products and settings; append-only for customer orders. |
| **Email Relay** | Spam abuse of transactional email keys | All outbound mail is routed through the serverless backend (`/api/send-email.js`). Sender domain is locked and verified to `brepublic15@gmail.com`. |
| **Payment Verification** | Fake reference numbers or forged receipts | Digital download links are strictly withheld in `pending` status until admin manually verifies proof of payment in the Admin Orders portal or Mobile App. |
| **Admin Authentication** | Brute-force attacks on admin credentials | Salted SHA-256 client password verification with progressive 60-second lockouts after 5 consecutive failed attempts. |
| **Android Permissions** | Exact alarm and background battery restrictions | Guarded `SCHEDULE_EXACT_ALARM` checking Android 12+ capabilities with graceful inexact fallback; foreground service notification adherence for Android 14. |

---

## 📸 Visual Showcase & Screenshots Gallery

### 1. Home Page — Sweet Artisan Kawaii Hero & Floating Glass Navbar
Features our vibrant bubblegum pink branding, Mitzi artisan showcase card, live status badge (`✨ Digital Creator`), and dynamic hero typography.

![Home Page Desktop](screenshots/01_home_desktop.png)

### 2. Mobile-Optimized Responsive Experience
Portrait mobile view perfectly centers navigation elements, stacks quick statistics, and scales product cards for effortless one-handed browsing on smartphones.

<p align="center">
  <img src="screenshots/02_home_mobile.png" width="360" alt="Mobile View" />
</p>

### 3. Community Slideshow & Cross-Platform Showcase
Dual-card showcase linking customers directly to our official Facebook page and Etsy store with smooth hover interactions and database-backed gallery uploads.

![Community Showcase](screenshots/03_cta_section.png)

### 4. Meet the Maker — Artisan Showcase Card
Polished portfolio showcase featuring Mitzi, artisan washi-tape styling, verified creator badge, and floating community rating.

![Meet the Maker Profile](screenshots/13_maker_profile.png)

### 5. Product Catalog & Category Filtering
Comprehensive shop catalog featuring instant multi-category filtering (**Stickers**, **Invitations**, **Sticker - File only**), search, and live Firestore synchronization:

![Shop Catalog](screenshots/04_shop_catalog.png)

### 6. Product Details & Interactive Review Suite
Detailed preview modal showcasing high-resolution image carousels, instant delivery badges, Canva/PDF inclusion tags, and verified customer reviews.

![Product Details](screenshots/05_product_detail.png)

### 7. Shopping Cart & Philippine Payment Checkout
Seamless cart drawer supporting **GCash** and **Bank Transfer** checkout, QR code scanning, reference number input, and payment receipt upload.

![Shopping Cart](screenshots/06_checkout_gcash.png)

### 8. Fresh Live Production Admin Dashboard
Centralized operations dashboard displaying verified earnings, confirmed orders, pending verification queue, and active catalog metrics starting from a fresh 0-order launch state.

![Admin Portal](screenshots/07_admin_dashboard.png)

### 9. Order Management & One-Click Verification
Order inspection center where the store owner reviews uploaded GCash receipts, verifies transaction numbers, approves digital file delivery, or clears test orders.

![Admin Orders](screenshots/08_admin_orders.png)

### 10. Product Catalog & Direct PDF Uploader
Inventory management portal allowing the store owner to add products, format rich Markdown descriptions, and attach direct in-house PDF downloads.

![Admin Products](screenshots/09_admin_products.png)

### 11. In-House Chunked PDF File Uploader Modal
Interactive drag-and-drop PDF uploader slicing files into cloud chunks, enabling seamless digital fulfillment without external link dependencies.

![Admin PDF Direct Uploader](screenshots/14_pdf_direct_upload.png)

### 12. Interactive Markdown Description Editor
Modern split-view editor modal with formatting shortcuts (Bold, Italic, Headings, Lists, Badges) and live client preview:

![Markdown Editor Write](screenshots/admin_products_markdown_editor_write.png)
![Markdown Editor Preview](screenshots/admin_products_markdown_preview.png)

### 13. Formatted Product Details on Storefront
Richly formatted product description rendered on the customer storefront with badges, bold highlights, and clean typography:

![Rendered Product Markdown](screenshots/customer_product_markdown_rendered.png)

### 14. Cloud Settings & Dynamic Media Gallery Control
Comprehensive control center for updating GCash QR codes, bank accounts, Brevo email keys, hero backgrounds, and community slideshow galleries.

![Admin Settings](screenshots/10_admin_settings.png)

### 15. Customer Digital Receipt & Order Status Stepper
Interactive customer receipt page featuring a live verification stepper (`Pending` ➔ `Confirmed`), reference tracking, and 1-click Canva / PDF download buttons.

![Customer Digital Receipt](screenshots/11_customer_receipt.png)

### 16. 100% Free After-Sales Customer Support Widget
Floating support widget allowing buyers to track orders by ID in real time or initiate direct conversations with Mitzi on Facebook Messenger.

![After-Sales Chat Widget](screenshots/15_after_sales_chat.png)

### 17. Secure Admin Authentication Portal
Multi-tiered login portal featuring salted SHA-256 password hashing, brute-force rate-limiting, and 1-click **Sign In with Google (Mitzi Preset)** for verified owner devices.

![Admin Login Portal](screenshots/12_admin_login.png)

---

## 🔑 Admin & Mobile Portals Access

For managing the store on staging, production, or mobile:
- **Admin Web Portal**: [`https://madebymitziph.com/login.html`](https://madebymitziph.com/login.html)
- **Direct Web Dashboard**: [`https://madebymitziph.com/admin/dashboard.html`](https://madebymitziph.com/admin/dashboard.html)
- **Mobile Order Manager (PWA)**: [`https://madebymitziph.com/mobile/`](https://madebymitziph.com/mobile/)
- **Download Latest Android APK**: [`GitHub Releases: MadeByMitzi-Orders.apk`](https://github.com/bangdon15/madebymitzi/releases/latest)
- Access is restricted to authorized store administration.
- **1-Click Verified Login**: Click **"Sign In with Google (Mitzi Preset)"** on recognized store owner devices.

---

## 💻 Local Development & Build Setup

### 1. Run Web Storefront & Admin Locally
```bash
# Clone the repository
git clone https://github.com/bangdon15/madebymitzi.git
cd Madebymitzi-web

# Serve static files locally
npx serve . -p 3000

# Open in browser:
# Storefront: http://localhost:3000
# Mobile App: http://localhost:3000/mobile/
# Admin:      http://localhost:3000/login.html
```

### 2. Build Android App Locally
```bash
# Navigate to the Android project folder
cd android

# Build the Debug APK using Gradle
./gradlew assembleDebug

# The compiled APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Automated CI/CD Android Releases
Pushes to `main` with changes under `android/**` or `mobile/**` automatically trigger the GitHub Actions workflow (`.github/workflows/build-apk.yml`), compiling the APK and publishing a new release with the attached `MadeByMitzi-Orders.apk` asset.

---

<p align="center">
  Crafted with ❤️ for <b>MadeByMitzi</b> • 2026<br>
  <i>Empowering celebrations with handcrafted digital creations.</i>
</p>
