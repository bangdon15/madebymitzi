// Vercel Serverless Function — MadeByMitzi Email Dispatch
// Dispatches automated emails to customers and admin via Gmail SMTP, Resend, or Brevo

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Nodemailer fallback
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { to, subject, html, text, fromName, gmailAppPassword, replyTo } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, body' });
    }

    const rawPass = process.env.GMAIL_APP_PASSWORD || gmailAppPassword || '';
    const gmailPass = rawPass.replace(/\s+/g, '');
    const gmailUser = process.env.GMAIL_USER || 'madebymitzi26@gmail.com';

    // 1. GMAIL SMTP (Nodemailer) — Sends real emails from madebymitzi26@gmail.com directly to customer
    if (gmailPass && nodemailer) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });

        const info = await transporter.sendMail({
          from: `"${fromName || 'MadeByMitzi Digital Store'}" <${gmailUser}>`,
          to: to,
          replyTo: replyTo || gmailUser,
          subject: subject,
          text: text,
          html: html || text
        });

        console.log('✅ Email sent via Gmail SMTP to:', to, 'ID:', info.messageId);
        return res.status(200).json({
          success: true,
          method: 'gmail_smtp',
          message: `Email delivered to ${to} via Gmail SMTP`,
          messageId: info.messageId
        });
      } catch (smtpErr) {
        console.error('Gmail SMTP error:', smtpErr);
        return res.status(400).json({
          success: false,
          method: 'gmail_smtp_error',
          message: `Gmail SMTP Error: ${smtpErr.message}. Please verify that you generated a 16-letter App Password on your Google Account (myaccount.google.com/apppasswords) and that 2-Step Verification is turned on.`
        });
      }
    }

    // 2. Brevo API (Sendinblue) — Free 300 emails/day to ANY recipient
    const brevoKey = (process.env.BREVO_API_KEY || req.body?.brevoApiKey || '').trim();
    const brevoSender = process.env.BREVO_SENDER_EMAIL || req.body?.brevoSenderEmail || 'madebymitzi26@gmail.com';
    if (brevoKey) {
      try {
        let response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: fromName || 'MadeByMitzi Digital Store',
              email: brevoSender
            },
            to: [{ email: to, name: to.split('@')[0] }],
            replyTo: { email: replyTo || brevoSender, name: 'MadeByMitzi' },
            subject: subject,
            htmlContent: html || text,
            textContent: text
          })
        });

        let data = await response.json();

        // If sender error (e.g. registered with brepublic15@gmail.com instead of madebymitzi26@gmail.com), try alternative verified sender
        if (!response.ok && data && (JSON.stringify(data).toLowerCase().includes('sender') || data.code === 'invalid_parameter')) {
          const altSender = (brevoSender === 'madebymitzi26@gmail.com') ? 'brepublic15@gmail.com' : 'madebymitzi26@gmail.com';
          console.log(`Brevo rejected sender ${brevoSender}, retrying with alternative sender: ${altSender}...`);
          const retryRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: {
                name: fromName || 'MadeByMitzi Digital Store',
                email: altSender
              },
              to: [{ email: to, name: to.split('@')[0] }],
              replyTo: { email: replyTo || altSender, name: 'MadeByMitzi' },
              subject: subject,
              htmlContent: html || text,
              textContent: text
            })
          });
          const retryData = await retryRes.json();
          if (retryRes.ok && retryData.messageId) {
            console.log('✅ Email sent via Brevo (using alternative sender:', altSender, ') to:', to);
            return res.status(200).json({
              success: true,
              method: 'brevo',
              message: `Email delivered to ${to} via Brevo (from ${altSender})`,
              messageId: retryData.messageId
            });
          } else {
            data = retryData;
          }
        }

        if (response.ok && data.messageId) {
          console.log('✅ Email sent via Brevo to:', to, 'ID:', data.messageId);
          return res.status(200).json({
            success: true,
            method: 'brevo',
            message: `Email delivered to ${to} via Brevo`,
            messageId: data.messageId
          });
        } else {
          console.warn('Brevo response error:', data);
          return res.status(200).json({
            success: false,
            method: 'brevo_error',
            message: `Brevo API Error: ${data.message || JSON.stringify(data)}. (Make sure your Brevo account email is verified and sender email matches your Brevo account).`
          });
        }
      } catch (brevoErr) {
        console.warn('Brevo fetch error:', brevoErr.message);
        return res.status(200).json({
          success: false,
          method: 'brevo_error',
          message: `Brevo network error: ${brevoErr.message}`
        });
      }
    }

    // 3. Resend API Key
    const resendKey = process.env.RESEND_API_KEY || req.body?.resendKey;
    if (resendKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromName ? `${fromName} <orders@madebymitzi.com>` : 'MadeByMitzi <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html || text,
            text: text
          })
        });

        const data = await response.json();
        if (response.ok && data.id) {
          return res.status(200).json({ success: true, method: 'resend', data });
        } else {
          console.warn('Resend response error:', data);
        }
      } catch (resendErr) {
        console.warn('Resend error:', resendErr.message);
      }
    }

    // 3. Web3Forms (Only for admin notifications, since Web3Forms free tier only delivers to key owner)
    const web3Key = process.env.WEB3FORMS_KEY || req.body?.web3Key || '3a8a2077-18e1-4a7c-a3aa-8a3b08b341e7';
    const isAdminNotification = to.toLowerCase().includes('madebymitzi') || to.toLowerCase().includes('admin');
    
    if (web3Key && isAdminNotification) {
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: web3Key,
            subject: subject,
            from_name: fromName || 'MadeByMitzi Orders',
            name: fromName || 'MadeByMitzi Orders',
            email: to,
            to: to,
            message: text || html
          })
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({ success: true, method: 'web3forms', data });
        }
      } catch (wErr) {
        console.warn('Web3Forms error:', wErr.message);
      }
    }

    // Fallback if no outbound customer provider is configured
    return res.status(200).json({
      success: false,
      method: 'no_outbound_provider',
      message: 'No outbound customer email provider is configured. Please enter your free 16-character Google App Password in Admin Settings to enable automated customer emails.'
    });
  } catch (err) {
    console.error('Serverless email error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
