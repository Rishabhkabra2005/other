"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { IdCard, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

export default function DoctorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillReg = searchParams.get("registered") || "";
  const justApproved = searchParams.get("approved") === "1";
  const isPending = searchParams.get("pending") === "1";

  const [registrationNumber, setRegistrationNumber] = useState(prefillReg);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("doctor-registration-number", {
      registrationNumber: registrationNumber.trim().toUpperCase(),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        "Unable to sign in with this Medical Registration Number. Please register first or verify your council credentials."
      );
      return;
    }

    router.push("/doctor");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-2 border-teal-100">
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-8 w-8 text-teal-700 shrink-0 mt-1" aria-hidden />
            <div>
              <CardTitle className="text-2xl">Doctor Sign In</CardTitle>
              <p className="text-base text-slate-700 mt-2">
                Access your clinical workspace using your unique Medical Registration Number.
              </p>
            </div>
          </div>

          {isPending && (
            <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              Registration received. Council verification is still pending — sign in to view your
              verification status. If details were incorrect, re-register with exact registry
              information.
            </p>
          )}

          {justApproved && (
            <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
              Your credentials were approved by the medical registry. Sign in with your registration
              number to enter the doctor dashboard.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Medical Registration Number"
              placeholder="e.g. NMC-2026-001"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              required
              autoComplete="off"
            />

            {error && (
              <p
                className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200"
                role="alert"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  <IdCard className="h-5 w-5" aria-hidden />
                  Sign In with Registration Number
                </>
              )}
            </Button>
          </form>

          <div className="space-y-2 text-base text-center text-slate-700">
            <p>
              New doctor?{" "}
              <Link href="/register/doctor" className="font-bold text-teal-800 underline">
                Register as Doctor
              </Link>
            </p>
            <p>
              Patient or admin?{" "}
              <Link href="/login" className="font-bold text-teal-800 underline">
                Standard Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
