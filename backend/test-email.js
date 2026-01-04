/**
 * Test script for the Resend email service
 * 
 * Usage:
 *   node backend/test-email.js
 * 
 * Required environment variables:
 *   RESEND_API_KEY - Your Resend API key (get it from https://resend.com/api-keys)
 *   FROM_EMAIL - The sender email address (must be verified in Resend)
 *   TO_EMAIL - The recipient email address for testing (optional, defaults to FROM_EMAIL)
 */

// const emailService = require('./services/emailService');
// require('dotenv').config();

// async function testResendConfig() {
//   console.log('='.repeat(60));
//   console.log('Testing Resend Email Service Configuration');
//   console.log('='.repeat(60));
//   console.log();

//   // Check for required environment variables
//   console.log('1. Checking environment variables...');
  
//   const resendApiKey = process.env.RESEND_API_KEY;
//   const fromEmail = process.env.FROM_EMAIL;
//   const toEmail = process.env.TO_EMAIL || fromEmail;

//   if (!resendApiKey) {
//     console.error('❌ ERROR: RESEND_API_KEY is not set');
//     console.log('   Please set the RESEND_API_KEY environment variable.');
//     console.log('   Get your API key from: https://resend.com/api-keys');
//     console.log();
//     console.log('   Example:');
//     console.log('   export RESEND_API_KEY=re_123456789');
//     console.log('   node backend/test-email.js');
//     return false;
//   }

//   if (!fromEmail) {
//     console.error('❌ ERROR: FROM_EMAIL is not set');
//     console.log('   Please set the FROM_EMAIL environment variable.');
//     console.log('   This must be a verified email domain in your Resend account.');
//     console.log();
//     console.log('   Example:');
//     console.log('   export FROM_EMAIL=noreply@yourdomain.com');
//     console.log('   node backend/test-email.js');
//     return false;
//   }

//   console.log('✓ RESEND_API_KEY is set');
//   console.log(`✓ FROM_EMAIL is set: ${fromEmail}`);
//   console.log(`✓ TO_EMAIL: ${toEmail}`);
//   console.log();

//   // Check API key format
//   if (!resendApiKey.startsWith('re_')) {
//     console.warn('⚠️  Warning: RESEND_API_KEY does not start with "re_".');
//     console.log('   This might indicate an invalid API key format.');
//     console.log();
//   }

//   // Test sending an email
//   console.log('2. Sending test email...');
//   console.log();

//   try {
//     const testSubject = 'Test Email from Procurement System';
//     const testHtmlBody = `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h1 style="color: #2563eb;">Test Email</h1>
//         <p>This is a test email to verify that the Resend email service is working correctly.</p>
//         <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
//         <p><strong>From:</strong> ${fromEmail}</p>
//         <p><strong>To:</strong> ${toEmail}</p>
//         <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
//         <p style="color: #6b7280; font-size: 14px;">
//           This is an automated test email from your Procurement Management System.
//         </p>
//       </div>
//     `;

//     const result = await emailService.sendEmail({
//       to: toEmail,
//       subject: testSubject,
//       html: testHtmlBody,
//     });

//     console.log('✓ Email sent successfully!');
//     console.log();
//     console.log('Response details:');
//     console.log(`  - ID: ${result.id || 'N/A'}`);
//     console.log(`  - From: ${fromEmail}`);
//     console.log(`  - To: ${toEmail}`);
//     console.log(`  - Subject: ${testSubject}`);
//     console.log();
//     console.log('='.repeat(60));
//     console.log('SUCCESS: Resend email service is configured correctly!');
//     console.log('='.repeat(60));
//     console.log();
//     console.log('You can now use the email service in your production environment.');
//     console.log('Make sure to set the following environment variables in Render.com:');
//     console.log(`  - RESEND_API_KEY: ${resendApiKey.substring(0, 7)}...`);
//     console.log(`  - FROM_EMAIL: ${fromEmail}`);
//     console.log();

//     return true;

//   } catch (error) {
//     console.error('❌ Failed to send email:');
//     console.error(`   ${error.message || error}`);
//     console.log();
//     console.log('Troubleshooting steps:');
//     console.log('1. Verify your Resend API key is valid and active');
//     console.log('2. Check that your FROM_EMAIL domain is verified in Resend');
//     console.log('3. Ensure you have enough email credits in your Resend account');
//     console.log('4. Check for any rate limiting restrictions');
//     console.log();
//     console.log('Resend dashboard: https://resend.com/home');
//     console.log('API documentation: https://resend.com/docs');
//     console.log();

//     return false;
//   }
// }

// // Run the test
// testResendConfig()
//   .then((success) => {
//     process.exit(success ? 0 : 1);
//   })
//   .catch((error) => {
//     console.error('Unexpected error during test:', error);
//     process.exit(1);
//   });


import { Resend } from 'resend';
async function testEmail(){
try {
  const resend = new Resend('re_MS6zd91Q_PCcsUcYU7yTxyRK9VBN3MnAF');

resend.emails.send({
  from: 'noreply@almahbubinternational.com',
  to: 'almujahidalimam@gmail.com',
  subject: 'Hello World',
  html: '<p>Congratulations on sending your <strong>first email</strong>!</p>'
});

console.log("email sent")
} catch (error) {
  console.log(error)
}
}


testEmail()