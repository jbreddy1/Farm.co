const axios = require('axios');

// Fast2SMS API configuration
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Send SMS using Fast2SMS API
 * @param {string} mobileNumber - The mobile number to send SMS to (without country code)
 * @param {string} message - The message content
 * @returns {Promise<Object>} - API response
 */
const sendSMS = async (mobileNumber, message) => {
  try {
    // Validate mobile number (should be 10 digits for Indian numbers)
    if (!mobileNumber || mobileNumber.length !== 10 || !/^\d{10}$/.test(mobileNumber)) {
      throw new Error('Invalid mobile number. Please provide a valid 10-digit mobile number.');
    }

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error('Message cannot be empty.');
    }

    // Validate API key
    if (!FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key is not configured. Please set FAST2SMS_API_KEY in your environment variables.');
    }

    // Try different routes in order of preference
    const routes = ['q', 'v3', 't', 'p'];
    let lastError = null;

    for (const route of routes) {
      try {
        // Prepare request payload according to Fast2SMS API documentation
        const payload = {
          route: route, // Try different routes
          sender_id: 'TXTIND', // Generic sender ID (6 characters max)
          message: message,
          language: 'english',
          flash: 0, // 0 for normal SMS, 1 for flash SMS
          numbers: mobileNumber
        };

        console.log(`Trying route '${route}' with payload:`, {
          ...payload,
          numbers: mobileNumber // Log the number for debugging
        });

        // Make API request
        const response = await axios.post(FAST2SMS_URL, payload, {
          headers: {
            'authorization': FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log(`Fast2SMS API Response (route ${route}):`, response.data);

        // Check if SMS was sent successfully
        if (response.data && response.data.return === true) {
          console.log(`SMS sent successfully to ${mobileNumber} using route '${route}':`, response.data);
          return {
            success: true,
            messageId: response.data.request_id,
            route: route,
            message: 'SMS sent successfully'
          };
        } else {
          // Handle different error scenarios
          const errorMessage = response.data.message || response.data.error || 'Unknown error';
          lastError = new Error(`SMS sending failed (route ${route}): ${errorMessage}`);
          continue; // Try next route
        }

      } catch (error) {
        console.error(`Route '${route}' failed:`, error.message);
        lastError = error;
        continue; // Try next route
      }
    }

    // If all routes failed, throw the last error
    throw lastError || new Error('All SMS routes failed');

  } catch (error) {
    console.error('Error sending SMS:', error.message);
    
    // Handle axios errors specifically
    if (error.response) {
      console.error('Fast2SMS API Error Response:', error.response.data);
      console.error('Status Code:', error.response.status);
      
      // Handle specific error codes
      if (error.response.status === 400) {
        throw new Error(`Invalid request: ${error.response.data.message || 'Check API key and parameters'}`);
      } else if (error.response.status === 401) {
        throw new Error('Unauthorized: Invalid API key');
      } else if (error.response.status === 402) {
        throw new Error('Payment required: Insufficient balance in Fast2SMS account');
      } else if (error.response.status === 403) {
        throw new Error('Forbidden: API key is blocked or invalid');
      } else {
        throw new Error(`API Error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Could not reach Fast2SMS API');
    } else {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
};

/**
 * Send reminder SMS with formatted message
 * @param {string} mobileNumber - The mobile number
 * @param {string} userName - The user's name
 * @param {string} reminderMessage - The reminder message
 * @param {Date} reminderDate - The reminder date
 * @returns {Promise<Object>} - SMS sending result
 */
const sendReminderSMS = async (mobileNumber, userName, reminderMessage, reminderDate) => {
  const formattedDate = new Date(reminderDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Keep message shorter to avoid SMS length issues
  const message = `Hello ${userName}! 🌾\n\nReminder: ${reminderMessage}\nScheduled: ${formattedDate}\n\nFarmer Assistant`;

  return await sendSMS(mobileNumber, message);
};

/**
 * Send crop schedule SMS
 * @param {string} mobileNumber - The mobile number
 * @param {string} userName - The user's name
 * @param {string} cropName - The crop name
 * @param {number} reminderCount - Number of reminders created
 * @returns {Promise<Object>} - SMS sending result
 */
const sendCropScheduleSMS = async (mobileNumber, userName, cropName, reminderCount) => {
  const message = `Hello ${userName}! 🌱\n\nCrop schedule created for ${cropName}.\n${reminderCount} reminders set up.\n\nFarmer Assistant`;

  return await sendSMS(mobileNumber, message);
};

module.exports = {
  sendSMS,
  sendReminderSMS,
  sendCropScheduleSMS
}; 