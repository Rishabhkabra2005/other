import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveVerificationStatus,
  isDoctorClinicallyApproved,
} from "@/lib/doctor-verification";
import type { DoctorVerificationStatus, Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { patient: true, doctor: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.role === "PATIENT" && user.patient && !user.patient.isActive) {
          return null;
        }

        const doctorVerificationStatus = user.doctor
          ? getEffectiveVerificationStatus(user.doctor)
          : undefined;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          patientId: user.patient?.id,
          doctorId: user.doctor?.id,
          doctorVerificationStatus,
          name:
            user.patient?.fullName ||
            user.doctor?.fullName ||
            user.email,
        };
      },
    }),
    CredentialsProvider({
      id: "doctor-registration-number",
      name: "Doctor Registration Number",
      credentials: {
        registrationNumber: { label: "Medical Registration Number", type: "text" },
      },
      async authorize(credentials) {
        const registrationNumber = credentials?.registrationNumber?.trim().toUpperCase();
        if (!registrationNumber) return null;

        const doctor = await prisma.doctor.findUnique({
          where: { medicalRegistrationNumber: registrationNumber },
          include: { user: true },
        });

        if (!doctor) return null;

        const doctorVerificationStatus = getEffectiveVerificationStatus(doctor);

        return {
          id: doctor.user.id,
          email: doctor.user.email,
          role: doctor.user.role as Role,
          doctorId: doctor.id,
          doctorVerificationStatus,
          name: doctor.fullName,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.patientId = user.patientId;
        token.doctorId = user.doctorId;
        token.doctorVerificationStatus = user.doctorVerificationStatus;
      }

      if (token.role === "DOCTOR" && token.doctorId) {
        const doctor = await prisma.doctor.findUnique({
          where: { id: token.doctorId as string },
          select: {
            verificationStatus: true,
            verified: true,
            medicalRegistrationNumber: true,
          },
        });

        if (doctor) {
          token.doctorVerificationStatus = getEffectiveVerificationStatus(doctor);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.patientId = token.patientId as string | undefined;
        session.user.doctorId = token.doctorId as string | undefined;
        session.user.doctorVerificationStatus =
          token.doctorVerificationStatus as DoctorVerificationStatus | undefined;
        session.user.isDoctorApproved =
          token.role === "DOCTOR"
            ? token.doctorVerificationStatus === "APPROVED"
            : undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export { isDoctorClinicallyApproved };
