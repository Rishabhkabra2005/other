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

export const prescriptionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  diagnosis: z.string().min(2),
  medications: z.string().min(2),
  instructions: z.string().optional(),
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
