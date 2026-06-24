"use client";

import { useSession } from "next-auth/react";
import { VerificationPendingScreen } from "@/components/doctor/VerificationPendingScreen";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse" role="status">
          Loading clinical workspace…
        </p>
      </div>
    );
  }

  if (
    session?.user?.role === "DOCTOR" &&
    session.user.doctorVerificationStatus !== "APPROVED" &&
    !session.user.isDoctorApproved
  ) {
    return <VerificationPendingScreen />;
  }

  return <>{children}</>;
}
