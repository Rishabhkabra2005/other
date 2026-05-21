import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: params.id },
    include: {
      clinics: true,
      reviews: {
        include: {
          patient: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      availability: {
        where: {
          booked: false,
          isBlocked: false,
          date: { gte: new Date() },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!doctor) return jsonError("Doctor not found", 404);
  return jsonSuccess(doctor);
}
