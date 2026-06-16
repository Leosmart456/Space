import mongoose from 'mongoose';
import { Resend } from 'resend';

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumirra';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    isAdmin: Boolean,
  });
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const users = await User.find({ isAdmin: false }).select('email firstName');
  console.log(`Found ${users.length} users to email`);

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const firstName = (user as any).firstName || 'Valued User';
    const email = (user as any).email;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1E3A8A 0%, #1565C0 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 15px; }
          .content { padding: 40px 30px; }
          .highlight-box { background: #f0f7ff; border: 2px solid #1E8FF2; border-radius: 8px; padding: 24px 30px; text-align: center; margin: 30px 0; }
          .phone { font-size: 28px; font-weight: bold; color: #1565C0; letter-spacing: 1px; }
          .label { font-size: 13px; color: #888; margin-top: 8px; }
          .info { color: #555; font-size: 15px; margin: 20px 0; }
          .divider { border: none; border-top: 1px solid #e0e0e0; margin: 30px 0; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Lumirra Wallet</h1>
            <p>Important Support Update</p>
          </div>
          <div class="content">
            <p class="info">Dear <strong>${firstName}</strong>,</p>
            <p class="info">We want to let you know that our customer support contact number has been updated. Please save our new support number for any future assistance you may need.</p>

            <div class="highlight-box">
              <div class="phone">+1 (601) 440-0158</div>
              <div class="label">New Lumirra Wallet Support Number</div>
            </div>

            <p class="info">Our support team is available to assist you with any questions or issues regarding your wallet, transactions, or account. Don't hesitate to reach out.</p>

            <hr class="divider" />

            <p class="info" style="font-size: 13px; color: #888;">If you did not expect this email, please disregard it. Your account security has not been affected.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Lumirra Wallet. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: 'Lumirra Wallet <onboarding@resend.dev>',
        to: [email],
        subject: 'Lumirra Wallet - Updated Support Contact Number',
        html,
      });

      if (error) {
        console.error(`FAILED ${email}:`, error);
        failed++;
      } else {
        console.log(`SENT ${email} (id: ${data?.id})`);
        sent++;
      }
    } catch (err: any) {
      console.error(`ERROR ${email}:`, err.message);
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}, Total: ${users.length}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
