import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { doctorProfileUpdateSchema } from "@/lib/validations";
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
    effectiveVerificationStatus: getEffectiveVerificationStatus(doctor),
  });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = doctorProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid profile data");
  }

  const data = parsed.data;

  const doctor = await prisma.doctor.update({
    where: { userId: session!.user.id },
    data: {
      ...(data.consultationFee !== undefined && { consultationFee: data.consultationFee }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.languages !== undefined && { languages: data.languages }),
      ...(data.clinicLocations !== undefined && { clinicLocations: data.clinicLocations }),
      ...(data.availabilityHours !== undefined && { availabilityHours: data.availabilityHours }),
      ...(data.careerAchievements !== undefined && {
        careerAchievements: data.careerAchievements,
      }),
    },
  });

  return jsonSuccess(doctor);
}
