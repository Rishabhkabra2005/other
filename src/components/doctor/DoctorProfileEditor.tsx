"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

interface DoctorProfileData {
  consultationFee: number;
  clinicLocations: string[];
  availabilityHours: string | null;
  careerAchievements: string[];
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function arrayToLines(values: string[]): string {
  return values.join("\n");
}

export function DoctorProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState("");
  const [clinicLocations, setClinicLocations] = useState("");
  const [availabilityHours, setAvailabilityHours] = useState("");
  const [careerAchievements, setCareerAchievements] = useState("");

  useEffect(() => {
    fetch("/api/doctors/profile")
      .then((r) => r.json())
      .then((data: DoctorProfileData) => {
        setFee(String(data.consultationFee ?? 500));
        setClinicLocations(arrayToLines(data.clinicLocations ?? []));
        setAvailabilityHours(data.availabilityHours ?? "");
        setCareerAchievements(arrayToLines(data.careerAchievements ?? []));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/doctors/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationFee: Number(fee),
          clinicLocations: linesToArray(clinicLocations),
          availabilityHours: availabilityHours.trim(),
          careerAchievements: linesToArray(careerAchievements),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update profile");
        return;
      }

      setMessage("Profile updated successfully.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-slate-600">Loading profile settings…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-teal-100">
      <CardContent className="pt-6 space-y-5">
        <div>
          <CardTitle className="text-xl">Practice Profile Management</CardTitle>
          <p className="text-base text-slate-700 mt-2">
            Update your clinic locations, availability hours, and career achievements for patients
            viewing your profile.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Consultation Fee (₹)"
            type="number"
            min={0}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="max-w-xs"
          />

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Clinic Location(s)
            </label>
            <textarea
              value={clinicLocations}
              onChange={(e) => setClinicLocations(e.target.value)}
              rows={3}
              placeholder={"CareConnect Clinic, Sector 12, New Delhi\nCity Medical Center, Ring Road"}
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <p className="text-xs text-slate-500 mt-1">One location per line.</p>
          </div>

          <Input
            label="Timing / Availability Hours"
            value={availabilityHours}
            onChange={(e) => setAvailabilityHours(e.target.value)}
            placeholder="Mon–Fri 9:00 AM – 5:00 PM"
          />

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Career Achievements & Certifications
            </label>
            <textarea
              value={careerAchievements}
              onChange={(e) => setCareerAchievements(e.target.value)}
              rows={4}
              placeholder={"Fellowship in Interventional Cardiology — AIIMS (2020)\nBoard Certified — National Medical Council"}
              className="w-full rounded-lg border-2 border-slate-200 px-4 py-3 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <p className="text-xs text-slate-500 mt-1">One achievement or certification per line.</p>
          </div>

          {message && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              {message}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
