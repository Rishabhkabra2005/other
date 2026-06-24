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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    doctor_name: "",
    father_name: "",
    degree: "",
    institute: "",
    graduation_year: "",
    registration_number: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/register-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        graduation_year: Number(form.graduation_year),
        registration_number: form.registration_number.trim().toUpperCase(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors({ general: data.error || "Registration failed" });
      return;
    }

    if (data.status === "APPROVED") {
      router.push(
        `/login/doctor?registered=${encodeURIComponent(form.registration_number.trim().toUpperCase())}&approved=1`
      );
      return;
    }

    router.push(
      `/login/doctor?registered=${encodeURIComponent(form.registration_number.trim().toUpperCase())}&pending=1`
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-2 border-teal-100">
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
            <Stethoscope className="h-8 w-8 text-teal-700 shrink-0 mt-1" aria-hidden />
            <div>
              <CardTitle className="text-2xl">Doctor Registration</CardTitle>
              <p className="text-base text-slate-700 mt-2">
                Register with your Medical Registration Number. We automatically verify your
                credentials against the National Medical Council registry.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="Full Name *"
                value={form.doctor_name}
                onChange={(e) => update("doctor_name", e.target.value)}
                required
              />
              <Input
                label="Father's Name *"
                value={form.father_name}
                onChange={(e) => update("father_name", e.target.value)}
                required
              />
              <Input
                label="Degree *"
                placeholder="e.g. MBBS, MD"
                value={form.degree}
                onChange={(e) => update("degree", e.target.value)}
                required
              />
              <Input
                label="Medical Institute *"
                placeholder="e.g. AIIMS Delhi"
                value={form.institute}
                onChange={(e) => update("institute", e.target.value)}
                required
              />
              <Input
                label="Graduation Year *"
                type="number"
                min={1970}
                max={new Date().getFullYear()}
                value={form.graduation_year}
                onChange={(e) => update("graduation_year", e.target.value)}
                required
              />
              <Input
                label="Medical Registration Number *"
                placeholder="e.g. NMC-2026-001"
                value={form.registration_number}
                onChange={(e) => update("registration_number", e.target.value.toUpperCase())}
                required
              />
            </div>

            {errors.general && (
              <p
                className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200"
                role="alert"
              >
                {errors.general}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Verifying credentials…" : "Register & Verify with Medical Council"}
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
