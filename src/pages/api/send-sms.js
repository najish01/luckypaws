// pages/api/send-sms.js
import twilio from 'twilio';

export default async function handler(req, res) {
  // Enable CORS
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const { appointmentDetails } = req.body;
    console.log('Received appointment details:', appointmentDetails);

    const messageBody = `
New Appointment Request
-----------------
Owner: ${appointmentDetails.ownerName}
Pet: ${appointmentDetails.petName} (${appointmentDetails.petType})
Date: ${appointmentDetails.date}
Time: ${appointmentDetails.time}
Service: ${appointmentDetails.service}
Phone: ${appointmentDetails.phone}
Email: ${appointmentDetails.email}
Notes: ${appointmentDetails.message || 'None'}
    `.trim();

    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.CLINIC_PHONE_NUMBER
    });

    console.log('SMS sent successfully:', message.sid);
    res.status(200).json({ success: true, messageSid: message.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
