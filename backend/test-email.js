/**
 * Email Service Test Script
 * Run this to test if your email configuration is working
 *
 * Usage: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('='.repeat(60));
console.log('Email Service Test');
console.log('='.repeat(60));

// Check environment variables
console.log('\n1. Checking Environment Variables...');
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const clientUrl = process.env.CLIENT_URL;

console.log(`   GMAIL_USER: ${gmailUser ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   GMAIL_PASS: ${gmailPass ? '✓ Set' : '✗ NOT SET'}`);
console.log(`   CLIENT_URL: ${clientUrl || '✗ NOT SET'}`);

if (!gmailUser || !gmailPass) {
  console.log('\n❌ ERROR: GMAIL_USER and GMAIL_PASS must be set in .env file');
  console.log('\nCreate a .env file with:');
  console.log('   GMAIL_USER=your-email@gmail.com');
  console.log('   GMAIL_PASS=your-app-password');
  process.exit(1);
}

// Create transporter
console.log('\n2. Creating Email Transporter...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});
console.log('   ✓ Transporter created');

// Verify connection
console.log('\n3. Verifying Email Server Connection...');
transporter.verify()
  .then(() => {
    console.log('   ✓ Server connection verified successfully!');
    console.log('\n4. Sending Test Email...');
    
    const testEmail = {
      from: {
        name: 'Almahbub International',
        address: gmailUser
      },
      to: gmailUser, // Send to yourself for testing
      subject: 'Test Email from Almahbub Procurement Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Email Test Successful!</h1>
          </div>
          <div style="padding: 40px; background: #f5f7f8;">
            <h2 style="color: #205562;">Hi,</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Your email configuration is working correctly!
            </p>
            <p style="font-size: 14px; color: #666;">
              This is a test email sent from the Almahbub Procurement Platform backend.
            </p>
            <p style="font-size: 14px; color: #666;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        </div>
      `
    };
    
    return transporter.sendMail(testEmail);
  })
  .then((result) => {
    console.log('   ✓ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}`);
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nCheck your email inbox for the test message.');
    console.log('If you dont receive it, check your spam folder.');
    process.exit(0);
  })
  .catch((error) => {
    console.log('   ✗ Connection failed!');
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.log('\nError Details:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log('\nCommon Solutions:');
    console.log('1. Make sure you enabled 2-Step Verification on your Google Account');
    console.log('2. Generate an App Password and use it instead of your regular password');
    console.log('3. Visit: https://myaccount.google.com/apppasswords');
    console.log('\nFor Gmail:');
    console.log('   - Go to Google Account → Security → 2-Step Verification → ON');
    console.log('   - Then go to App passwords and generate one');
    console.log('   - Use the 16-character app password in GMAIL_PASS');
    process.exit(1);
  });
