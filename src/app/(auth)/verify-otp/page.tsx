"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

function maskPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `******${digits.slice(-4)}`;
}

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const initialSendDone = useRef(false);

  const sendOtp = useCallback(async () => {
    if (!phone) {
      setError("Phone number missing. Please register again.");
      return;
    }
    setSending(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "Failed to send OTP");
      return;
    }

    setOtpSent(true);
    setInfo(data.message || "OTP sent to your phone.");
  }, [phone]);

  useEffect(() => {
    if (!email || !phone) {
      setError("Missing registration details. Please register again.");
      return;
    }
    if (!initialSendDone.current) {
      initialSendDone.current = true;
      sendOtp();
    }
  }, [phone, email, sendOtp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Verification failed");
      return;
    }

    router.push("/login?verified=1");
  }

  if (!email || !phone) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent>
            <p className="text-base text-red-700 font-semibold" role="alert">
              Invalid verification link. Please complete registration first.
            </p>
            <Button className="mt-4" onClick={() => router.push("/register")}>
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardContent className="space-y-6">
          <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
          <p className="text-base text-slate-700">
            We sent a 6-digit code via SMS to{" "}
            <strong>{maskPhoneDisplay(phone)}</strong> for account{" "}
            <strong>{email}</strong>. Enter it below to activate your profile.
          </p>

          {info && otpSent && (
            <p className="text-base text-green-800 bg-green-50 border-2 border-green-200 rounded-lg p-4 font-medium">
              {info}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="6-Digit OTP"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="000000"
            />
            {error && (
              <p
                className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || sending || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Activate Profile"}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={sendOtp}
            disabled={sending}
          >
            {sending ? "Sending..." : "Resend OTP"}
          </Button>
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
