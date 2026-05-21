import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { reviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid review");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });
  if (!patient) return jsonError("Patient not found", 404);

  const review = await prisma.review.upsert({
    where: {
      patientId_doctorId: {
        patientId: patient.id,
        doctorId: parsed.data.doctorId,
      },
    },
    create: {
      patientId: patient.id,
      doctorId: parsed.data.doctorId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  const stats = await prisma.review.aggregate({
    where: { doctorId: parsed.data.doctorId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.doctor.update({
    where: { id: parsed.data.doctorId },
    data: {
      averageRating: stats._avg.rating || 0,
      reviewCount: stats._count,
    },
  });

  return jsonSuccess(review, 201);
}
