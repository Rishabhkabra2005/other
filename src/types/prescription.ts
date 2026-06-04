export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: Medication[];
  doctorNotes?: string;
}

export interface PrescriptionDoctor {
  id: string;
  fullName: string;
  qualification: string;
  specialization: string;
}

export interface PrescriptionAppointment {
  id: string;
  scheduledAt: string;
  mode: string;
  status: string;
}

export interface PrescriptionRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  dateWritten: string;
  medications: Medication[];
  doctorNotes: string | null;
  doctor: PrescriptionDoctor;
  appointment: PrescriptionAppointment | null;
}

export const emptyMedication = (): Medication => ({
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
});

export function parseMedications(value: unknown): Medication[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Medication =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Medication).name === "string" &&
      typeof (item as Medication).dosage === "string" &&
      typeof (item as Medication).frequency === "string" &&
      typeof (item as Medication).duration === "string"
  );
}
