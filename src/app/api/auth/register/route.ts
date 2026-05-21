import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api-auth";
import { registerSchema } from "@/lib/validations";
import { normalizePhone } from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid input");
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        phone: normalizePhone(data.phone),
        role: "PATIENT",
        otpVerified: false,
        patient: {
          create: {
            fullName: data.fullName,
            age: data.age,
            gender: data.gender,
            height: data.height,
            weight: data.weight,
            bloodGroup: data.bloodGroup,
            allergies: data.allergies,
            existingDiseases: data.existingDiseases,
            emergencyContact: data.emergencyContact,
            insuranceInfo: data.insuranceInfo,
            isActive: false,
          },
        },
      },
      include: { patient: true },
    });

    return jsonSuccess(
      {
        message: "Registration successful. Please verify OTP sent to your phone.",
        email: user.email,
        phone: user.phone,
        patientId: user.patient?.id,
      },
      201
    );
  } catch (e) {
    console.error(e);
    return jsonError("Registration failed", 500);
  }
}
