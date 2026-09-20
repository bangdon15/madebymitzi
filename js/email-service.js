/**
 * MadeByMitzi — Automated Email & Receipt Delivery Service
 * 
 * Handles:
 * 1. Admin Order Alerts with 1-click "Confirm Payment Received" links.
 * 2. Automated Buyer Digital Delivery with Canva/PDF download links & Official Receipt.
 * 3. HTML Receipt generation for printing and emailing.
 * 4. Multi-provider delivery: Web3Forms API, Vercel API, and Cloud Firestore.
 */

const EmailService = {
  
  /**
   * Returns current origin/base URL for confirmation and receipt links
   */
  getBaseUrl() {
    if (typeof window !== 'undefined' && window.location) {
      // If running on custom domain or vercel
      return window.location.origin;
    }
    return 'https://madebymitziph.com';
  },

  /**
   * Generates a clean, professional HTML Receipt
   */
  generateReceiptHtml(order, isConfirmed = false) {
    const cust = order.customer || {};
    const items = order.items || [];
    const dateFormatted = new Date(order.createdAt || Date.now()).toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const baseUrl = this.getBaseUrl();
    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const receiptUrl = `${baseUrl}/receipt.html?id=${order.id}${orderData ? `&order_data=${orderData}` : ''}`;

    const itemsRows = items.map((item, idx) => {
      const prod = (typeof DB !== 'undefined') ? DB.getProduct(item.productId) : null;
      const canvaLink = prod?.canvaLink || item.canvaLink || '';
      const pdfLink = prod?.pdfLink || item.pdfLink || '';
      
      let deliveryLinks = '';
      if (isConfirmed) {
        deliveryLinks = `
          <div style="margin-top: 8px; font-size: 13px;">
            ${canvaLink ? `<a href="${canvaLink}" target="_blank" style="display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;padding:6px 14px;border-radius:6px;font-weight:bold;margin-right:8px;font-size:12px;">🎨 Open Canva Template</a>` : ''}
            ${pdfLink ? `<a href="${pdfLink}" target="_blank" style="display:inline-block;background:#0F52BA;color:#ffffff;text-decoration:none;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:12px;">📥 Download PDF</a>` : ''}
            ${(!canvaLink && !pdfLink) ? `<a href="${receiptUrl}" target="_blank" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:12px;">📥 Access Digital Files</a>` : ''}
          </div>
        `;
      }

      return `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 12px 8px; vertical-align: top;">
            <strong style="color: #1F2937; font-size: 14px;">${item.name || 'Digital Item'}</strong>
            ${deliveryLinks}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #4B5563; font-size: 14px; vertical-align: top;">
            ${item.qty}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #4B5563; font-size: 14px; vertical-align: top;">
            ₱${Number(item.price || 0).toLocaleString()}
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #1F2937; font-weight: bold; font-size: 14px; vertical-align: top;">
            ₱${Number((item.price || 0) * (item.qty || 1)).toLocaleString()}
          </td>
        </tr>
      `;
    }).join('');

    const statusBadge = isConfirmed
      ? `<span style="background:#DCFCE7;color:#15803D;padding:6px 14px;border-radius:20px;font-weight:800;font-size:13px;display:inline-block;">✔ PAYMENT VERIFIED & CONFIRMED</span>`
      : `<span style="background:#FEF3C7;color:#B45309;padding:6px 14px;border-radius:20px;font-weight:800;font-size:13px;display:inline-block;">⏳ PENDING PAYMENT VERIFICATION</span>`;

    return `
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0F52BA 0%, #008080 100%); padding: 28px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.5px;">🎨 MadeByMitzi</h1>
          <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Official Digital Purchase Receipt</p>
          <div style="margin-top: 14px;">${statusBadge}</div>
        </div>

        <!-- Receipt Meta Info -->
        <div style="padding: 24px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #4B5563;">
            <tr>
              <td style="padding: 4px 0;"><strong>Receipt / Order #:</strong> <span style="font-family:monospace;color:#1F2937;font-weight:700;">${order.id}</span></td>
              <td style="padding: 4px 0; text-align: right;"><strong>Date & Time:</strong> ${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Customer Name:</strong> ${cust.name || 'Valued Customer'}</td>
              <td style="padding: 4px 0; text-align: right;"><strong>Payment Method:</strong> ${(order.paymentMethod || 'GCash').toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>Customer Email:</strong> ${cust.email || 'N/A'}</td>
              <td style="padding: 4px 0; text-align: right;"><strong>Reference #:</strong> <span style="font-family:monospace;color:#0F52BA;font-weight:700;">${order.refNumber || '—'}</span></td>
            </tr>
            ${cust.phone ? `<tr><td style="padding: 4px 0;" colspan="2"><strong>Contact Phone:</strong> ${cust.phone}</td></tr>` : ''}
          </table>
        </div>

        <!-- Items Table -->
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #E5E7EB; text-align: left; font-size: 12px; color: #6B7280; text-transform: uppercase;">
                <th style="padding: 8px;">Item Description</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Unit Price</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="margin-top: 20px; border-top: 2px solid #E5E7EB; padding-top: 16px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #6B7280;">Subtotal:</td>
                <td style="padding: 4px 0; text-align: right; color: #1F2937;">₱${Number(order.subtotal || order.total || 0).toLocaleString()}</td>
              </tr>
              ${order.discount ? `
              <tr>
                <td style="padding: 4px 0; color: #16A34A;">Discount:</td>
                <td style="padding: 4px 0; text-align: right; color: #16A34A;">-₱${Number(order.discount).toLocaleString()}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #E5E7EB;">
                <td style="padding: 10px 0; font-size: 16px; font-weight: 800; color: #1F2937;">Total Paid:</td>
                <td style="padding: 10px 0; font-size: 18px; font-weight: 900; color: #0F52BA; text-align: right;">₱${Number(order.total || 0).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Proof & Online Link -->
          <div style="margin-top: 24px; padding: 16px; background: #EFF6FF; border-radius: 12px; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 13px; color: #1E40AF;">
              Need a permanent copy or live tracking?
            </p>
            <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: #0F52BA; color: #ffffff; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: bold; text-decoration: none;">
              📄 View Official Receipt Online
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 16px; text-align: center; font-size: 12px; color: #6B7280;">
          <p style="margin: 0;">Thank you for your purchase! Made with 💛 by MadeByMitzi.</p>
          <p style="margin: 4px 0 0;">Questions? Message us on Facebook or reply directly to this email.</p>
        </div>
      </div>
    `;
  },

  /**
   * Generates full email HTML for Customer when an order is first submitted (Receipt with Pending Status)
   */
  generateCustomerPendingOrderHtml(order) {
    const cust = order.customer || {};
    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const receiptHtml = this.generateReceiptHtml(order, false);
    const baseUrl = this.getBaseUrl();
    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const receiptUrl = `${baseUrl}/receipt.html?id=${order.id}${orderData ? `&order_data=${orderData}` : ''}`;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px;">
        <div style="max-width: 650px; margin: 0 auto;">

          <!-- Pending Notice Card -->
          <div style="background: #ffffff; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px; border-top: 6px solid #F59E0B; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
            <div style="font-size: 44px; margin-bottom: 8px;">🛍️ ⏳</div>
            <h2 style="margin: 0; color: #1F2937; font-size: 22px;">Order Placed — Payment Verification in Progress</h2>
            <p style="color: #4B5563; font-size: 15px; margin: 10px 0 20px; line-height: 1.5;">
              Hi <strong>${cust.name || 'Valued Customer'}</strong>,<br/>
              Thank you so much for ordering with MadeByMitzi! We have received your order details and payment reference: <strong style="font-family:monospace;color:#0F52BA;">${order.refNumber || 'N/A'}</strong>.
            </p>

            <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 14px; color: #92400E;">
              <strong style="font-size: 15px;">⏳ What Happens Next:</strong>
              <p style="margin: 8px 0 0; line-height: 1.5;">
                Designer Mitzi Santos is currently verifying your ${(order.paymentMethod || 'GCash').toUpperCase()} payment. As soon as verified, you will receive a second email releasing your <strong>editable Canva template links</strong> and <strong>high-resolution printable PDF links</strong>!
              </p>
            </div>

            <!-- View Receipt Button -->
            <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: #0F52BA; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 10px rgba(15,82,186,0.25);">
              📄 View Live Official Receipt Online
            </a>
          </div>

          <!-- Official Itemized Receipt with Pending Status -->
          ${receiptHtml}

          <!-- Note from Mitzi -->
          <div style="margin-top: 24px; background: #ffffff; border-radius: 16px; padding: 20px; text-align: center; font-size: 13px; color: #6B7280; border: 1px solid #E5E7EB;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #1F2937;">💌 A Note from Mitzi Santos:</p>
            <p style="margin: 0; font-style: italic;">"Thank you for supporting MadeByMitzi! If you need any assistance, reply directly to this email or chat with us on Facebook."</p>
            <div style="margin-top: 12px; font-size: 12px;">
              Chat with us: <a href="${settings.shopFacebook || 'https://www.facebook.com/profile.php?id=100094438778151'}" target="_blank" style="color:#0F52BA;font-weight:bold;">Facebook Messenger</a>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generates full email HTML for Admin when a new order is submitted
   */
  generateAdminAlertHtml(order) {
    const cust = order.customer || {};
    const baseUrl = this.getBaseUrl();
    const confirmUrl = `${baseUrl}/admin/orders.html?confirm_order=${order.id}&action=confirm`;
    const receiptHtml = this.generateReceiptHtml(order, false);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px;">
        <div style="max-width: 650px; margin: 0 auto;">
          
          <!-- Immediate Action Card -->
          <div style="background: #ffffff; border: 2px solid #F59E0B; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(245,158,11,0.15);">
            <div style="font-size: 40px; margin-bottom: 8px;">🛒 🔔</div>
            <h2 style="margin: 0; color: #1F2937; font-size: 22px;">New Order Placed: ${order.id}</h2>
            <p style="color: #6B7280; font-size: 14px; margin: 8px 0 20px;">
              <strong>${cust.name || 'Customer'}</strong> ordered <strong>${(order.items || []).length} item(s)</strong> totaling <strong style="color:#0F52BA;font-size:16px;">₱${Number(order.total || 0).toLocaleString()}</strong>.
            </p>

            <div style="background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: left; font-size: 13px; color: #92400E;">
              <div><strong>Payment Method:</strong> ${(order.paymentMethod || 'GCash').toUpperCase()}</div>
              <div><strong>Reference / Transaction Number:</strong> <span style="font-family:monospace;font-weight:bold;font-size:14px;color:#1F2937;">${order.refNumber || 'None provided'}</span></div>
              ${order.receiptImage ? `<div><strong>Screenshot Proof:</strong> Attached (View inside admin or receipt)</div>` : ''}
              <div style="margin-top: 6px; font-size: 12px; color: #78350F;">
                💡 <em>Check your ${order.paymentMethod || 'GCash'} app to verify that ₱${Number(order.total || 0).toLocaleString()} has entered your account.</em>
              </div>
            </div>

            <!-- Prominent Confirm Button -->
            <a href="${confirmUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 400px; background: #16A34A; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 900; padding: 15px 24px; border-radius: 12px; box-shadow: 0 4px 12px rgba(22,163,74,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
              👉 Click Here If You Received The Payment
            </a>

            <div style="margin-top: 14px; font-size: 12px; color: #9CA3AF;">
              Clicking this link will open your admin dashboard to verify payment and automatically email the Canva & PDF download links to ${cust.email || 'the customer'}.
            </div>
          </div>

          <!-- Embedded Receipt -->
          ${receiptHtml}

        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generates full email HTML for Buyer when Mitzi confirms payment
   */
  generateBuyerDeliveryHtml(order) {
    const cust = order.customer || {};
    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const receiptHtml = this.generateReceiptHtml(order, true);
    const baseUrl = this.getBaseUrl();
    const receiptUrl = `${baseUrl}/receipt.html?id=${order.id}`;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #F3F4F6; margin: 0; padding: 24px;">
        <div style="max-width: 650px; margin: 0 auto;">

          <!-- Celebration Message -->
          <div style="background: #ffffff; border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px; border-top: 6px solid #16A34A; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
            <div style="font-size: 44px; margin-bottom: 8px;">🎉 ✨</div>
            <h2 style="margin: 0; color: #1F2937; font-size: 22px;">Payment Confirmed! Your Designs Are Ready</h2>
            <p style="color: #4B5563; font-size: 15px; margin: 10px 0 20px; line-height: 1.5;">
              Hi <strong>${cust.name || 'Valued Customer'}</strong>,<br/>
              Thank you so much! Your payment of <strong>₱${Number(order.total || 0).toLocaleString()}</strong> for Order <strong>${order.id}</strong> has been verified and confirmed.
            </p>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: left; font-size: 14px; color: #166534;">
              <strong style="font-size: 15px;">📥 Your Digital Design Access:</strong>
              <p style="margin: 8px 0 0; line-height: 1.5;">
                Your editable Canva template links and high-resolution printable PDF links are ready below in your Official Receipt! Click the respective buttons to open and download them immediately.
              </p>
            </div>

            <!-- View Receipt Button -->
            <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: #0F52BA; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 10px rgba(15,82,186,0.25);">
              📄 View / Download Official Receipt & Files
            </a>
          </div>

          <!-- Official Itemized Receipt with Live Links -->
          ${receiptHtml}

          <!-- Note from Mitzi -->
          <div style="margin-top: 24px; background: #ffffff; border-radius: 16px; padding: 20px; text-align: center; font-size: 13px; color: #6B7280; border: 1px solid #E5E7EB;">
            <p style="margin: 0 0 6px; font-weight: bold; color: #1F2937;">💌 A Note from Mitzi Santos:</p>
            <p style="margin: 0; font-style: italic;">"${settings.emailDeliveryNote || 'Enjoy your designs! Tag us on Facebook or leave us a review.'}"</p>
            <div style="margin-top: 12px; font-size: 12px;">
              Need help? Reply to this email or chat with us on 
              <a href="${settings.shopFacebook || 'https://www.facebook.com/profile.php?id=100094438778151'}" target="_blank" style="color:#0F52BA;font-weight:bold;">Facebook</a>.
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
  },

  /**
   * Dispatches an email via configured API (Gmail SMTP via Vercel serverless, Resend, or Web3Forms)
   */
  async sendEmail({ to, subject, html, text, fromName, replyTo }) {
    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const gmailAppPassword = (settings.gmailAppPassword || localStorage.getItem('mbm_gmail_app_password') || '').replace(/\s+/g, '');
    const brevoApiKey = (settings.brevoApiKey || localStorage.getItem('mbm_brevo_key') || '').trim();
    const rawBrevoSender = (settings.brevoSenderEmail || localStorage.getItem('mbm_brevo_sender') || '').trim();
    const brevoSenderEmail = (rawBrevoSender.toLowerCase().includes('madebymitzi') || !rawBrevoSender) ? 'brepublic15@gmail.com' : rawBrevoSender;
    const resendKey = settings.resendApiKey || localStorage.getItem('mbm_resend_key') || '';
    const web3Key = settings.web3FormsKey || localStorage.getItem('mbm_web3forms_key') || '3a8a2077-18e1-4a7c-a3aa-8a3b08b341e7';

    // 1. Log to Firestore `mbm_notifications` for cloud telemetry
    if (typeof window !== 'undefined' && window.FirebaseService && window.FirebaseService.isInitialized && window.FirebaseService.db) {
      try {
        await window.FirebaseService.db.collection('mbm_notifications').add({
          to,
          subject,
          text: text || '',
          sentAt: new Date().toISOString(),
          status: 'queued'
        });
      } catch (e) {
        console.warn('Firestore notification record write error:', e);
      }
    }

    // 2. Primary: Try Vercel Serverless `/api/send-email` (Gmail SMTP, Brevo, or Resend)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          to,
          subject,
          html: html || text,
          text,
          fromName: fromName || settings.emailSenderName || 'MadeByMitzi Digital Store',
          replyTo: replyTo || settings.orderNotifyTo || 'madebymitzi26@gmail.com',
          gmailAppPassword,
          brevoApiKey,
          brevoSenderEmail,
          resendKey,
          web3Key
        })
      });

      const data = await res.json().catch(() => null);
      if (data) {
        if (data.success) {
          console.log(`✅ Email delivered to ${to} via ${data.method}:`, data);
          return { success: true, method: data.method, message: data.message || `Email delivered to ${to}` };
        } else if (data.method === 'gmail_smtp_error' || data.method === 'brevo_error') {
          console.warn('Email provider error:', data);
          return { success: false, method: data.method, message: data.message };
        }
      }
    } catch (apiErr) {
      console.warn('Serverless email dispatch error:', apiErr);
    }

    // 3. Resend Client-Side Direct API (if key available and serverless unavailable)
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'MadeByMitzi <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html || text,
            text: text
          })
        });
        const data = await res.json();
        if (res.ok && data.id) {
          console.log('✅ Email sent successfully via Resend to:', to);
          return { success: true, method: 'resend', message: 'Email sent directly via Resend to ' + to };
        }
      } catch (e) {
        console.warn('Resend direct dispatch error:', e);
      }
    }

    // 4. Web3Forms API: ONLY suitable for admin notifications (delivers only to account owner)
    const isAdminNotification = to.toLowerCase().includes('madebymitzi') || to.toLowerCase().includes('admin');
    const activeWeb3Key = web3Key || '3a8a2077-18e1-4a7c-a3aa-8a3b08b341e7';
    if (activeWeb3Key && isAdminNotification) {
      try {
        const payload = {
          access_key: activeWeb3Key,
          name: fromName || settings.emailSenderName || 'MadeByMitzi Orders',
          email: to || settings.orderNotifyTo || 'madebymitzi26@gmail.com',
          reply_to: replyTo || settings.orderNotifyTo || 'madebymitzi26@gmail.com',
          from_name: fromName || settings.emailSenderName || 'MadeByMitzi Orders',
          subject: subject,
          message: text || html
        };

        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        });
        const data = await res.json();
        if (data.success) {
          console.log('✅ Admin alert sent successfully via Web3Forms to:', to);
          return { success: true, method: 'web3forms', message: 'Email sent directly to ' + to };
        } else {
          return { success: false, method: 'web3forms', message: data.message || 'Web3Forms error' };
        }
      } catch (err) {
        console.warn('Web3Forms dispatch error:', err);
      }
    }

    // 5. If emailing customer but no outbound provider configured
    if (!isAdminNotification) {
      return {
        success: false,
        method: 'no_outbound_provider',
        message: 'Customer email requires a free Google App Password in Admin Settings (Web3Forms free tier does not send to customers).'
      };
    }

    return {
      success: false,
      method: 'no_key',
      message: 'No email service configured. Please enter your free Google App Password or Web3Forms Key in Settings.'
    };
  },

  /**
   * Action 1: Send Order Alert to Admin when an order is placed
   */
  async sendOrderAlertToAdmin(order) {
    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const adminEmail = settings.orderNotifyTo || 'madebymitzi26@gmail.com';
    const custName = order.customer?.name || 'Customer';
    const subject = `🛒 New Order Alert: ${order.id} (₱${order.total}) from ${custName}`;
    const html = this.generateAdminAlertHtml(order);

    // Generate secure 1-click authentication token so Mitzi doesn't have to re-login from email
    const authKey = (typeof DB !== 'undefined') ? DB.generateOrderAuthToken(order.id) : '';
    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const confirmUrl = `${this.getBaseUrl()}/admin/orders.html?confirm_order=${order.id}&action=confirm&auth_key=${authKey}&order_data=${orderData}`;
    const receiptUrl = `${this.getBaseUrl()}/receipt.html?id=${order.id}&order_data=${orderData}`;

    const itemsList = (order.items || []).map((item, idx) => {
      return `  ${idx + 1}. ${item.name || 'Digital Item'} (Qty: ${item.qty}) — ₱${Number((item.price || 0) * (item.qty || 1)).toLocaleString()}`;
    }).join('\n');

    const text = `
🛒 NEW ORDER ALERT - MADEBYMITZI
========================================
Order Number: ${order.id}
Date: ${new Date(order.createdAt || Date.now()).toLocaleString('en-PH')}
Customer Name: ${custName}
Customer Email: ${order.customer?.email || 'N/A'}
Customer Phone: ${order.customer?.phone || 'N/A'}

📦 ITEMS ORDERED:
${itemsList || '  (Digital Items)'}

Subtotal: ₱${Number(order.subtotal || order.total || 0).toLocaleString()}
${order.discount ? `Discount: -₱${Number(order.discount).toLocaleString()}\n` : ''}Total Amount: ₱${Number(order.total || 0).toLocaleString()}
Payment Method: ${(order.paymentMethod || 'GCash').toUpperCase()}
Reference / Ref #: ${order.refNumber || 'N/A'}

----------------------------------------
👉 ACTION REQUIRED (1-CLICK CONFIRMATION):
Check your ${(order.paymentMethod || 'GCash').toUpperCase()} app to verify that ₱${Number(order.total || 0).toLocaleString()} has arrived in your account.
Once verified, click the link below to verify payment and automatically email the digital download links to the buyer:

👉 CLICK HERE IF YOU RECEIVED THE PAYMENT:
${confirmUrl}

----------------------------------------
📄 VIEW OFFICIAL PRINTABLE RECEIPT / PDF:
${receiptUrl}
(Open link to inspect, download, or print the official PDF receipt)
========================================
`.trim();

    console.log(`📨 Triggering Admin Order Alert for ${order.id} to ${adminEmail}...`);
    return await this.sendEmail({
      to: adminEmail,
      subject,
      html,
      text,
      fromName: 'MadeByMitzi Checkout',
      replyTo: order.customer?.email || adminEmail
    });
  },

  /**
   * Action 1b: Send Order Receipt & Pending Verification status to Customer
   */
  async sendCustomerOrderReceived(order) {
    const custEmail = order.customer?.email;
    if (!custEmail) return { success: false, message: 'No customer email specified' };

    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const custName = order.customer?.name || 'Valued Customer';
    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const receiptUrl = `${this.getBaseUrl()}/receipt.html?id=${order.id}${orderData ? `&order_data=${orderData}` : ''}`;

    const itemsList = (order.items || []).map((item, idx) => {
      return `  ${idx + 1}. ${item.name || 'Digital Item'} (Qty: ${item.qty}) — ₱${Number((item.price || 0) * (item.qty || 1)).toLocaleString()}`;
    }).join('\n');

    const subject = `🛍️ Order Placed & Verification in Progress [#${order.id}] — MadeByMitzi`;
    const html = this.generateCustomerPendingOrderHtml(order);
    const text = `
🎉 SALAMAT! ORDER RECEIVED - MADEBYMITZI
========================================
Hi ${custName},

Thank you so much for ordering with MadeByMitzi! We have received your order details and payment reference (${order.refNumber || 'N/A'}).

Designer Mitzi Santos is currently verifying your ${(order.paymentMethod || 'GCash').toUpperCase()} payment. As soon as verified, your Canva editable template links and high-resolution PDF download links will be released!

📦 ORDER SUMMARY:
Order Number: ${order.id}
${itemsList || '  (Digital Items)'}

Total Amount: ₱${Number(order.total || 0).toLocaleString()}
Payment Method: ${(order.paymentMethod || 'GCash').toUpperCase()}
Reference / Ref #: ${order.refNumber || 'N/A'}

----------------------------------------
📄 VIEW YOUR OFFICIAL LIVE RECEIPT:
${receiptUrl}
(You can open this link anytime for live payment verification and file download status)

💌 A Note from Mitzi Santos:
"Thank you so much for supporting MadeByMitzi! If you have any questions or need rush assistance, please reply directly to this email or chat with us on Facebook."

Facebook Page:
${settings.shopFacebook || 'https://www.facebook.com/profile.php?id=100094438778151'}
========================================
`.trim();

    console.log(`📨 Triggering Customer Confirmation for ${order.id} to ${custEmail}...`);
    return await this.sendEmail({
      to: custEmail,
      subject,
      html,
      text,
      fromName: 'MadeByMitzi Digital Store',
      replyTo: settings.orderNotifyTo || 'madebymitzi26@gmail.com'
    });
  },

  /**
   * Action 2: Send Digital Delivery & Official Receipt to Buyer when Mitzi confirms payment
   */
  async sendBuyerDigitalDelivery(order) {
    const custEmail = order.customer?.email;
    if (!custEmail) {
      return { success: false, message: 'Buyer does not have an email address specified.' };
    }

    const settings = (typeof DB !== 'undefined') ? DB.getSettings() : {};
    const subject = `✨ Your MadeByMitzi Digital Order & Official Receipt [${order.id}]`;
    const orderData = (typeof DB !== 'undefined') ? DB.encodeOrderData(order) : '';
    const receiptUrl = `${this.getBaseUrl()}/receipt.html?id=${order.id}${orderData ? `&order_data=${orderData}` : ''}`;
    const html = this.generateBuyerDeliveryHtml(order);

    const itemsSummary = (order.items || []).map((item, idx) => {
      const prod = (typeof DB !== 'undefined') ? DB.getProduct(item.productId) : null;
      let links = '';
      if (prod?.canvaLink) links += `\n   🔗 Canva Template: ${prod.canvaLink}`;
      if (prod?.pdfLink) links += `\n   📥 Printable PDF: ${prod.pdfLink}`;
      return `${idx + 1}. ${item.name || 'Digital Item'} (Qty: ${item.qty})${links}`;
    }).join('\n\n');

    const text = `
🎉 PAYMENT CONFIRMED - YOUR DIGITAL DESIGNS ARE READY!
========================================
Hi ${order.customer?.name || 'Valued Customer'},

Thank you so much for ordering with MadeByMitzi! Your payment of ₱${Number(order.total || 0).toLocaleString()} for Order #${order.id} has been verified and confirmed.

📥 YOUR DIGITAL FILES & ACCESS LINKS:
${itemsSummary}

----------------------------------------
📄 OFFICIAL PURCHASE RECEIPT / PRINTABLE PDF:
${receiptUrl}
(Click the link above to view, download, or print your official PDF receipt anytime)

💌 A Note from Mitzi Santos:
"${settings.emailDeliveryNote || 'Enjoy your designs! Tag us on Facebook or leave us a review.'}"

Need help editing or printing?
Reply directly to this email or message us on Facebook:
${settings.shopFacebook || 'https://www.facebook.com/profile.php?id=100094438778151'}
========================================
`.trim();

    console.log(`📨 Triggering Buyer Digital Delivery for ${order.id} to ${custEmail}...`);
    return await this.sendEmail({
      to: custEmail,
      subject,
      html,
      text,
      fromName: settings.emailSenderName || 'MadeByMitzi Digital Store',
      replyTo: settings.orderNotifyTo || 'madebymitzi26@gmail.com'
    });
  }
};

// Expose globally
if (typeof window !== 'undefined') {
  window.EmailService = EmailService;
}
