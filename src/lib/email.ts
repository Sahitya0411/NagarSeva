import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In development (no custom domain verified), use Resend's free sandbox address.
// In production, set RESEND_FROM_EMAIL=noreply@yourdomain.com in .env.local
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "NagarSeva";

interface SendComplaintEmailParams {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  complaintNumber: string;
  citizenEmail?: string;
}

export async function sendComplaintEmail(params: SendComplaintEmailParams) {
  const { to, subject, body, fromName = "NagarSeva", complaintNumber, citizenEmail } = params;

  const htmlBody = body.replace(/\n/g, "<br />");

  const result = await resend.emails.send({
    from: `${fromName} <${FROM_EMAIL}>`,
    to: [to],
    replyTo: citizenEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #0a1628; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffba08; margin: 0; font-size: 24px;">🏙️ NagarSeva</h1>
          <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Smart City Complaint Portal</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0;">
          <div style="background: #f8fafc; border-left: 4px solid #ffba08; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">Complaint Reference</p>
            <p style="margin: 4px 0 0; color: #0a1628; font-weight: 700; font-size: 16px;">${complaintNumber}</p>
          </div>
          
          <div style="color: #1e293b; font-size: 15px; line-height: 1.7;">
            ${htmlBody}
          </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            This email was sent by NagarSeva on behalf of a concerned citizen.<br/>
            Track complaint at: <a href="https://nagarseva.in/complaint/${complaintNumber}" style="color: #f7941d;">nagarseva.in</a>
          </p>
        </div>
      </div>
    `,
  });

  return result;
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const { to, subject, message, ctaText, ctaUrl } = params;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: #0a1628; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffba08; margin: 0;">🏙️ NagarSeva</h1>
        </div>
        <div style="background: #fff; padding: 28px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
          <p style="color: #1e293b; font-size: 16px; line-height: 1.7;">${message}</p>
          ${
            ctaText && ctaUrl
              ? `<div style="text-align: center; margin-top: 24px;">
                  <a href="${ctaUrl}" style="background: #f7941d; color: #050d1a; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
                    ${ctaText}
                  </a>
                </div>`
              : ""
          }
          <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; text-align: center;">
            आपकी आवाज़, आपका शहर — Your Voice, Your City
          </p>
        </div>
      </div>
    `,
  });
}
