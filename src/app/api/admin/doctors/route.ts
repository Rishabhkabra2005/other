import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { syncLegacyDoctorRecords } from "@/lib/legacy-doctor-sync";

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  await syncLegacyDoctorRecords();

  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { email: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return jsonSuccess(doctors);
}

export async function PATCH(request: Request) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const body = (await request.json()) as { doctorId?: string; verified?: boolean };
  const { doctorId, verified } = body;

  if (!doctorId) return jsonError("Doctor ID required");

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      verified: Boolean(verified),
      verificationStatus: verified ? "APPROVED" : "PENDING",
    } as Prisma.DoctorUpdateInput,
  });

  return jsonSuccess(doctor);
}
