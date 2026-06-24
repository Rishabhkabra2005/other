import type { Doctor, DoctorVerificationStatus } from "@prisma/client";
import {
  findRegistryByRegistrationNumber,
  mapRegistrySpecialization,
  type MedicalRegistryRecord,
} from "@/lib/mockMedicalRegistry";

export interface DoctorVerificationInput {
  registration_number: string;
  doctor_name: string;
  father_name: string;
  degree: string;
  institute: string;
  graduation_year: number | string;
}

export interface DoctorVerificationResult {
  approved: boolean;
  errors: string[];
  registryRecord?: MedicalRegistryRecord;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function verifyDoctorCredentials(
  input: DoctorVerificationInput
): DoctorVerificationResult {
  const errors: string[] = [];
  const registrationNumber = input.registration_number.trim().toUpperCase();

  if (!registrationNumber) {
    return {
      approved: false,
      errors: ["Medical Registration Number is required for council verification."],
    };
  }

  const registryRecord = findRegistryByRegistrationNumber(registrationNumber);
  if (!registryRecord) {
    return {
      approved: false,
      errors: [
        `Registration number "${registrationNumber}" was not found in the National Medical Council registry database.`,
      ],
    };
  }

  if (normalizeText(input.doctor_name) !== normalizeText(registryRecord.doctor_name)) {
    errors.push(
      `Doctor name mismatch: submitted "${input.doctor_name}" does not match registry record "${registryRecord.doctor_name}".`
    );
  }

  if (normalizeText(input.father_name) !== normalizeText(registryRecord.father_name)) {
    errors.push(
      `Father's name mismatch: submitted "${input.father_name}" does not match registry record "${registryRecord.father_name}".`
    );
  }

  if (normalizeText(input.degree) !== normalizeText(registryRecord.degree)) {
    errors.push(
      `Degree mismatch: submitted "${input.degree}" does not match registry record "${registryRecord.degree}".`
    );
  }

  if (normalizeText(input.institute) !== normalizeText(registryRecord.institute)) {
    errors.push(
      `Medical institute mismatch: submitted "${input.institute}" does not match registry record "${registryRecord.institute}".`
    );
  }

  const submittedYear = Number(input.graduation_year);
  if (!Number.isFinite(submittedYear) || submittedYear !== registryRecord.graduation_year) {
    errors.push(
      `Graduation year mismatch: submitted "${input.graduation_year}" does not match registry record "${registryRecord.graduation_year}".`
    );
  }

  return {
    approved: errors.length === 0,
    errors,
    registryRecord,
  };
}

export function getEffectiveVerificationStatus(
  doctor: Pick<
    Doctor,
    "verificationStatus" | "verified" | "medicalRegistrationNumber"
  >
): DoctorVerificationStatus {
  if (doctor.verificationStatus === "APPROVED") return "APPROVED";
  if (!doctor.medicalRegistrationNumber && doctor.verified) return "APPROVED";
  return doctor.verificationStatus;
}

export function isDoctorClinicallyApproved(
  doctor: Pick<
    Doctor,
    "verificationStatus" | "verified" | "medicalRegistrationNumber"
  >
): boolean {
  return getEffectiveVerificationStatus(doctor) === "APPROVED";
}

export function buildApprovedDoctorUpdate(registryRecord: MedicalRegistryRecord) {
  const currentYear = new Date().getFullYear();
  const experienceYears = Math.max(1, currentYear - registryRecord.graduation_year);

  return {
    verificationStatus: "APPROVED" as const,
    verified: true,
    specialization: mapRegistrySpecialization(registryRecord.specialization),
    experienceYears,
    qualification: registryRecord.degree,
  };
}

export function doctorEmailFromRegistrationNumber(registrationNumber: string): string {
  const slug = registrationNumber
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug}@doctors.careconnect.health`;
}
