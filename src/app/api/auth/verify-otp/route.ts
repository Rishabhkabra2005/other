import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { verifyOtpSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const { email, phone, otp } = parsed.data;
    const normalizedPhone = normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { patient: true },
    });

    if (!user) return jsonError("User not found", 404);
    if (user.otpVerified) {
      return jsonSuccess({ message: "Already verified" });
    }

    const userPhone = user.phone ? normalizePhone(user.phone) : null;
    if (userPhone && userPhone !== normalizedPhone) {
      return jsonError("Phone number does not match registration", 400);
    }

    const record = await prisma.otpVerification.findFirst({
      where: {
        phone: normalizedPhone,
        otp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return jsonError("Invalid or expired OTP. Please request a new code.");
    }

    await prisma.$transaction([
      prisma.otpVerification.delete({ where: { id: record.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { otpVerified: true, otpCode: null, phone: normalizedPhone },
      }),
      prisma.patient.update({
        where: { id: user.patient!.id },
        data: { isActive: true },
      }),
    ]);

    return jsonSuccess({ message: "Account activated successfully" });
  } catch (e) {
    console.error("verify-otp error:", e);
    return jsonError("OTP verification failed", 500);
  }
}
