"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SPECIALIZATION_LABELS } from "@/lib/constants";
import type { DoctorVerificationStatus, Specialization } from "@prisma/client";

interface LedgerDoctor {
  id: string;
  fullName: string;
  qualification: string;
  specialization: Specialization;
  verificationStatus: DoctorVerificationStatus;
  medicalRegistrationNumber: string | null;
  user: {
    email: string;
    phone: string | null;
    createdAt: string;
  };
}

export default function AdminDoctorLedgerPage() {
  const [doctors, setDoctors] = useState<LedgerDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/doctors");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load doctor ledger");
        return;
      }
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setError("Network error while loading doctors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  async function handleRemoveDoctor(doctor: LedgerDoctor) {
    const regLabel = doctor.medicalRegistrationNumber || "No registration number";
    const confirmed = window.confirm(
      `Remove ${doctor.fullName} (${regLabel}) from the platform?\n\nThis permanently deletes their account, revokes all access, and cannot be undone.`
    );
    if (!confirmed) return;

    setRemovingId(doctor.id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/doctors/${doctor.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove doctor");
        return;
      }
      await loadDoctors();
    } catch {
      setError("Network error while removing doctor.");
    } finally {
      setRemovingId(null);
    }
  }

  const pendingCount = doctors.filter((d) => d.verificationStatus === "PENDING").length;
  const approvedCount = doctors.filter((d) => d.verificationStatus === "APPROVED").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1>Doctor Ledger</h1>
          <p className="text-lg text-slate-700 mt-2">
            Onboarded doctors from the self-service medical council registration gateway.
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Back to Overview</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="success">{approvedCount} Approved</Badge>
        <Badge variant="warning">{pendingCount} Pending</Badge>
        <Badge>{doctors.length} Total</Badge>
      </div>

      {error && (
        <p className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border-2 border-red-200" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <CardTitle className="mb-6">Onboarded Doctors</CardTitle>

          {loading ? (
            <p className="text-base text-slate-600 py-8 text-center">Loading doctor ledger…</p>
          ) : doctors.length === 0 ? (
            <p className="text-base text-slate-600 py-8 text-center">
              No doctors registered yet. New doctors enter via{" "}
              <Link href="/register/doctor" className="font-bold text-teal-800 underline">
                /register/doctor
              </Link>
              .
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border-2 border-slate-200">
              <table className="w-full min-w-[920px] text-left text-base">
                <thead>
                  <tr className="bg-slate-50 text-slate-900">
                    <th className="px-4 py-3 font-bold">Doctor</th>
                    <th className="px-4 py-3 font-bold">Reg. Number</th>
                    <th className="px-4 py-3 font-bold">Qualification</th>
                    <th className="px-4 py-3 font-bold">Specialization</th>
                    <th className="px-4 py-3 font-bold">Contact</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor, index) => (
                    <tr
                      key={doctor.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-4 py-4 font-semibold text-slate-900">{doctor.fullName}</td>
                      <td className="px-4 py-4 text-slate-800 font-mono text-sm">
                        {doctor.medicalRegistrationNumber || "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-800">{doctor.qualification}</td>
                      <td className="px-4 py-4 text-slate-800">
                        {SPECIALIZATION_LABELS[doctor.specialization]}
                      </td>
                      <td className="px-4 py-4 text-slate-800">
                        <div>{doctor.user.email}</div>
                        <div className="text-sm text-slate-600">{doctor.user.phone || "No phone"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            doctor.verificationStatus === "APPROVED" ? "success" : "warning"
                          }
                        >
                          {doctor.verificationStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={removingId === doctor.id}
                          onClick={() => handleRemoveDoctor(doctor)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          {removingId === doctor.id ? "Removing…" : "Remove Doctor"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
