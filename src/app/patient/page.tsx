"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface Profile {
  fullName: string;
  familyMembers: { id: string; fullName: string; relation: string }[];
}

interface Appointment {
  id: string;
  status: string;
  mode: string;
  scheduledAt: string;
  doctor: { fullName: string; specialization: string };
}

export default function PatientDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/patients/profile").then((r) => r.json()).then(setProfile);
    fetch("/api/appointments").then((r) => r.json()).then(setAppointments);
  }, []);

  const upcoming = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1>Welcome{profile ? `, ${profile.fullName}` : ""}</h1>
        <p className="text-lg text-slate-700 mt-2">Manage your health appointments and family profiles.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/patient/doctors">
          <Card className="hover:border-teal-500 cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <Search className="h-10 w-10 text-teal-700" />
              <span className="text-lg font-bold">Find Doctors</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/appointments">
          <Card className="hover:border-teal-500 cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <Calendar className="h-10 w-10 text-teal-700" />
              <span className="text-lg font-bold">My Appointments</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/family">
          <Card className="hover:border-teal-500 cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <Users className="h-10 w-10 text-teal-700" />
              <span className="text-lg font-bold">Family Members</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/prescriptions">
          <Card className="hover:border-teal-500 cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 py-6">
              <FileText className="h-10 w-10 text-teal-700" />
              <span className="text-lg font-bold">Prescriptions</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardContent>
          <CardTitle className="mb-4">Upcoming Appointments</CardTitle>
          {upcoming.length === 0 ? (
            <p className="text-base text-slate-700">No upcoming appointments.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 pb-4 last:border-0">
                  <div>
                    <p className="text-lg font-bold">{a.doctor.fullName}</p>
                    <p className="text-base text-slate-700">{formatDate(a.scheduledAt)} · {a.mode}</p>
                  </div>
                  <Badge variant={a.status === "CONFIRMED" ? "success" : "warning"}>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link href="/patient/doctors" className="inline-block mt-6">
            <Button>Book New Appointment</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
