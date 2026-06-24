import { prisma } from "@/lib/prisma";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  if (!id) return jsonError("Doctor ID is required");

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true, userId: true, fullName: true },
    });

    if (!doctor) {
      return jsonError("Doctor not found", 404);
    }

    await prisma.$transaction(async (tx) => {
      const appointmentIds = (
        await tx.appointment.findMany({
          where: { doctorId: id },
          select: { id: true },
        })
      ).map((row) => row.id);

      if (appointmentIds.length > 0) {
        await tx.prescription.deleteMany({
          where: { appointmentId: { in: appointmentIds } },
        });
      }

      await tx.prescription.deleteMany({ where: { doctorId: id } });
      await tx.review.deleteMany({ where: { doctorId: id } });
      await tx.appointment.deleteMany({ where: { doctorId: id } });
      await tx.availabilitySlot.deleteMany({ where: { doctorId: id } });
      await tx.clinic.deleteMany({ where: { doctorId: id } });
      await tx.doctor.delete({ where: { id } });
      await tx.user.delete({ where: { id: doctor.userId } });
    });

    return jsonSuccess({
      message: `Doctor ${doctor.fullName} has been permanently removed from the platform.`,
      doctorId: id,
    });
  } catch (e) {
    console.error("Remove doctor error:", e);
    return jsonError("Failed to remove doctor. Please try again.", 500);
  }
}
