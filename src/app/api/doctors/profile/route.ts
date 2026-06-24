import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { getEffectiveVerificationStatus } from "@/lib/doctor-verification";

export async function GET() {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
    include: {
      clinics: true,
      user: { select: { email: true, phone: true } },
    },
  });
  if (!doctor) return jsonError("Doctor not found", 404);

  return jsonSuccess({
    ...doctor,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    effectiveVerificationStatus: getEffectiveVerificationStatus(doctor as any),
  });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const body = await request.json();
  const doctor = await prisma.doctor.update({
    where: { userId: session!.user.id },
    data: {
      consultationFee: body.consultationFee,
      bio: body.bio,
      languages: body.languages,
    },
  });
  return jsonSuccess(doctor);
}
