import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { prescriptionSchema } from "@/lib/validations";

const prescriptionInclude = {
  doctor: {
    select: {
      id: true,
      fullName: true,
      qualification: true,
      specialization: true,
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      mode: true,
      status: true,
    },
  },
} satisfies Prisma.PrescriptionInclude;

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR"]);
  if (error) return error;

  const body = await request.json();
  const parsed = prescriptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid prescription");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  if (!doctor) return jsonError("Doctor not found", 404);

  if (parsed.data.doctorId !== doctor.id) {
    return jsonError("Doctor ID does not match your account", 403);
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      doctorId: doctor.id,
      patientId: parsed.data.patientId,
    },
    include: { prescription: true },
  });
  if (!appointment) return jsonError("Appointment not found", 404);

  if (appointment.prescription) {
    return jsonError("A prescription already exists for this appointment", 409);
  }

  const markCompleted = parsed.data.markCompleted !== false;

  try {
    const prescription = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.create({
        data: {
          appointmentId: parsed.data.appointmentId,
          patientId: parsed.data.patientId,
          doctorId: doctor.id,
          medications: parsed.data.medications as Prisma.InputJsonValue,
          doctorNotes: parsed.data.doctorNotes?.trim() || null,
          dateWritten: new Date(),
        },
        include: prescriptionInclude,
      });

      if (markCompleted) {
        await tx.appointment.update({
          where: { id: parsed.data.appointmentId },
          data: { status: "COMPLETED" },
        });
      }

      return rx;
    });

    return jsonSuccess(prescription, 201);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return jsonError("A prescription already exists for this appointment", 409);
    }
    throw e;
  }
}

export async function GET(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR", "PATIENT"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get("patientId");

  if (session!.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session!.user.id },
    });
    if (!patient) return jsonError("Patient profile not found", 404);

    const list = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: prescriptionInclude,
      orderBy: { dateWritten: "desc" },
    });
    return jsonSuccess(list);
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  if (!doctor) return jsonError("Doctor not found", 404);

  if (!patientIdParam) {
    return jsonError("patientId query parameter is required", 400);
  }

  const list = await prisma.prescription.findMany({
    where: {
      doctorId: doctor.id,
      patientId: patientIdParam,
    },
    include: prescriptionInclude,
    orderBy: { dateWritten: "desc" },
  });

  return jsonSuccess(list);
}
