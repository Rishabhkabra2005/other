"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    registrationNumber: "",
    otp: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendOtp() {
    setErrors({});
    setInfo("");

    if (!form.phone.trim()) {
      setErrors({ phone: "Enter your phone number before requesting an OTP." });
      return;
    }

    setSendingOtp(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone }),
    });
    const data = await res.json();
    setSendingOtp(false);

    if (!res.ok) {
      setErrors({ general: data.error || "Failed to send OTP" });
      return;
    }

    setOtpSent(true);
    setInfo(data.message || "Verification OTP sent to your phone.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setInfo("");

    if (!otpSent) {
      setErrors({ general: "Please send and enter your phone verification OTP first." });
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        otp: form.otp.trim(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors({ general: data.error || "Registration failed" });
      return;
    }

    router.push(
      `/login/doctor?registered=${encodeURIComponent(form.registrationNumber.trim().toUpperCase())}&approved=1`
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-2 border-teal-100">
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-8 w-8 text-teal-700 shrink-0 mt-1" aria-hidden />
            <div>
              <CardTitle className="text-2xl">Doctor Registration</CardTitle>
              <p className="text-base text-slate-700 mt-2">
                Enter your contact details and Medical Registration Number. We verify your phone via
                OTP, then match your name against the National Medical Council registry.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name *"
              placeholder="e.g. Dr. Priya Verma"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
            <Input
              label="Email ID *"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
            <Input
              label="Phone Number *"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
            />
            <Input
              label="Medical Registration Number *"
              placeholder="e.g. NMC-2026-001"
              value={form.registrationNumber}
              onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())}
              required
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Phone verification (OTP)</p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={sendingOtp || !form.phone.trim()}
                onClick={handleSendOtp}
              >
                {sendingOtp ? "Sending OTP…" : "Send Verification OTP"}
              </Button>
              {otpSent && (
                <Input
                  label="Enter OTP Code *"
                  value={form.otp}
                  onChange={(e) => update("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                />
              )}
            </div>

            {info && (
              <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                {info}
              </p>
            )}

            {errors.general && (
              <p
                className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200"
                role="alert"
              >
                {errors.general}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || !otpSent}>
              {loading ? "Verifying & registering…" : "Complete Registration"}
            </Button>
          </form>

          <div className="flex flex-wrap gap-4 justify-center text-base">
            <Link href="/register" className="font-bold text-teal-800 underline">
              Register as Patient
            </Link>
            <span className="text-slate-400">·</span>
            <Link href="/login/doctor" className="font-bold text-teal-800 underline">
              Doctor Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
