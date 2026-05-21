"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SPECIALIZATION_LABELS } from "@/lib/constants";
import { Specialization } from "@prisma/client";

interface Doctor {
  id: string;
  fullName: string;
  qualification: string;
  specialization: Specialization;
  verified: boolean;
  user: { email: string; phone: string | null };
}

export default function AdminVerificationPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  function load() {
    fetch("/api/admin/doctors").then((r) => r.json()).then(setDoctors);
  }

  useEffect(() => {
    load();
  }, []);

  async function verify(doctorId: string, verified: boolean) {
    await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, verified }),
    });
    load();
  }

  const pending = doctors.filter((d) => !d.verified);

  return (
    <div className="space-y-8">
      <h1>Doctor Verification Queue</h1>
      <p className="text-lg text-slate-700">
        {pending.length} doctor(s) awaiting verification.
      </p>

      {pending.length === 0 ? (
        <p className="text-base bg-green-50 border-2 border-green-200 p-4 rounded-lg">
          All doctors are verified.
        </p>
      ) : (
        pending.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex flex-wrap justify-between gap-4">
              <div>
                <CardTitle>{d.fullName}</CardTitle>
                <p className="text-base text-slate-700 mt-2">{d.qualification}</p>
                <p className="text-base">{SPECIALIZATION_LABELS[d.specialization]}</p>
                <p className="text-base">{d.user.email} · {d.user.phone}</p>
                <Badge variant="warning" className="mt-2">Pending</Badge>
              </div>
              <Button onClick={() => verify(d.id, true)} size="lg">
                Approve Doctor
              </Button>
            </CardContent>
          </Card>
        ))
      )}

      <h2 className="text-2xl font-bold mt-12">All Doctors</h2>
      {doctors.map((d) => (
        <Card key={d.id}>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold">{d.fullName}</p>
              <Badge variant={d.verified ? "success" : "warning"}>
                {d.verified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            {d.verified ? (
              <Button variant="danger" size="sm" onClick={() => verify(d.id, false)}>
                Revoke
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
