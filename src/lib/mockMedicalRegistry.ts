import type { Specialization } from "@prisma/client";

export interface MedicalRegistryRecord {
  registration_number: string;
  doctor_name: string;
  father_name: string;
  degree: string;
  institute: string;
  graduation_year: number;
  specialization: string;
}

export const MOCK_MEDICAL_REGISTRY: MedicalRegistryRecord[] = [
  {
    registration_number: "NMC-2026-001",
    doctor_name: "Dr. Priya Verma",
    father_name: "Rajesh Verma",
    degree: "MBBS",
    institute: "AIIMS Delhi",
    graduation_year: 2018,
    specialization: "General Physician",
  },
  {
    registration_number: "NMC-2026-002",
    doctor_name: "Dr. Arjun Mehta",
    father_name: "Sunil Mehta",
    degree: "MD",
    institute: "KGMU Lucknow",
    graduation_year: 2016,
    specialization: "Cardiology",
  },
  {
    registration_number: "NMC-2026-003",
    doctor_name: "Dr. Kavita Nair",
    father_name: "Gopal Nair",
    degree: "MBBS",
    institute: "CMC Vellore",
    graduation_year: 2020,
    specialization: "Pediatrics",
  },
  {
    registration_number: "NMC-2026-004",
    doctor_name: "Dr. Rohit Desai",
    father_name: "Mahesh Desai",
    degree: "MS",
    institute: "Seth GS Medical College Mumbai",
    graduation_year: 2015,
    specialization: "Orthopaedics",
  },
  {
    registration_number: "NMC-2026-005",
    doctor_name: "Dr. Ananya Iyer",
    father_name: "Krishnan Iyer",
    degree: "MD",
    institute: "JIPMER Puducherry",
    graduation_year: 2017,
    specialization: "Dermatology",
  },
  {
    registration_number: "NMC-2026-006",
    doctor_name: "Dr. Imran Sheikh",
    father_name: "Abdul Sheikh",
    degree: "MBBS",
    institute: "Osmania Medical College Hyderabad",
    graduation_year: 2019,
    specialization: "General Physician",
  },
  {
    registration_number: "NMC-2026-007",
    doctor_name: "Dr. Neha Gupta",
    father_name: "Vijay Gupta",
    degree: "DM",
    institute: "PGIMER Chandigarh",
    graduation_year: 2014,
    specialization: "Neurology",
  },
  {
    registration_number: "NMC-2026-008",
    doctor_name: "Dr. Vikram Singh",
    father_name: "Harpreet Singh",
    degree: "MBBS",
    institute: "Government Medical College Amritsar",
    graduation_year: 2021,
    specialization: "ENT",
  },
  {
    registration_number: "NMC-2026-009",
    doctor_name: "Dr. Sunita Rao",
    father_name: "Ramesh Rao",
    degree: "MD",
    institute: "Bangalore Medical College",
    graduation_year: 2013,
    specialization: "Gynecology",
  },
  {
    registration_number: "NMC-2026-010",
    doctor_name: "Dr. Aditya Banerjee",
    father_name: "Subhash Banerjee",
    degree: "MBBS",
    institute: "Calcutta National Medical College",
    graduation_year: 2018,
    specialization: "Ophthalmology",
  },
  {
    registration_number: "NMC-2026-011",
    doctor_name: "Dr. Meenakshi Pillai",
    father_name: "Suresh Pillai",
    degree: "MD",
    institute: "Maulana Azad Medical College Delhi",
    graduation_year: 2016,
    specialization: "Psychiatry",
  },
  {
    registration_number: "NMC-2026-012",
    doctor_name: "Dr. Karan Malhotra",
    father_name: "Anil Malhotra",
    degree: "MBBS",
    institute: "King George Medical University Lucknow",
    graduation_year: 2022,
    specialization: "Urology",
  },
  {
    registration_number: "NMC-2026-013",
    doctor_name: "Dr. Deepa Kulkarni",
    father_name: "Prakash Kulkarni",
    degree: "MD",
    institute: "B J Medical College Pune",
    graduation_year: 2015,
    specialization: "Gastroenterology",
  },
  {
    registration_number: "NMC-2026-014",
    doctor_name: "Dr. Hassan Ali",
    father_name: "Mohammed Ali",
    degree: "MBBS",
    institute: "Aligarh Muslim University Medical College",
    graduation_year: 2017,
    specialization: "General Physician",
  },
  {
    registration_number: "NMC-2026-015",
    doctor_name: "Dr. Ritu Choudhary",
    father_name: "Dinesh Choudhary",
    degree: "MD",
    institute: "SMS Medical College Jaipur",
    graduation_year: 2019,
    specialization: "Pediatrics",
  },
];

export function findRegistryByRegistrationNumber(
  registrationNumber: string
): MedicalRegistryRecord | undefined {
  const normalized = registrationNumber.trim().toUpperCase();
  return MOCK_MEDICAL_REGISTRY.find(
    (record) => record.registration_number.toUpperCase() === normalized
  );
}

export const REGISTRY_SPECIALIZATION_MAP: Record<string, Specialization> = {
  "general physician": "GENERAL_PHYSICIAN",
  cardiology: "CARDIOLOGY",
  pediatrics: "PEDIATRICS",
  orthopaedics: "ORTHOPAEDICS",
  dermatology: "DERMATOLOGY",
  neurology: "NEUROLOGY",
  ent: "ENT",
  gynecology: "GYNECOLOGY",
  ophthalmology: "OPHTHALMOLOGY",
  psychiatry: "PSYCHIATRY",
  urology: "UROLOGY",
  gastroenterology: "GASTROENTEROLOGY",
};

export function mapRegistrySpecialization(label: string): Specialization {
  const key = label.trim().toLowerCase();
  return REGISTRY_SPECIALIZATION_MAP[key] ?? "GENERAL_PHYSICIAN";
}
