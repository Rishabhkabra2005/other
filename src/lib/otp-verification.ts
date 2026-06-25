import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/twilio";

export async function verifyOtpForPhone(phone: string, otp: string): Promise<boolean> {
  const normalizedPhone = normalizePhone(phone);

  const record = await prisma.otpVerification.findFirst({
    where: {
      phone: normalizedPhone,
      otp: otp.trim(),
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return false;

  await prisma.otpVerification.delete({ where: { id: record.id } });
  return true;
}
