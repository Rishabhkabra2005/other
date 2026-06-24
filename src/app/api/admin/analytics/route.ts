import { prisma } from "@/lib/prisma";
import { requireAuth, jsonSuccess } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const [
    totalPatients,
    totalDoctors,
    verifiedDoctors,
    pendingDoctors,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.doctor.count({ where: { verificationStatus: "APPROVED" } }),
    prisma.doctor.count({ where: { verificationStatus: "PENDING" } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
  ]);

  const appointmentsByMode = await prisma.appointment.groupBy({
    by: ["mode"],
    _count: true,
  });

  const topSpecializations = await prisma.doctor.groupBy({
    by: ["specialization"],
    _count: true,
    orderBy: { _count: { specialization: "desc" } },
    take: 5,
  });

  return jsonSuccess({
    users: {
      patients: totalPatients,
      doctors: totalDoctors,
      verifiedDoctors,
      pendingVerification: pendingDoctors,
    },
    appointments: {
      total: totalAppointments,
      completed: completedAppointments,
      pending: pendingAppointments,
      cancelled: cancelledAppointments,
      byMode: appointmentsByMode,
    },
    topSpecializations,
  });
}
