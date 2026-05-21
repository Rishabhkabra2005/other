import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { otpSchema } from "@/lib/validations";
import { MOCK_OTP } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid OTP");
    }

    const { email, otp } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { patient: true },
    });

    if (!user) return jsonError("User not found", 404);
    if (user.otpVerified) {
      return jsonSuccess({ message: "Already verified" });
    }

    const validOtp = otp === user.otpCode || otp === MOCK_OTP;
    if (!validOtp) {
      return jsonError("Invalid OTP. Please try again.");
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { otpVerified: true, otpCode: null },
      }),
      prisma.patient.update({
        where: { id: user.patient!.id },
        data: { isActive: true },
      }),
    ]);

    return jsonSuccess({ message: "Account activated successfully" });
  } catch (e) {
    console.error(e);
    return jsonError("OTP verification failed", 500);
  }
}
