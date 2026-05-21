"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { BLOOD_GROUPS } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "MALE",
    height: "",
    weight: "",
    phone: "",
    email: "",
    password: "",
    bloodGroup: "",
    allergies: "",
    existingDiseases: "",
    emergencyContact: "",
    insuranceInfo: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        age: Number(form.age),
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        bloodGroup: form.bloodGroup || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors({ general: data.error || "Registration failed" });
      return;
    }

    router.push(
      `/verify-otp?email=${encodeURIComponent(form.email)}&phone=${encodeURIComponent(form.phone)}`
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardContent className="space-y-6">
          <CardTitle className="text-2xl">Patient Registration</CardTitle>
          <p className="text-base text-slate-700">
            All fields marked below help doctors provide safer care. Optional health details can be added now or later.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <Input label="Full Name *" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              <Input label="Age *" type="number" min={1} max={120} value={form.age} onChange={(e) => update("age", e.target.value)} required />
              <Select
                label="Gender *"
                name="gender"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                options={[
                  { value: "MALE", label: "Male" },
                  { value: "FEMALE", label: "Female" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
              <Input label="Height (cm)" type="number" value={form.height} onChange={(e) => update("height", e.target.value)} />
              <Input label="Weight (kg)" type="number" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
              <Input label="Phone Number *" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
              <Input label="Email *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              <Input label="Password *" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
              <Select
                label="Blood Group"
                value={form.bloodGroup}
                onChange={(e) => update("bloodGroup", e.target.value)}
                options={[{ value: "", label: "Select..." }, ...BLOOD_GROUPS.map((b) => ({ value: b, label: b }))]}
              />
            </div>

            <Input label="Allergies" value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
            <Input label="Existing Diseases" value={form.existingDiseases} onChange={(e) => update("existingDiseases", e.target.value)} />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={(e) => update("emergencyContact", e.target.value)} />
            <Input label="Insurance Info" value={form.insuranceInfo} onChange={(e) => update("insuranceInfo", e.target.value)} />

            {errors.general && (
              <p className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200" role="alert">
                {errors.general}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Registering..." : "Continue to OTP Verification"}
            </Button>
          </form>

          <p className="text-base text-center">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-teal-800 underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
