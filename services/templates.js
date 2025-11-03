function adminSubject(company) {
  return `New Wholesale Application: ${company}`;
}

function adminHtml(payload) {
  const {
    companyName, contactName, phone, abn, email,
    street, city, state, postCode, country,
    message, marketingOptIn, termsAccepted,
  } = payload;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;">
    <h2>New Wholesale Application</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><b>Company</b></td><td>${companyName}</td></tr>
      <tr><td><b>Contact</b></td><td>${contactName}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone || '-'}</td></tr>
      <tr><td><b>ABN</b></td><td>${abn || '-'}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Address</b></td><td>${street}, ${city}, ${state} ${postCode}, ${country}</td></tr>
      <tr><td><b>Message</b></td><td>${message || '-'}</td></tr>
      <tr><td><b>Marketing opt-in</b></td><td>${marketingOptIn ? 'Yes' : 'No'}</td></tr>
      <tr><td><b>Terms accepted</b></td><td>${termsAccepted ? 'Yes' : 'No'}</td></tr>
      <tr><td><b>Received</b></td><td>${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' })}</td></tr>
    </table>
  </div>`;
}

function customerSubject() {
  return `We’ve received your wholesale application`;
}

function customerHtml({ companyName }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6;">
    <h2>Thanks for applying!</h2>
    <p>Hi${companyName ? ` ${companyName}` : ''},</p>
    <p>We’ve received your wholesale application and our team is reviewing it now.</p>
    <p>We typically reply within 1–2 business days. If we need more info, we’ll reach out.</p>
    <p>Warmly,<br/>Sugarlean Team</p>
  </div>`;
}

module.exports = { adminSubject, adminHtml, customerSubject, customerHtml };
