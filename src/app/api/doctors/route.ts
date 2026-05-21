import { prisma } from "@/lib/prisma";
import { jsonSuccess } from "@/lib/api-auth";
import { ConsultationMode, Prisma, Specialization } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get("specialization") as Specialization | null;
  const mode = searchParams.get("mode") as ConsultationMode | null;
  const minFee = searchParams.get("minFee");
  const maxFee = searchParams.get("maxFee");
  const search = searchParams.get("search");

  const where: Prisma.DoctorWhereInput = {
    verified: true,
  };

  if (specialization) where.specialization = specialization;
  if (mode) where.modes = { has: mode };
  if (minFee || maxFee) {
    where.consultationFee = {};
    if (minFee) where.consultationFee.gte = parseInt(minFee, 10);
    if (maxFee) where.consultationFee.lte = parseInt(maxFee, 10);
  }
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { qualification: { contains: search, mode: "insensitive" } },
    ];
  }

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      reviews: { select: { rating: true } },
      clinics: { select: { id: true, name: true, city: true } },
    },
    orderBy: { averageRating: "desc" },
  });

  return jsonSuccess(doctors);
}
