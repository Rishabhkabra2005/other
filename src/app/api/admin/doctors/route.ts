import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { email: true, phone: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });
  return jsonSuccess(doctors);
}

export async function PATCH(request: Request) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { doctorId, verified } = await request.json();
  if (!doctorId) return jsonError("Doctor ID required");

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: { verified: Boolean(verified) },
  });
  return jsonSuccess(doctor);
}
