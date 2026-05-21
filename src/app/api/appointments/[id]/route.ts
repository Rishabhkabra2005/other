import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { AppointmentStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuth(["DOCTOR", "PATIENT", "ADMIN"]);
  if (error) return error;

  const { status } = await request.json() as { status: AppointmentStatus };
  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: { slot: true },
  });
  if (!appointment) return jsonError("Appointment not found", 404);

  if (session!.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({
      where: { userId: session!.user.id },
    });
    if (patient?.id !== appointment.patientId) {
      return jsonError("Forbidden", 403);
    }
    if (status !== "CANCELLED") {
      return jsonError("Patients can only cancel appointments", 403);
    }
  }

  if (session!.user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session!.user.id },
    });
    if (doctor?.id !== appointment.doctorId) {
      return jsonError("Forbidden", 403);
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (status === "CANCELLED" && appointment.slotId) {
      await tx.availabilitySlot.update({
        where: { id: appointment.slotId },
        data: { booked: false },
      });
    }
    return tx.appointment.update({
      where: { id: params.id },
      data: { status },
    });
  });

  return jsonSuccess(updated);
}
