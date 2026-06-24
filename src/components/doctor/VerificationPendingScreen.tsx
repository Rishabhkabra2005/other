"use client";

import { Clock3, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";

export function VerificationPendingScreen() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-amber-200 shadow-lg">
        <CardContent className="py-10 px-6 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock3 className="h-8 w-8" aria-hidden />
          </div>
          <CardTitle className="text-2xl text-amber-950">Verification In Progress</CardTitle>
          <p className="text-lg text-slate-700 leading-relaxed max-w-xl mx-auto">
            Verification in progress. Thank you for your patience while we confirm your clinical
            credentials against the medical registry database. This usually takes a few moments.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-teal-800 font-medium pt-2">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>National Medical Council registry cross-check initiated</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
