import { Resend } from "resend";
import nodemailer from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function buildDoctorTrackingUrl(doctorId: string): string {
  return `${getAppBaseUrl()}/register/track-status?id=${encodeURIComponent(doctorId)}`;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.EMAIL_FROM || process.env.RESEND_FROM || "onboarding@resend.dev";

  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const result = await resend.emails.send({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        console.error("Resend email error:", result.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Resend dispatch failed:", error);
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return true;
    } catch (error) {
      console.error("SMTP dispatch failed:", error);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[DEV] Email dispatch (no provider configured):");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(options.text);
    return true;
  }

  return false;
}

export async function sendDoctorVerificationQueuedEmail(
  to: string,
  doctorId: string
): Promise<boolean> {
  const trackingUrl = buildDoctorTrackingUrl(doctorId);
  const bodyText =
    "Dear Doctor, Your phone verification is successful! Your professional profile has been submitted to the registry queue for processing. You can track your live verification status at any time by clicking the secure link below.";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 560px;">
      <p>Dear Doctor,</p>
      <p>Your phone verification is successful! Your professional profile has been submitted to the registry queue for processing. You can track your live verification status at any time by clicking the secure link below.</p>
      <p style="margin: 28px 0;">
        <a href="${trackingUrl}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Track Verification Status
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Or copy this link: ${trackingUrl}</p>
    </div>
  `.trim();

  return sendEmail({
    to,
    subject: "CareConnect — Your Doctor Profile Verification Is Queued",
    html,
    text: `${bodyText}\n\nTrack your status: ${trackingUrl}`,
  });
}
