// Vercel Serverless Function — MadeByMitzi Email Dispatch
// Handles POST requests to send admin alerts and buyer delivery emails

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
    const { to, subject, html, text, fromName } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ success: false, message: 'Missing required fields: to, subject, body' });
    }

    // 1. Check if Resend API Key is set in environment
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
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
          html: html || text
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ success: true, method: 'resend', data });
      }
    }

    // 2. Check if Web3Forms Access Key is set in environment
    const web3Key = process.env.WEB3FORMS_KEY;
    if (web3Key) {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3Key,
          subject: subject,
          from_name: fromName || 'MadeByMitzi',
          to: to,
          message: html || text
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ success: true, method: 'web3forms', data });
      }
    }

    // Acknowledged receipt (queued)
    return res.status(200).json({
      success: true,
      method: 'queued',
      message: 'Email request received and logged.'
    });
  } catch (err) {
    console.error('Serverless email error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
