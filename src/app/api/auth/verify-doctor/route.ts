export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { doctorVerifySchema } from "@/lib/validations";
import {
  buildApprovedDoctorUpdate,
  verifyDoctorCredentials,
} from "@/lib/doctor-verification";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = doctorVerifySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid verification payload");
  }

  const data = parsed.data;
  const registrationNumber = data.registration_number.trim().toUpperCase();

  const verification = verifyDoctorCredentials({
    registration_number: registrationNumber,
    doctor_name: data.doctor_name,
    father_name: data.father_name,
    degree: data.degree,
    institute: data.institute,
    graduation_year: data.graduation_year,
  });

  if (!verification.approved || !verification.registryRecord) {
    if (data.doctorId) {
      await prisma.doctor.update({
        where: { id: data.doctorId },
        data: { verificationStatus: "PENDING", verified: false },
      });
    }

    return jsonError(
      verification.errors.join(" ") ||
        "Credential verification failed. Your account remains pending council review.",
      422
    );
  }

  const approvedUpdate = buildApprovedDoctorUpdate(verification.registryRecord);

  if (data.doctorId) {
    const doctor = await prisma.doctor.update({
      where: { id: data.doctorId },
      data: {
        fullName: data.doctor_name.trim(),
        fatherName: data.father_name.trim(),
        institute: data.institute.trim(),
        graduationYear: Number(data.graduation_year),
        medicalRegistrationNumber: registrationNumber,
        ...approvedUpdate,
        qualification: data.degree.trim(),
      },
    });

    return jsonSuccess({
      status: "APPROVED",
      message: "All credentials matched the medical registry. Your account is approved.",
      doctorId: doctor.id,
      verificationStatus: doctor.verificationStatus,
    });
  }

  const existing = await prisma.doctor.findUnique({
    where: { medicalRegistrationNumber: registrationNumber },
  });

  if (existing) {
    const doctor = await prisma.doctor.update({
      where: { id: existing.id },
      data: {
        fullName: data.doctor_name.trim(),
        fatherName: data.father_name.trim(),
        institute: data.institute.trim(),
        graduationYear: Number(data.graduation_year),
        ...approvedUpdate,
        qualification: data.degree.trim(),
      },
    });

    return jsonSuccess({
      status: "APPROVED",
      message: "All credentials matched the medical registry. Your account is approved.",
      doctorId: doctor.id,
      verificationStatus: doctor.verificationStatus,
    });
  }

  return jsonSuccess({
    status: "APPROVED",
    message:
      "Registry verification passed. Complete doctor registration to activate your clinical workspace.",
    verificationStatus: "APPROVED",
  });
}
