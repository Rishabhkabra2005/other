import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
    include: {
      familyMembers: true,
      user: { select: { email: true, phone: true } },
    },
  });

  if (!patient) return jsonError("Patient profile not found", 404);
  return jsonSuccess(patient);
}

export async function PATCH(request: Request) {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const body = await request.json();
  const patient = await prisma.patient.update({
    where: { userId: session!.user.id },
    data: {
      fullName: body.fullName,
      age: body.age,
      height: body.height,
      weight: body.weight,
      bloodGroup: body.bloodGroup,
      allergies: body.allergies,
      existingDiseases: body.existingDiseases,
      emergencyContact: body.emergencyContact,
      insuranceInfo: body.insuranceInfo,
    },
  });

  return jsonSuccess(patient);
}
