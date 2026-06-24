import { Suspense } from "react";
import DoctorLoginContent from "./DoctorLoginContent";

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto text-center py-12 text-slate-600">Loading…</div>
      }
    >
      <DoctorLoginContent />
    </Suspense>
  );
}
