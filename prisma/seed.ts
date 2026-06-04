import { PrismaClient, ConsultationMode, Specialization } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function slotTimes() {
  return [
    { start: "09:00", end: "09:30" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "14:00", end: "14:30" },
    { start: "15:00", end: "15:30" },
    { start: "16:00", end: "16:30" },
  ];
}

async function main() {
  // Delete child tables before parents (Prescription → Appointment FK on appointmentId).
  await prisma.$transaction([
    prisma.prescription.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.review.deleteMany(),
    prisma.availabilitySlot.deleteMany(),
    prisma.clinic.deleteMany(),
    prisma.familyMember.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.otpVerification.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@healthcare.com",
      passwordHash,
      role: "ADMIN",
      otpVerified: true,
      phone: "9000000001",
    },
  });

  const patientUser = await prisma.user.create({
    data: {
      email: "patient@healthcare.com",
      passwordHash,
      role: "PATIENT",
      otpVerified: true,
      phone: "9876543210",
      patient: {
        create: {
          fullName: "Ramesh Kumar",
          age: 68,
          gender: "MALE",
          height: 170,
          weight: 72,
          bloodGroup: "B+",
          allergies: "Penicillin",
          existingDiseases: "Type 2 Diabetes, Hypertension",
          emergencyContact: "Priya Kumar - 9876543211",
          insuranceInfo: "Star Health Policy #SH-88291",
          isActive: true,
        },
      },
    },
    include: { patient: true },
  });

  const doctorsData: {
    email: string;
    fullName: string;
    qualification: string;
    experienceYears: number;
    specialization: Specialization;
    fee: number;
    languages: string[];
    modes: ConsultationMode[];
    verified: boolean;
    rating: number;
    reviews: number;
  }[] = [
    {
      email: "dr.sharma@healthcare.com",
      fullName: "Dr. Anil Sharma",
      qualification: "MBBS, MD (General Medicine)",
      experienceYears: 22,
      specialization: "GENERAL_PHYSICIAN",
      fee: 500,
      languages: ["Hindi", "English"],
      modes: ["ON_SITE", "PHONE", "VIDEO"],
      verified: true,
      rating: 4.8,
      reviews: 124,
    },
    {
      email: "dr.patel@healthcare.com",
      fullName: "Dr. Meera Patel",
      qualification: "MBBS, DM (Cardiology)",
      experienceYears: 18,
      specialization: "CARDIOLOGY",
      fee: 1200,
      languages: ["Hindi", "English", "Gujarati"],
      modes: ["ON_SITE", "VIDEO"],
      verified: true,
      rating: 4.9,
      reviews: 89,
    },
    {
      email: "dr.singh@healthcare.com",
      fullName: "Dr. Rajesh Singh",
      qualification: "MBBS, MS (Orthopaedics)",
      experienceYears: 15,
      specialization: "ORTHOPAEDICS",
      fee: 900,
      languages: ["Hindi", "English", "Punjabi"],
      modes: ["ON_SITE", "PHONE"],
      verified: true,
      rating: 4.6,
      reviews: 67,
    },
    {
      email: "dr.reddy@healthcare.com",
      fullName: "Dr. Lakshmi Reddy",
      qualification: "MBBS, MD (Dermatology)",
      experienceYears: 12,
      specialization: "DERMATOLOGY",
      fee: 700,
      languages: ["English", "Telugu", "Hindi"],
      modes: ["ON_SITE", "PHONE", "VIDEO"],
      verified: true,
      rating: 4.7,
      reviews: 52,
    },
    {
      email: "dr.khan@healthcare.com",
      fullName: "Dr. Fatima Khan",
      qualification: "MBBS, MD (Psychiatry)",
      experienceYears: 10,
      specialization: "PSYCHIATRY",
      fee: 800,
      languages: ["Hindi", "English", "Urdu"],
      modes: ["PHONE", "VIDEO"],
      verified: false,
      rating: 4.5,
      reviews: 31,
    },
  ];

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash,
        role: "DOCTOR",
        otpVerified: true,
        phone: "9000000" + Math.floor(Math.random() * 900 + 100),
        doctor: {
          create: {
            fullName: doc.fullName,
            qualification: doc.qualification,
            experienceYears: doc.experienceYears,
            specialization: doc.specialization,
            consultationFee: doc.fee,
            languages: doc.languages,
            modes: doc.modes,
            verified: doc.verified,
            averageRating: doc.rating,
            reviewCount: doc.reviews,
            bio: `Experienced ${doc.specialization.replace(/_/g, " ").toLowerCase()} specialist committed to elderly-friendly care.`,
          },
        },
      },
      include: { doctor: true },
    });

    if (!user.doctor) {
      throw new Error(`Doctor profile was not created for ${doc.email}`);
    }
    const doctorId = user.doctor.id;

    if (doc.modes.includes("ON_SITE")) {
      await prisma.clinic.createMany({
        data: [
          {
            doctorId,
            name: `${doc.fullName.split(" ").pop()} Care Clinic`,
            address: "42 Health Avenue, Sector 12",
            city: "New Delhi",
            latitude: 28.6139,
            longitude: 77.209,
          },
          {
            doctorId,
            name: "City Medical Center",
            address: "15 Ring Road, Lajpat Nagar",
            city: "New Delhi",
            latitude: 28.5672,
            longitude: 77.2431,
          },
        ],
      });
    }

    const slotRows: {
      doctorId: string;
      date: Date;
      startTime: string;
      endTime: string;
      mode: ConsultationMode;
      booked: boolean;
      isBlocked: boolean;
    }[] = [];

    for (let day = 0; day < 14; day++) {
      const date = addDays(day);
      for (const mode of doc.modes) {
        for (const t of slotTimes()) {
          slotRows.push({
            doctorId,
            date,
            startTime: t.start,
            endTime: t.end,
            mode,
            booked: false,
            isBlocked: false,
          });
        }
      }
    }

    await prisma.availabilitySlot.createMany({ data: slotRows });
  }

  const patient = patientUser.patient!;
  const firstDoctor = await prisma.doctor.findFirst({ where: { verified: true } });
  if (firstDoctor) {
    await prisma.review.create({
      data: {
        patientId: patient.id,
        doctorId: firstDoctor.id,
        rating: 5,
        comment: "Very patient and explained everything clearly.",
      },
    });

    const slot = await prisma.availabilitySlot.findFirst({
      where: { doctorId: firstDoctor.id, booked: false },
      orderBy: { date: "asc" },
    });

    if (slot) {
      const scheduledAt = new Date(slot.date);
      const [h, m] = slot.startTime.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: firstDoctor.id,
          slotId: slot.id,
          mode: slot.mode,
          status: "COMPLETED",
          scheduledAt,
        },
      });

      await prisma.availabilitySlot.update({
        where: { id: slot.id },
        data: { booked: true },
      });

      await prisma.prescription.create({
        data: {
          appointmentId: appointment.id,
          patientId: patient.id,
          doctorId: firstDoctor.id,
          dateWritten: new Date(),
          doctorNotes:
            "Take medications after meals. Monitor blood sugar daily. Return if symptoms worsen.",
          medications: [
            {
              name: "Metformin",
              dosage: "500mg",
              frequency: "Twice daily",
              duration: "30 days",
            },
            {
              name: "Amlodipine",
              dosage: "5mg",
              frequency: "Once daily",
              duration: "30 days",
            },
          ],
        },
      });
    }
  }

  console.log("Seed completed.");
  console.log("Admin: admin@healthcare.com / Password123!");
  console.log("Patient: patient@healthcare.com / Password123!");
  console.log("Doctors: dr.*@healthcare.com / Password123!");
  console.log("Admin user id:", adminUser.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
