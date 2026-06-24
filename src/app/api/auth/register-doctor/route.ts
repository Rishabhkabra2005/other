export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { ConsultationMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { doctorRegisterSchema } from "@/lib/validations";
import {
  buildApprovedDoctorUpdate,
  doctorEmailFromRegistrationNumber,
  verifyDoctorCredentials,
} from "@/lib/doctor-verification";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = doctorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid registration data");
    }

    const data = parsed.data;
    const registrationNumber = data.registration_number.trim().toUpperCase();

    const existingDoctor = await prisma.doctor.findUnique({
      where: { medicalRegistrationNumber: registrationNumber },
    });
    if (existingDoctor) {
      return jsonError("This Medical Registration Number is already registered.", 409);
    }

    const email = doctorEmailFromRegistrationNumber(registrationNumber);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return jsonError("An account already exists for this registration number.", 409);
    }

    const verification = verifyDoctorCredentials({
      registration_number: registrationNumber,
      doctor_name: data.doctor_name,
      father_name: data.father_name,
      degree: data.degree,
      institute: data.institute,
      graduation_year: data.graduation_year,
    });

    const passwordHash = await bcrypt.hash(
      `doctor-${registrationNumber}-${Date.now()}`,
      12
    );

    const currentYear = new Date().getFullYear();
    const experienceYears = Math.max(1, currentYear - Number(data.graduation_year));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "DOCTOR",
        otpVerified: true,
        doctor: {
          create: {
            fullName: data.doctor_name.trim(),
            fatherName: data.father_name.trim(),
            institute: data.institute.trim(),
            graduationYear: Number(data.graduation_year),
            medicalRegistrationNumber: registrationNumber,
            qualification: data.degree.trim(),
            experienceYears,
            specialization: "GENERAL_PHYSICIAN",
            consultationFee: 500,
            languages: ["English", "Hindi"],
            modes: [
              ConsultationMode.ON_SITE,
              ConsultationMode.PHONE,
              ConsultationMode.VIDEO,
            ],
            verificationStatus: "PENDING",
            verified: false,
            bio: `${data.doctor_name.trim()} — council registration ${registrationNumber}`,
          },
        },
      },
      include: { doctor: true },
    });

    if (!user.doctor) {
      return jsonError("Doctor profile could not be created.", 500);
    }

    if (verification.approved && verification.registryRecord) {
      const approvedUpdate = buildApprovedDoctorUpdate(verification.registryRecord);
      const approvedDoctor = await prisma.doctor.update({
        where: { id: user.doctor.id },
        data: approvedUpdate,
      });

      return jsonSuccess(
        {
          message:
            "Registration successful. All credentials matched the medical registry and your account is approved.",
          doctorId: approvedDoctor.id,
          registrationNumber,
          verificationStatus: approvedDoctor.verificationStatus,
          status: "APPROVED",
        },
        201
      );
    }

    return jsonSuccess(
      {
        message:
          "Registration received. Credential verification is pending — one or more details did not match the medical registry.",
        doctorId: user.doctor.id,
        registrationNumber,
        verificationStatus: "PENDING",
        status: "PENDING",
        errors: verification.errors,
      },
      201
    );
  } catch (error) {
    console.error("Doctor registration error:", error);
    return jsonError("Doctor registration failed. Please try again.", 500);
  }
}
