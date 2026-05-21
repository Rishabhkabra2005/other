"use client";

import Link from "next/link";
import { Building2, Phone, Star, Video } from "lucide-react";
import { ConsultationMode, Specialization } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { SPECIALIZATION_LABELS } from "@/lib/constants";

export interface DoctorCardData {
  id: string;
  fullName: string;
  qualification: string;
  experienceYears: number;
  specialization: Specialization;
  consultationFee: number;
  modes: ConsultationMode[];
  languages: string[];
  averageRating: number;
  reviewCount: number;
  verified: boolean;
}

const modeIcons: Record<ConsultationMode, typeof Building2> = {
  ON_SITE: Building2,
  PHONE: Phone,
  VIDEO: Video,
};

const modeLabels: Record<ConsultationMode, string> = {
  ON_SITE: "On-site",
  PHONE: "Phone",
  VIDEO: "Video",
};

export function DoctorCard({ doctor }: { doctor: DoctorCardData }) {
  return (
    <Card className="flex flex-col h-full hover:border-teal-400 transition-colors">
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{doctor.fullName}</h3>
            <p className="text-base text-slate-700 mt-1">{doctor.qualification}</p>
          </div>
          {doctor.verified && <Badge variant="success">Verified</Badge>}
        </div>

        <p className="text-base font-semibold text-teal-800">
          {SPECIALIZATION_LABELS[doctor.specialization]}
        </p>

        <p className="text-base text-slate-700">
          {doctor.experienceYears} years experience
        </p>

        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span className="text-base font-semibold">
            {doctor.averageRating.toFixed(1)} ({doctor.reviewCount} reviews)
          </span>
        </div>

        <p className="text-lg font-bold text-slate-900">
          Fee: {formatCurrency(doctor.consultationFee)}
        </p>

        <div className="flex flex-wrap gap-2">
          {doctor.modes.map((mode) => {
            const Icon = modeIcons[mode];
            return (
              <span
                key={mode}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-2 text-base text-teal-900 border border-teal-200"
                title={modeLabels[mode]}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {modeLabels[mode]}
              </span>
            );
          })}
        </div>

        <p className="text-base text-slate-600">
          Languages: {doctor.languages.join(", ")}
        </p>

        <Link href={`/patient/book/${doctor.id}`} className="mt-auto">
          <Button className="w-full" size="lg">
            Book Appointment
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
