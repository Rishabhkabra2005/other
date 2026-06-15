export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";
import { prescriptionSummarizeSchema } from "@/lib/validations";

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an empathetic, friendly family health assistant. Translate the provided medical prescription into simple, everyday, human language for the patient. Explain what each medicine generally does in friendly terms, lay out the schedule clearly, and break down the doctor's instructions into practical, comforting bullet points. Avoid complex medical jargon. Speak directly to the patient.`;

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildUserMessage(
  medications: { name: string; dosage: string; frequency: string; duration: string }[],
  doctorNotes?: string
): string {
  const medList = medications
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} — Dosage: ${m.dosage}, Frequency: ${m.frequency}, Duration: ${m.duration}`
    )
    .join("\n");

  const notes = doctorNotes?.trim()
    ? `\n\nDoctor's notes and instructions:\n${doctorNotes.trim()}`
    : "\n\nDoctor's notes: None provided.";

  return `Please explain this prescription in simple, comforting language:\n\nMedications:\n${medList}${notes}\n\nFormat your response in clear markdown with headings and bullet points.`;
}

export async function POST(request: Request) {
  const { error } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError("AI summary is not configured. Please contact support.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const parsed = prescriptionSummarizeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid prescription data");
  }

  const { medications, doctorNotes } = parsed.data;

  try {
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(medications, doctorNotes) },
        ],
        temperature: 0.6,
        max_tokens: 1200,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errBody);
      return jsonError("Unable to generate summary right now. Please try again later.", 502);
    }

    const data = (await groqRes.json()) as GroqChatResponse;

    let aiText = "";
    if (data?.choices?.[0]?.message?.content) {
      aiText = data.choices[0].message.content;
    }

    const summary = aiText.trim();
    if (!summary) {
      return jsonError("No summary was returned. Please try again.", 502);
    }

    return jsonSuccess({ summary });
  } catch (error) {
    console.error(
      "🔴 PRESCRIPTION SUMMARIZE API CRASHED:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      {
        error: `System Error: ${error instanceof Error ? error.message : "Request failed"}`,
      },
      { status: 500 }
    );
  }
}
