"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { MOCK_OTP } from "@/lib/constants";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Verification failed");
      return;
    }

    router.push("/login?verified=1");
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardContent className="space-y-6">
          <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
          <p className="text-base text-slate-700">
            We sent a 6-digit OTP to your registered phone number for{" "}
            <strong>{email}</strong>. Enter it below to activate your profile.
          </p>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-base text-amber-900">
            <strong>Demo OTP:</strong> Use code <strong>{MOCK_OTP}</strong> for testing.
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="hidden"
              name="email"
              value={email}
              readOnly
              className="hidden"
            />
            <Input
              label="6-Digit OTP"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              required
              placeholder="000000"
            />
            {error && (
              <p className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Activate Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<p className="text-base text-center">Loading...</p>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
