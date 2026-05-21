import { ConsultationMode, Specialization } from "@prisma/client";

export const SPECIALIZATIONS: { value: Specialization; label: string }[] = [
  { value: "GENERAL_PHYSICIAN", label: "General Physician" },
  { value: "GASTROENTEROLOGY", label: "Gastroenterology" },
  { value: "NEUROLOGY", label: "Neurology" },
  { value: "CARDIOLOGY", label: "Cardiology" },
  { value: "ONCOLOGY", label: "Oncology" },
  { value: "ORTHOPAEDICS", label: "Orthopaedics" },
  { value: "DENTISTRY", label: "Dentistry" },
  { value: "OPHTHALMOLOGY", label: "Ophthalmology" },
  { value: "PSYCHOLOGY", label: "Psychology" },
  { value: "PSYCHIATRY", label: "Psychiatry" },
  { value: "DERMATOLOGY", label: "Dermatology" },
  { value: "PEDIATRICS", label: "Pediatrics" },
  { value: "GYNECOLOGY", label: "Gynecology" },
  { value: "ENT", label: "ENT" },
  { value: "UROLOGY", label: "Urology" },
];

export const SPECIALIZATION_LABELS: Record<Specialization, string> =
  Object.fromEntries(
    SPECIALIZATIONS.map((s) => [s.value, s.label])
  ) as Record<Specialization, string>;

export const CONSULTATION_MODES: {
  value: ConsultationMode;
  label: string;
  description: string;
}[] = [
  { value: "ON_SITE", label: "On-Site", description: "Visit clinic in person" },
  { value: "PHONE", label: "Phone", description: "Secure masked phone call" },
  { value: "VIDEO", label: "Video", description: "Secure video consultation" },
];

export const MOCK_OTP = "123456";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
