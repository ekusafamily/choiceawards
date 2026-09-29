const PAYNEXUS_API_URL = (process.env.PAYNEXUS_API_URL || 'https://paynexus.co.ke/api').replace(/\/$/, '');

function getSecretKey() {
  return process.env.PAYNEXUS_SECRET_KEY;
}

function getPublicKey() {
  return process.env.PAYNEXUS_PUBLIC_KEY || process.env.PAYNEXUS_SECRET_KEY;
}

/**
 * Initiate an M-Pesa STK Push payment via PayNexus API
 * @param {Object} params
 * @param {number} params.amount - Payment amount in KES (minimum 1)
 * @param {string} params.phone - Customer phone number (auto-normalized e.g. 07XXXXXXXX -> 2547XXXXXXXX)
 * @param {string} [params.description] - Payment description shown to customer
 */
async function initiatePayment({ amount, phone, description = 'Comrade Choice Awards' }) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    throw new Error('PAYNEXUS_SECRET_KEY is not configured in server environment');
  }

  const numericAmount = Math.round(Number(amount));
  if (isNaN(numericAmount) || numericAmount < 1) {
    throw new Error(`Invalid amount: "${amount}". Amount must be at least 1 KES.`);
  }

  const endpoint = `${PAYNEXUS_API_URL}/mpesa/payment/initiate`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': secretKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      amount: numericAmount,
      phone: phone.toString().trim(),
      description: description.trim(),
    }),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (err) {
    throw new Error(`PayNexus returned non-JSON response (HTTP ${response.status}): ${responseText}`);
  }

  if (!response.ok || !result.success) {
    const errorMsg = result?.message || result?.error || responseText;
    throw new Error(`PayNexus STK Push failed: ${errorMsg}`);
  }

  return {
    success: true,
    reference: result.data?.reference,
    checkoutRequestId: result.data?.checkout_request_id,
    amount: result.data?.amount,
    phone: result.data?.phone,
    status: result.data?.status || 'initiated',
    data: result.data,
  };
}

/**
 * Check payment status by payment reference
 * @param {string} reference - The reference returned from initiatePayment (e.g. PNX...)
 */
async function checkPaymentStatus(reference) {
  const apiKey = getPublicKey();
  if (!apiKey) {
    throw new Error('PAYNEXUS_PUBLIC_KEY or PAYNEXUS_SECRET_KEY is not configured in server environment');
  }

  const endpoint = `${PAYNEXUS_API_URL}/payments/${encodeURIComponent(reference)}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      'Accept': 'application/json',
    },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || `Failed to check status (HTTP ${response.status})`);
  }

  return {
    success: Boolean(result.success),
    status: result.data?.status, // 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired'
    isComplete: result.data?.status === 'completed',
    refNo: result.data?.provider_transaction_id,
    amount: result.data?.amount,
    data: result.data,
  };
}

/**
 * Check payment status by checkout_request_id
 * @param {string} checkoutRequestId - ws_CO_...
 */
async function checkStatusByCheckoutId(checkoutRequestId) {
  const apiKey = getPublicKey();
  if (!apiKey) {
    throw new Error('PAYNEXUS_PUBLIC_KEY or PAYNEXUS_SECRET_KEY is not configured in server environment');
  }

  const endpoint = `${PAYNEXUS_API_URL}/payments/status-by-checkout-id`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      checkout_request_id: checkoutRequestId,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || `Failed to check status (HTTP ${response.status})`);
  }

  return {
    success: Boolean(result.success),
    status: result.data?.status,
    isComplete: result.data?.status === 'completed',
    refNo: result.data?.provider_transaction_id,
    amount: result.data?.amount,
    data: result.data,
  };
}

/**
 * Validate and normalize a phone number
 * @param {string} phone
 */
async function validatePhone(phone) {
  const apiKey = getPublicKey();
  const endpoint = `${PAYNEXUS_API_URL}/mpesa/validate-phone`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });

  const result = await response.json().catch(() => ({}));
  return result;
}

module.exports = {
  initiatePayment,
  checkPaymentStatus,
  checkStatusByCheckoutId,
  validatePhone,
  PAYNEXUS_API_URL,
};
