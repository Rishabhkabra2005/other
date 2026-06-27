export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { ConsultationMode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { doctorRegisterSchema } from "@/lib/validations";
import { verifyDoctorRegistryIdentity } from "@/lib/doctor-verification";
import { buildPendingDoctorProfile } from "@/lib/doctor-queue";
import { verifyOtpForPhone } from "@/lib/otp-verification";
import { buildDoctorTrackingUrl, sendDoctorVerificationQueuedEmail } from "@/lib/mail";
import { normalizePhone } from "@/lib/twilio";

const REGISTRY_MISMATCH_MESSAGE =
  "Verification Failed: The provided credentials do not match the official medical registry records. Please verify your data and try again.";

function buildInternalUserEmail(registrationNumber: string): string {
  const slug = registrationNumber
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `doctor.${slug}.${Date.now()}@careconnect.health`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = doctorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid registration data");
    }

    const data = parsed.data;
    const registrationNumber = data.registrationNumber.trim().toUpperCase();
    const contactEmail = data.email.trim().toLowerCase();
    const phone = normalizePhone(data.phone);

    const otpValid = await verifyOtpForPhone(phone, data.otp);
    if (!otpValid) {
      return jsonError("Invalid or expired OTP. Please request a new verification code.", 400);
    }

    const identity = verifyDoctorRegistryIdentity(registrationNumber, data.fullName);
    if (!identity.approved || !identity.registryRecord) {
      return jsonError(identity.error || REGISTRY_MISMATCH_MESSAGE, 400);
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

    const registry = identity.registryRecord;
    const pendingProfile = buildPendingDoctorProfile(registry);
    const passwordHash = await bcrypt.hash(
      `doctor-${registrationNumber}-${Date.now()}`,
      12
    );

    const user = await prisma.user.create({
      data: {
        email: buildInternalUserEmail(registrationNumber),
        phone,
        passwordHash,
        role: "DOCTOR",
        otpVerified: true,
        doctor: {
          create: {
            ...pendingProfile,
            contactEmail,
            medicalRegistrationNumber: registrationNumber,
            consultationFee: 500,
            languages: ["English", "Hindi"],
            modes: [
              ConsultationMode.ON_SITE,
              ConsultationMode.PHONE,
              ConsultationMode.VIDEO,
            ],
            clinicLocations: [],
            careerAchievements: [],
            bio: `${registry.doctor_name} — council registration ${registrationNumber}`,
          },
        },
      },
      include: { doctor: true },
    });

    if (!user.doctor) {
      return jsonError("Doctor profile could not be created.", 500);
    }

    const trackingUrl = buildDoctorTrackingUrl(user.doctor.id);
    const emailSent = await sendDoctorVerificationQueuedEmail(contactEmail, user.doctor.id);

    return jsonSuccess(
      {
        message:
          "OTP verified. Your profile verification request has been queued. Check your email for the live tracking link.",
        doctorId: user.doctor.id,
        registrationNumber,
        verificationStatus: user.doctor.verificationStatus,
        status: "PENDING",
        trackingUrl,
        emailSent,
        profile: {
          fullName: registry.doctor_name,
          fatherName: registry.father_name,
          degree: registry.degree,
          institute: registry.institute,
          graduationYear: registry.graduation_year,
          specialization: registry.specialization,
          contactEmail,
        },
      },
      201
    );
  } catch (error) {
    console.error("Doctor registration error:", error);
    return jsonError("Doctor registration failed. Please try again.", 500);
  }
}
