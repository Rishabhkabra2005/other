"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

interface DoctorStatusResponse {
  doctorId: string;
  fullName: string;
  verificationStatus: "PENDING" | "APPROVED";
  status: "PENDING" | "APPROVED";
  medicalRegistrationNumber: string | null;
}

function TrackStatusContent() {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("id") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DoctorStatusResponse | null>(null);

  const loadStatus = useCallback(async () => {
    if (!doctorId) {
      setError("Missing verification tracking ID.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/doctor-status?id=${encodeURIComponent(doctorId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not load verification status.");
        setStatus(null);
        return;
      }

      setError(null);
      setStatus(data as DoctorStatusResponse);
    } catch {
      setError("Network error while loading verification status.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  if (loading && !status) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-teal-700" />
        Loading verification status…
      </div>
    );
  }

  if (error || !status) {
    return (
      <Card className="max-w-xl mx-auto border-2 border-red-200">
        <CardContent className="py-10 text-center space-y-4">
          <CardTitle className="text-xl text-red-800">Tracking Unavailable</CardTitle>
          <p className="text-slate-700">{error || "Unable to find this verification request."}</p>
          <Link href="/register/doctor">
            <Button variant="outline">Back to Registration</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isApproved = status.verificationStatus === "APPROVED";

  return (
    <Card className={`max-w-xl mx-auto border-2 ${isApproved ? "border-emerald-200" : "border-amber-200"}`}>
      <CardContent className="py-10 px-6 text-center space-y-5">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          ) : (
            <Clock3 className="h-8 w-8" aria-hidden />
          )}
        </div>

        <CardTitle className="text-2xl">
          {isApproved ? "Verification Approved" : "Verification In Progress"}
        </CardTitle>

        <p className="text-base text-slate-700 leading-relaxed">
          {isApproved ? (
            <>
              Congratulations{status.fullName ? `, ${status.fullName}` : ""}! Your credentials have
              been verified against the official medical registry. You may now access the doctor
              login portal.
            </>
          ) : (
            <>
              Your profile verification is currently in progress. We are verifying your details
              against the official medical registry database. Please check back later.
            </>
          )}
        </p>

        {status.medicalRegistrationNumber && (
          <p className="text-sm font-mono text-slate-500">
            Registration No: {status.medicalRegistrationNumber}
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          {isApproved ? (
            <Link href="/login/doctor">
              <Button size="lg">Go to Login Portal</Button>
            </Link>
          ) : (
            <Button variant="outline" onClick={loadStatus} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh Status"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrackStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto text-center py-16 text-slate-600">Loading…</div>
      }
    >
      <TrackStatusContent />
    </Suspense>
  );
}
