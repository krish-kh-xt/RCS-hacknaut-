// SMS sending. Owner: B (included here so Part 2 runs on its own; B may replace it,
// as long as it still exports sendSms(to, text)).
//
// SMS_MODE=mock (default) -> only console.log the message.
// SMS_MODE=live           -> call the gateway (Fast2SMS shown below; swap for MSG91/Twilio if needed).

async function sendSms(to, text) {
  if ((process.env.SMS_MODE || 'mock') !== 'live') {
    console.log(`[SMS mock] to=${to}\n           ${text}`);
    return { ok: true, mock: true };
  }

  if (!process.env.SMS_API_KEY) {
    throw new Error('SMS_MODE=live but SMS_API_KEY is empty');
  }

  // Fast2SMS wants a 10 digit Indian number without +91.
  const number = String(to).replace(/\D/g, '').slice(-10);

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: process.env.SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ route: 'q', message: text, numbers: number }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.return === false) {
    throw new Error(`SMS gateway error: ${res.status} ${JSON.stringify(body)}`);
  }
  return { ok: true };
}

module.exports = { sendSms };
