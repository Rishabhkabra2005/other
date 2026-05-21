import { ConsultationMode } from "@prisma/client";

export function parseModes(modes: unknown): ConsultationMode[] {
  if (Array.isArray(modes)) {
    return modes.filter((m): m is ConsultationMode =>
      typeof m === "string" && ["ON_SITE", "PHONE", "VIDEO"].includes(m)
    );
  }
  return [];
}

export function parseLanguages(languages: unknown): string[] {
  if (Array.isArray(languages)) {
    return languages.filter((l): l is string => typeof l === "string");
  }
  return [];
}

export function doctorHasMode(modes: unknown, mode: ConsultationMode): boolean {
  return parseModes(modes).includes(mode);
}
