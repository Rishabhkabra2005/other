import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LEGACY_PREFIX = "NMC-LEGACY-";

function nextLegacyRegistrationNumber(existingNumbers: string[]): string {
  const maxSuffix = existingNumbers.reduce((max, value) => {
    if (!value.startsWith(LEGACY_PREFIX)) return max;
    const suffix = Number.parseInt(value.slice(LEGACY_PREFIX.length), 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${LEGACY_PREFIX}${String(maxSuffix + 1).padStart(3, "0")}`;
}

/**
 * Backfills legacy doctor rows that pre-date council self-registration:
 * assigns unique NMC-LEGACY-### numbers and marks them APPROVED.
 */
export async function syncLegacyDoctorRecords(): Promise<number> {
  const legacyDoctors = await prisma.doctor.findMany({
    where: { medicalRegistrationNumber: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (legacyDoctors.length === 0) {
    return 0;
  }

  const assignedLegacyNumbers = await prisma.doctor.findMany({
    where: { medicalRegistrationNumber: { startsWith: LEGACY_PREFIX } },
    select: { medicalRegistrationNumber: true },
  });

  const usedNumbers = assignedLegacyNumbers
    .map((row) => row.medicalRegistrationNumber)
    .filter((value): value is string => Boolean(value));

  let updatedCount = 0;

  for (const doctor of legacyDoctors) {
    let registrationNumber = nextLegacyRegistrationNumber(usedNumbers);
    while (usedNumbers.includes(registrationNumber)) {
      usedNumbers.push(registrationNumber);
      registrationNumber = nextLegacyRegistrationNumber(usedNumbers);
    }
    usedNumbers.push(registrationNumber);

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        medicalRegistrationNumber: registrationNumber,
        verificationStatus: "APPROVED",
        verified: true,
      } as Prisma.DoctorUpdateInput,
    });

    updatedCount += 1;
  }

  return updatedCount;
}
