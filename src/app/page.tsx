import Link from "next/link";
import { Heart, Shield, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center space-y-6 py-12">
        <div className="flex justify-center">
          <Heart className="h-20 w-20 text-teal-700 fill-teal-100" aria-hidden />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 max-w-3xl mx-auto">
          Your Trusted Digital Healthcare Platform
        </h1>
        <p className="text-xl text-slate-700 max-w-2xl mx-auto">
          Book on-site, phone, or video consultations with verified doctors.
          Designed for clarity, accessibility, and peace of mind.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/register">
            <Button size="lg">Register as Patient</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield,
            title: "Secure & Private",
            text: "Encrypted sessions, role-based access, and masked phone consultations.",
          },
          {
            icon: Users,
            title: "Family Profiles",
            text: "Manage appointments for yourself and linked family members.",
          },
          {
            icon: Video,
            title: "Flexible Consultations",
            text: "Choose on-site clinic visits, phone calls, or secure video meetings.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="space-y-4 text-center">
              <item.icon className="h-12 w-12 mx-auto text-teal-700" />
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="text-base text-slate-700">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="bg-teal-800 text-white rounded-2xl p-8 md:p-12 text-center space-y-4">
        <h2 className="text-white text-2xl md:text-3xl">Demo Accounts</h2>
        <p className="text-lg text-teal-100">
          Patient: patient@healthcare.com · Doctor: dr.sharma@healthcare.com · Admin: admin@healthcare.com
        </p>
        <p className="text-lg text-teal-100">Password: Password123!</p>
      </section>
    </div>
  );
}
