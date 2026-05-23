"use client";

import Link from "next/link";
import { useState } from "react";
import { Specialization } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { SPECIALIZATIONS } from "@/lib/constants";

interface CreateDoctorResponse {
  message: string;
  loginEmail?: string;
  temporaryPassword?: string;
  doctor?: { id: string; fullName: string };
}

export default function AddDoctorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<CreateDoctorResponse | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    qualification: "",
    experienceYears: "",
    specialization: "" as Specialization | "",
    consultationFee: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        qualification: form.qualification,
        experienceYears: Number(form.experienceYears),
        specialization: form.specialization,
        consultationFee: Number(form.consultationFee),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Failed to create doctor");
      return;
    }

    setSuccess(data);
    setForm({
      fullName: "",
      qualification: "",
      experienceYears: "",
      specialization: "",
      consultationFee: "",
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-base font-semibold text-teal-800 hover:underline"
        >
          ← Back to Admin Overview
        </Link>
        <h1 className="mt-4">Add New Doctor</h1>
        <p className="text-lg text-slate-700 mt-2">
          Create a doctor profile. They will appear in the verification queue until approved.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <CardTitle>Doctor Details</CardTitle>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name *"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Dr. Anil Sharma"
              required
              disabled={loading}
            />

            <Input
              label="Qualification *"
              value={form.qualification}
              onChange={(e) => update("qualification", e.target.value)}
              placeholder="MBBS, MD (Cardiology)"
              required
              disabled={loading}
            />

            <div className="grid sm:grid-cols-2 gap-5">
              <Input
                label="Experience (Years) *"
                type="number"
                min={0}
                max={60}
                value={form.experienceYears}
                onChange={(e) => update("experienceYears", e.target.value)}
                required
                disabled={loading}
              />

              <Input
                label="Consultation Fee (₹) *"
                type="number"
                min={0}
                value={form.consultationFee}
                onChange={(e) => update("consultationFee", e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Select
              label="Specialization *"
              value={form.specialization}
              onChange={(e) =>
                update("specialization", e.target.value as Specialization)
              }
              required
              disabled={loading}
              options={[
                { value: "", label: "Select specialization..." },
                ...SPECIALIZATIONS.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              ]}
            />

            {error && (
              <p
                className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200"
                role="alert"
              >
                {error}
              </p>
            )}

            {success && (
              <div
                className="text-base text-green-900 bg-green-50 p-4 rounded-lg border-2 border-green-300 space-y-2"
                role="status"
              >
                <p className="font-bold">{success.message}</p>
                {success.doctor && (
                  <p>
                    Profile created for <strong>{success.doctor.fullName}</strong>.
                  </p>
                )}
                {success.loginEmail && (
                  <p>
                    Login email: <strong>{success.loginEmail}</strong>
                  </p>
                )}
                {success.temporaryPassword && (
                  <p>
                    Temporary password: <strong>{success.temporaryPassword}</strong>
                  </p>
                )}
                <p className="text-slate-700">
                  Approve this doctor under{" "}
                  <Link href="/admin/verification" className="text-teal-800 font-semibold underline">
                    Verification Queue
                  </Link>
                  .
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-2">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "Saving..." : "Add Doctor"}
              </Button>
              <Link href="/admin/verification">
                <Button type="button" variant="secondary" disabled={loading}>
                  View Verification Queue
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
