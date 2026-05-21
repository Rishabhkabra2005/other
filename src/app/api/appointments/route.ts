import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { appointmentSchema } from "@/lib/validations";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (session!.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session!.user.id },
    });
    if (!patient) return jsonError("Patient not found", 404);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: true,
        clinic: true,
        slot: true,
        familyMember: true,
        prescription: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
    return jsonSuccess(appointments);
  }

  if (session!.user.role === "ADMIN") {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: true,
        clinic: true,
        slot: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    });
    return jsonSuccess(appointments);
  }

  if (session!.user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session!.user.id },
    });
    if (!doctor) return jsonError("Doctor not found", 404);

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: true,
        clinic: true,
        slot: true,
        familyMember: true,
        prescription: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
    return jsonSuccess(appointments);
  }

  return jsonError("Forbidden", 403);
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid booking");
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session!.user.id },
  });
  if (!patient?.isActive) {
    return jsonError("Please activate your profile via OTP first", 403);
  }

  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: parsed.data.slotId },
  });
  if (!slot || slot.booked || slot.isBlocked) {
    return jsonError("Selected slot is no longer available");
  }
  if (slot.mode !== parsed.data.mode) {
    return jsonError("Slot mode mismatch");
  }

  const scheduledAt = new Date(slot.date);
  const [h, m] = slot.startTime.split(":").map(Number);
  scheduledAt.setHours(h, m, 0, 0);

  const appointment = await prisma.$transaction(async (tx) => {
    await tx.availabilitySlot.update({
      where: { id: slot.id },
      data: { booked: true },
    });
    return tx.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: parsed.data.doctorId,
        slotId: slot.id,
        clinicId: parsed.data.clinicId,
        familyMemberId: parsed.data.familyMemberId,
        mode: parsed.data.mode,
        status: "CONFIRMED",
        scheduledAt,
        notes: parsed.data.notes,
      },
      include: { doctor: true, clinic: true, slot: true },
    });
  });

  return jsonSuccess(appointment, 201);
}
