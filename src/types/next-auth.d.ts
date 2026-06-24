import type { DoctorVerificationStatus, Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    patientId?: string;
    doctorId?: string;
    doctorVerificationStatus?: DoctorVerificationStatus;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: Role;
      patientId?: string;
      doctorId?: string;
      doctorVerificationStatus?: DoctorVerificationStatus;
      isDoctorApproved?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    patientId?: string;
    doctorId?: string;
    doctorVerificationStatus?: DoctorVerificationStatus;
  }
}
