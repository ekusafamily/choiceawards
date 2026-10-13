const PAYHERO_API_URL = (process.env.PAYHERO_API_URL || 'https://backend.payhero.co.ke/api/v2').replace(/\/$/, '');

/**
 * Returns HTTP Basic Auth token for PayHero
 */
function getAuthHeader() {
  // If user provided a raw Basic Auth header in env
  if (process.env.PAYHERO_BASIC_AUTH_TOKEN) {
    const raw = process.env.PAYHERO_BASIC_AUTH_TOKEN.trim();
    return raw.startsWith('Basic ') ? raw : `Basic ${raw}`;
  }

  const username = process.env.PAYHERO_API_USERNAME?.trim();
  const password = process.env.PAYHERO_API_PASSWORD?.trim();

  if (!username || !password) {
    throw new Error('PayHero credentials not configured. Please set PAYHERO_API_USERNAME and PAYHERO_API_PASSWORD (or PAYHERO_BASIC_AUTH_TOKEN).');
  }

  const creds = `${username}:${password}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

/**
 * Normalize Kenyan phone number for PayHero (expects 07XXXXXXXX, 01XXXXXXXX, or 254XXXXXXXXX)
 */
function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = rawPhone.toString().replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Initiate an M-Pesa STK Push payment via PayHero API
 * @param {Object} params
 * @param {number} params.amount - Payment amount in KES (minimum 10)
 * @param {string} params.phone - Customer phone number
 * @param {string} [params.reference] - External reference identifier
 * @param {string} [params.customerName] - Customer / Nominee label
 * @param {string} [params.callbackUrl] - Webhook callback endpoint
 * @param {number|string} [params.channelId] - PayHero Payment Channel ID
 */
async function initiatePayment({
  amount,
  phone,
  reference,
  customerName = 'DeKUTSO Comrade Choice Awards',
  callbackUrl,
  channelId,
}) {
  const authHeader = getAuthHeader();
  const effectiveChannelId = channelId || process.env.PAYHERO_CHANNEL_ID;

  if (!effectiveChannelId) {
    throw new Error('PAYHERO_CHANNEL_ID is not configured. Please provide your registered Payment Channel ID.');
  }

  const numericAmount = Math.round(Number(amount));
  if (isNaN(numericAmount) || numericAmount < 1) {
    throw new Error(`Invalid payment amount: "${amount}". Must be at least 1 KES.`);
  }

  const formattedPhone = normalizePhone(phone);
  const externalRef = reference || `CCA-${Date.now()}`;
  const effectiveCallback = callbackUrl || process.env.PAYHERO_CALLBACK_URL || 'https://dekutsochoiceawards.site/api/votes/webhook';

  const payload = {
    amount: numericAmount,
    phone_number: formattedPhone,
    channel_id: Number(effectiveChannelId),
    provider: 'm-pesa',
    external_reference: externalRef,
    customer_name: customerName ? customerName.slice(0, 30) : 'Voter',
    callback_url: effectiveCallback,
  };

  const endpoint = `${PAYHERO_API_URL}/payments`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`PayHero returned non-JSON response (HTTP ${response.status}): ${responseText}`);
  }

  if (!response.ok || result?.success === false) {
    const errorMsg = result?.message || result?.error || responseText;
    throw new Error(`PayHero STK Push failed: ${errorMsg}`);
  }

  return {
    success: true,
    reference: result.reference || externalRef,
    externalReference: externalRef,
    checkoutRequestId: result.CheckoutRequestID || result.checkout_request_id,
    amount: numericAmount,
    phone: formattedPhone,
    status: result.status || 'QUEUED',
    data: result,
  };
}

/**
 * Check payment status by reference from PayHero
 * @param {string} reference - The reference returned from initiatePayment or external reference
 */
async function checkPaymentStatus(reference) {
  const authHeader = getAuthHeader();
  const endpoint = `${PAYHERO_API_URL}/transaction-status?reference=${encodeURIComponent(reference)}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json',
    },
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`PayHero returned non-JSON response (HTTP ${response.status}): ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(result?.message || `Failed to check status (HTTP ${response.status})`);
  }

  const rawStatus = (result.status || '').toUpperCase();
  const isComplete = rawStatus === 'SUCCESS';
  const isFailed = rawStatus === 'FAILED' || rawStatus === 'CANCELLED';

  return {
    success: Boolean(result.success ?? isComplete),
    status: isComplete ? 'completed' : isFailed ? 'failed' : 'processing',
    rawStatus: result.status,
    isComplete,
    refNo: result.third_party_reference || result.provider_reference || result.reference,
    amount: result.amount,
    data: result,
  };
}

module.exports = {
  initiatePayment,
  checkPaymentStatus,
  normalizePhone,
  getAuthHeader,
};
