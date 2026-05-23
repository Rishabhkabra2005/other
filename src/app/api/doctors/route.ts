import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { addDoctorSchema } from "@/lib/validations";
import { ConsultationMode, Prisma, Specialization } from "@prisma/client";

const DEFAULT_DOCTOR_PASSWORD = "Password123!";

function generateDoctorEmail(fullName: string): string {
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const suffix = Date.now().toString(36);
  return `dr.${slug || "doctor"}.${suffix}@careconnect.health`;
}

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

export async function POST(request: Request) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = addDoctorSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const data = parsed.data;
    const email = generateDoctorEmail(data.fullName);
    const passwordHash = await bcrypt.hash(DEFAULT_DOCTOR_PASSWORD, 12);

    const doctor = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "DOCTOR",
        otpVerified: true,
        doctor: {
          create: {
            fullName: data.fullName,
            qualification: data.qualification,
            experienceYears: data.experienceYears,
            specialization: data.specialization,
            consultationFee: data.consultationFee,
            languages: ["English", "Hindi"],
            modes: [
              ConsultationMode.ON_SITE,
              ConsultationMode.PHONE,
              ConsultationMode.VIDEO,
            ],
            verified: false,
            bio: `${data.fullName} — ${data.qualification}`,
          },
        },
      },
      include: { doctor: true },
    });

    return jsonSuccess(
      {
        message: "Doctor created successfully. Approve them in the verification queue.",
        doctor: doctor.doctor,
        loginEmail: email,
        temporaryPassword: DEFAULT_DOCTOR_PASSWORD,
      },
      201
    );
  } catch (e) {
    console.error("create doctor error:", e);
    return jsonError("Failed to create doctor", 500);
  }
}
