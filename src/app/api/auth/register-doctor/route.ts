export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { ConsultationMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { doctorRegisterSchema } from "@/lib/validations";
import { buildApprovedDoctorUpdate, verifyDoctorCredentials } from "@/lib/doctor-verification";
import { normalizePhone } from "@/lib/twilio";

const REGISTRY_MISMATCH_MESSAGE =
  "Verification Failed: The provided credentials do not match the official medical registry records. Please verify your data and try again.";

const CONTACT_TAKEN_MESSAGE =
  "Registration Failed: This email or phone number is already registered on the platform.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = doctorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid registration data");
    }

    const data = parsed.data;
    const registrationNumber = data.registration_number.trim().toUpperCase();
    const email = data.email.trim().toLowerCase();
    const phone = normalizePhone(data.phone);

    const [existingEmail, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findFirst({ where: { phone } }),
    ]);

    if (existingEmail || existingPhone) {
      return jsonError(CONTACT_TAKEN_MESSAGE, 409);
    }

    const verification = verifyDoctorCredentials({
      registration_number: registrationNumber,
      doctor_name: data.doctor_name,
      father_name: data.father_name,
      degree: data.degree,
      institute: data.institute,
      graduation_year: data.graduation_year,
    });

    if (!verification.approved || !verification.registryRecord) {
      return jsonError(REGISTRY_MISMATCH_MESSAGE, 400);
    }

    const existingRegistration = await prisma.doctor.findUnique({
      where: { medicalRegistrationNumber: registrationNumber },
    });
    if (existingRegistration) {
      return jsonError(
        "Registration Failed: This Medical Registration Number is already registered on the platform.",
        409
      );
    }

    const approvedUpdate = buildApprovedDoctorUpdate(verification.registryRecord);
    const passwordHash = await bcrypt.hash(
      `doctor-${registrationNumber}-${Date.now()}`,
      12
    );

    const user = await prisma.user.create({
      data: {
        email,
        phone,
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
            consultationFee: 500,
            languages: ["English", "Hindi"],
            modes: [
              ConsultationMode.ON_SITE,
              ConsultationMode.PHONE,
              ConsultationMode.VIDEO,
            ],
            bio: `${data.doctor_name.trim()} — council registration ${registrationNumber}`,
            ...approvedUpdate,
          },
        },
      },
      include: { doctor: true },
    });

    if (!user.doctor) {
      return jsonError("Doctor profile could not be created.", 500);
    }

    return jsonSuccess(
      {
        message:
          "Registration successful. All credentials matched the medical registry and your account is approved.",
        doctorId: user.doctor.id,
        registrationNumber,
        verificationStatus: user.doctor.verificationStatus,
        status: "APPROVED",
      },
      201
    );
  } catch (error) {
    console.error("Doctor registration error:", error);
    return jsonError("Doctor registration failed. Please try again.", 500);
  }
}
