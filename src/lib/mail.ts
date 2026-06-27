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

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function logDevEmailFallback(options: SendEmailOptions): void {
  console.log("[DEV] SMTP not configured — email would be sent:");
  console.log(`From: ${process.env.SMTP_USER || "(SMTP_USER not set)"}`);
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(options.text);
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === "development") {
      logDevEmailFallback(options);
      return true;
    }
    console.error("SMTP dispatch skipped: missing SMTP_HOST, SMTP_PORT, SMTP_USER, or SMTP_PASS");
    return false;
  }

  try {
    const transporter = createSmtpTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
  } catch (error) {
    console.error("SMTP dispatch failed:", error);
    return false;
  }
}

export async function sendTrackingEmail(to: string, doctorId: string): Promise<boolean> {
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

/** @deprecated Use sendTrackingEmail */
export const sendDoctorVerificationQueuedEmail = sendTrackingEmail;
