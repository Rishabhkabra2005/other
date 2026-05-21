"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Stethoscope, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SPECIALIZATION_LABELS } from "@/lib/constants";
import { Specialization } from "@prisma/client";

interface Analytics {
  users: {
    patients: number;
    doctors: number;
    verifiedDoctors: number;
    pendingVerification: number;
  };
  appointments: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    byMode: { mode: string; _count: number }[];
  };
  topSpecializations: { specialization: Specialization; _count: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) {
    return <p className="text-lg text-center py-12">Loading analytics...</p>;
  }

  const stats = [
    { label: "Patients", value: data.users.patients, icon: Users, color: "text-blue-700" },
    { label: "Doctors", value: data.users.doctors, icon: Stethoscope, color: "text-teal-700" },
    { label: "Appointments", value: data.appointments.total, icon: Calendar, color: "text-purple-700" },
    { label: "Completed", value: data.appointments.completed, icon: CheckCircle, color: "text-green-700" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1>Admin Overview</h1>
          <p className="text-lg text-slate-700 mt-2">System analytics and moderation tools.</p>
        </div>
        <Link href="/admin/verification">
          <Button variant="outline">
            {data.users.pendingVerification} Pending Verifications
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4">
              <s.icon className={`h-12 w-12 ${s.color}`} />
              <div>
                <p className="text-base text-slate-600">{s.label}</p>
                <p className="text-3xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Appointment Breakdown</CardTitle>
            <ul className="space-y-2 text-base">
              <li>Pending: <strong>{data.appointments.pending}</strong></li>
              <li>Cancelled: <strong>{data.appointments.cancelled}</strong></li>
              {data.appointments.byMode.map((m) => (
                <li key={m.mode}>
                  {m.mode}: <strong>{m._count}</strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardTitle className="mb-4">Top Specializations</CardTitle>
            <ul className="space-y-2 text-base">
              {data.topSpecializations.map((s) => (
                <li key={s.specialization}>
                  {SPECIALIZATION_LABELS[s.specialization]}: <strong>{s._count}</strong>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/verification">
          <Button>Doctor Verification Queue</Button>
        </Link>
        <Link href="/admin/moderation">
          <Button variant="secondary">Moderation</Button>
        </Link>
      </div>
    </div>
  );
}
