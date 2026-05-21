"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Heart, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const role = session?.user?.role;
  const home =
    role === "ADMIN"
      ? "/admin"
      : role === "DOCTOR"
        ? "/doctor"
        : role === "PATIENT"
          ? "/patient"
          : "/";

  const links =
    role === "PATIENT"
      ? [
          { href: "/patient", label: "Dashboard" },
          { href: "/patient/doctors", label: "Find Doctors" },
          { href: "/patient/appointments", label: "Appointments" },
        ]
      : role === "DOCTOR"
        ? [
            { href: "/doctor", label: "Dashboard" },
            { href: "/doctor/slots", label: "Time Slots" },
            { href: "/doctor/patients", label: "Patients" },
          ]
        : role === "ADMIN"
          ? [
              { href: "/admin", label: "Overview" },
              { href: "/admin/verification", label: "Verification" },
              { href: "/admin/moderation", label: "Moderation" },
            ]
          : [
              { href: "/login", label: "Login" },
              { href: "/register", label: "Register" },
            ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-200 bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href={home} className="flex items-center gap-3 text-teal-800">
          <Heart className="h-8 w-8 fill-teal-700 text-teal-700" aria-hidden />
          <span className="text-xl font-bold">CareConnect Health</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>

        <div
          className={`${
            open ? "flex" : "hidden"
          } absolute left-0 right-0 top-full flex-col gap-4 border-b-2 border-slate-200 bg-white p-6 lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:p-0`}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-lg font-semibold text-slate-800 hover:text-teal-700"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <span className="text-base text-slate-600">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
