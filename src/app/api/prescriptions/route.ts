import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { prescriptionSchema } from "@/lib/validations";

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

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointmentId,
      doctorId: doctor.id,
    },
  });
  if (!appointment) return jsonError("Appointment not found", 404);

  const prescription = await prisma.$transaction(async (tx) => {
    const rx = await tx.prescription.create({
      data: {
        appointmentId: parsed.data.appointmentId,
        patientId: parsed.data.patientId,
        doctorId: doctor.id,
        diagnosis: parsed.data.diagnosis,
        medications: parsed.data.medications,
        instructions: parsed.data.instructions,
      },
    });
    await tx.appointment.update({
      where: { id: parsed.data.appointmentId },
      data: { status: "COMPLETED" },
    });
    return rx;
  });

  return jsonSuccess(prescription, 201);
}

export async function GET(request: Request) {
  const { error, session } = await requireAuth(["DOCTOR", "PATIENT"]);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (session!.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session!.user.id },
    });
    const list = await prisma.prescription.findMany({
      where: { patientId: patient!.id },
      include: { doctor: true, appointment: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonSuccess(list);
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session!.user.id },
  });
  const list = await prisma.prescription.findMany({
    where: {
      doctorId: doctor!.id,
      ...(patientId ? { patientId } : {}),
    },
    include: { patient: true, appointment: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonSuccess(list);
}
