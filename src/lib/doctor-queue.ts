import { prisma } from "@/lib/prisma";
import {
  buildApprovedDoctorUpdate,
  verifyDoctorCredentials,
} from "@/lib/doctor-verification";
import { mapRegistrySpecialization } from "@/lib/mockMedicalRegistry";

const QUEUE_PROCESSING_DELAY_MS = 5000;

export async function processDoctorVerificationQueue(doctorId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      fullName: true,
      fatherName: true,
      institute: true,
      graduationYear: true,
      qualification: true,
      medicalRegistrationNumber: true,
      verificationStatus: true,
      verified: true,
      contactEmail: true,
      createdAt: true,
    },
  });

  if (!doctor) return null;

  if (doctor.verificationStatus === "APPROVED") {
    return doctor;
  }

  const elapsedMs = Date.now() - doctor.createdAt.getTime();
  if (elapsedMs < QUEUE_PROCESSING_DELAY_MS) {
    return doctor;
  }

  if (
    !doctor.medicalRegistrationNumber ||
    !doctor.fatherName ||
    !doctor.institute ||
    doctor.graduationYear == null
  ) {
    return doctor;
  }

  const verification = verifyDoctorCredentials({
    registration_number: doctor.medicalRegistrationNumber,
    doctor_name: doctor.fullName,
    father_name: doctor.fatherName,
    degree: doctor.qualification,
    institute: doctor.institute,
    graduation_year: doctor.graduationYear,
  });

  if (!verification.approved || !verification.registryRecord) {
    return doctor;
  }

  const approvedUpdate = buildApprovedDoctorUpdate(verification.registryRecord);

  return prisma.doctor.update({
    where: { id: doctorId },
    data: approvedUpdate,
    select: {
      id: true,
      fullName: true,
      fatherName: true,
      institute: true,
      graduationYear: true,
      qualification: true,
      medicalRegistrationNumber: true,
      verificationStatus: true,
      verified: true,
      contactEmail: true,
      createdAt: true,
    },
  });
}

export function buildPendingDoctorProfile(registry: {
  doctor_name: string;
  father_name: string;
  institute: string;
  graduation_year: number;
  degree: string;
  specialization: string;
}) {
  const currentYear = new Date().getFullYear();

  return {
    fullName: registry.doctor_name,
    fatherName: registry.father_name,
    institute: registry.institute,
    graduationYear: registry.graduation_year,
    qualification: registry.degree,
    specialization: mapRegistrySpecialization(registry.specialization),
    experienceYears: Math.max(1, currentYear - registry.graduation_year),
    verificationStatus: "PENDING" as const,
    verified: false,
  };
}
