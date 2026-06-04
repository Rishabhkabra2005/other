import { Specialization } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  age: z.coerce.number().min(1).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  height: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  existingDiseases: z.string().optional(),
  emergencyContact: z.string().optional(),
  insuranceInfo: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const sendOtpSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10, "Valid phone number required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const familyMemberSchema = z.object({
  fullName: z.string().min(2),
  age: z.coerce.number().min(1).max(120),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  relation: z.string().min(2),
});

export const appointmentSchema = z.object({
  doctorId: z.string(),
  mode: z.enum(["ON_SITE", "PHONE", "VIDEO"]),
  slotId: z.string(),
  clinicId: z.string().optional(),
  familyMemberId: z.string().optional(),
  notes: z.string().optional(),
});

export const medicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
});

export const prescriptionSchema = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  medications: z.array(medicationSchema).min(1, "Add at least one medication"),
  doctorNotes: z.string().optional(),
  markCompleted: z.boolean().optional(),
});

export const prescriptionSummarizeSchema = z.object({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
  doctorNotes: z.string().optional(),
});

export const slotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  mode: z.enum(["ON_SITE", "PHONE", "VIDEO"]),
});

export const reviewSchema = z.object({
  doctorId: z.string(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
});

export const addDoctorSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experienceYears: z.coerce.number().min(0).max(60),
  specialization: z.enum(
    Object.values(Specialization) as [Specialization, ...Specialization[]],
    { message: "Please select a specialization" }
  ),
  consultationFee: z.coerce.number().min(0, "Fee must be zero or greater"),
});
