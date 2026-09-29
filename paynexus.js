const path = require('path');
const fs = require('fs');

// Load environment variables from server/.env if available
const envPath = path.resolve(__dirname, 'server/.env');
if (fs.existsSync(envPath)) {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch (e) {}
  }
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  } catch (err) {}
}

const PAYNEXUS_API_URL = (process.env.PAYNEXUS_API_URL || 'https://paynexus.co.ke/api').replace(/\/$/, '');
const PAYNEXUS_SECRET_KEY = process.env.PAYNEXUS_SECRET_KEY;
const PAYNEXUS_PUBLIC_KEY = process.env.PAYNEXUS_PUBLIC_KEY;

/**
 * Initiate an M-Pesa STK Push payment via PayNexus API
 * @param {Object} params
 * @param {number} params.amount - Payment amount in KES (minimum 1)
 * @param {string} params.phone - Customer phone number (auto-normalized e.g. 07XXXXXXXX -> 2547XXXXXXXX)
 * @param {string} [params.description] - Payment description shown to customer
 */
async function initiatePayment({ amount, phone, description = 'Comrade Choice Awards' }) {
  const secretKey = PAYNEXUS_SECRET_KEY;
  if (!secretKey) {
    throw new Error('PAYNEXUS_SECRET_KEY is not configured in server/.env');
  }

  const numericAmount = Math.round(Number(amount));
  if (isNaN(numericAmount) || numericAmount < 1) {
    throw new Error(`Invalid amount: "${amount}". Amount must be at least 1 KES.`);
  }

  const endpoint = `${PAYNEXUS_API_URL}/mpesa/payment/initiate`;

  console.log(`\nInitiating PayNexus M-Pesa STK Push:`);
  console.log(`- Recipient: ${phone}`);
  console.log(`- Amount: KES ${numericAmount}`);
  console.log(`- Description: ${description}`);
  console.log(`- Endpoint: ${endpoint}`);

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
    throw new Error(`PayNexus STK Push failed (HTTP ${response.status}): ${errorMsg}`);
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
  const apiKey = PAYNEXUS_PUBLIC_KEY || PAYNEXUS_SECRET_KEY;
  if (!apiKey) {
    throw new Error('PAYNEXUS_PUBLIC_KEY or PAYNEXUS_SECRET_KEY is not configured in server/.env');
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
    data: result.data,
  };
}

/**
 * Check payment status by checkout_request_id
 * @param {string} checkoutRequestId - ws_CO_...
 */
async function checkStatusByCheckoutId(checkoutRequestId) {
  const apiKey = PAYNEXUS_PUBLIC_KEY || PAYNEXUS_SECRET_KEY;
  if (!apiKey) {
    throw new Error('PAYNEXUS_PUBLIC_KEY or PAYNEXUS_SECRET_KEY is not configured in server/.env');
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
    data: result.data,
  };
}

/**
 * Validate and normalize a phone number
 * @param {string} phone
 */
async function validatePhone(phone) {
  const apiKey = PAYNEXUS_PUBLIC_KEY || PAYNEXUS_SECRET_KEY;
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

// CLI execution tester: node paynexus.js <phone> [amount] [description]
if (require.main === module) {
  const args = process.argv.slice(2);
  const phone = args[0];
  const amount = args[1] || 1;
  const description = args[2] || 'CCA Vote Test';

  if (!phone) {
    console.log(`
=====================================================
  Comrade Choice Awards - PayNexus M-Pesa STK Tester
=====================================================

Usage:
  node paynexus.js <phone_number> [amount] [description]

Examples:
  node paynexus.js 0746990866 1
  node paynexus.js 254702322277 5 "CCA Vote"
    `);
    process.exit(0);
  }

  (async () => {
    try {
      console.log('Sending test STK Push via PayNexus...');
      const initResult = await initiatePayment({ phone, amount, description });
      console.log('\n✅ STK Push successfully dispatched to phone!');
      console.log('Response Details:', initResult);
      console.log(`\n👉 Check phone ${phone} for M-Pesa popup and enter your PIN.`);

      const reference = initResult.reference;
      const checkoutId = initResult.checkoutRequestId;

      console.log(`\nPolling status for reference: ${reference} (checking every 3s)...`);

      let attempts = 0;
      const maxAttempts = 20; // 60 seconds total

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;

        try {
          // Check by reference or checkoutId
          const statusResult = reference
            ? await checkPaymentStatus(reference)
            : await checkStatusByCheckoutId(checkoutId);

          const currentStatus = statusResult.status || 'unknown';
          process.stdout.write(`\rAttempt ${attempts}/${maxAttempts}: status = [${currentStatus.toUpperCase()}] `);

          if (currentStatus === 'completed') {
            console.log('\n\n🎉 Payment Confirmed as Completed!');
            console.log('Payment Data:', statusResult.data);
            return;
          } else if (['failed', 'cancelled', 'expired'].includes(currentStatus)) {
            console.log(`\n\n❌ Payment ended with status: ${currentStatus.toUpperCase()}`);
            console.log(statusResult.data);
            return;
          }
        } catch (pollErr) {
          // Ignore transient poll network errors
        }
      }

      console.log('\n\n⏱️ Polling timed out (transaction may still be processing or customer took too long).');
    } catch (err) {
      console.error('\n❌ PayNexus STK Push failed:', err.message);
      process.exit(1);
    }
  })();
}
