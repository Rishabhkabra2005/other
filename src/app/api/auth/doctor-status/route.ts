export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { processDoctorVerificationQueue } from "@/lib/doctor-queue";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("id")?.trim();

  if (!doctorId) {
    return jsonError("Doctor ID is required.", 400);
  }

  const doctor = await processDoctorVerificationQueue(doctorId);

  if (!doctor) {
    return jsonError("Verification request not found.", 404);
  }

  return jsonSuccess({
    doctorId: doctor.id,
    fullName: doctor.fullName,
    verificationStatus: doctor.verificationStatus,
    status: doctor.verificationStatus,
    medicalRegistrationNumber: doctor.medicalRegistrationNumber,
    contactEmail: doctor.contactEmail,
  });
}

export async function POST(request: Request) {
  let body: { doctorId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const doctorId = body.doctorId?.trim();
  if (!doctorId) {
    return jsonError("Doctor ID is required.", 400);
  }

  const exists = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!exists) {
    return jsonError("Verification request not found.", 404);
  }

  const doctor = await processDoctorVerificationQueue(doctorId);
  if (!doctor) {
    return jsonError("Verification request not found.", 404);
  }

  return jsonSuccess({
    doctorId: doctor.id,
    fullName: doctor.fullName,
    verificationStatus: doctor.verificationStatus,
    status: doctor.verificationStatus,
    medicalRegistrationNumber: doctor.medicalRegistrationNumber,
    contactEmail: doctor.contactEmail,
  });
}
