import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { sendOtpSchema } from "@/lib/validations";
import { generateOtp, getTwilioClient, normalizePhone } from "@/lib/twilio";

const OTP_EXPIRY_MINUTES = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid phone number");
    }

    const phone = normalizePhone(parsed.data.phone);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpVerification.deleteMany({ where: { phone } });

    await prisma.otpVerification.create({
      data: { phone, otp, expiresAt },
    });

    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const client = getTwilioClient();

    if (!client || !twilioPhone) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
        return jsonSuccess({
          message: "OTP generated (Twilio not configured — check server logs in development)",
          expiresInMinutes: OTP_EXPIRY_MINUTES,
        });
      }
      return jsonError("SMS service is not configured", 503);
    }

    await client.messages.create({
      body: `Your CareConnect Health verification code is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      from: twilioPhone,
      to: phone,
    });

    return jsonSuccess({
      message: "OTP sent successfully",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (e) {
    console.error("send-otp error:", e);
    return jsonError("Failed to send OTP. Please try again.", 500);
  }
}
