export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth, jsonError, jsonSuccess } from "@/lib/api-auth";

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_BASE64_LENGTH = 14 * 1024 * 1024; // ~10 MB raw image

const HWR_PROMPT =
  "You are an expert pharmacist and medical scribe specializing in reading difficult, messy, and illegible doctor handwriting. Carefully perform advanced handwriting recognition (HWR) on this image. Extract any recognizable medicines, diagnostics, clinical shorthand, or instructions, and format them into a highly readable, clear bulleted summary for a patient.";

const ACCEPTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function POST(request: Request) {
  const { error } = await requireAuth(["PATIENT"]);
  if (error) return error;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonError("Handwriting analysis is not configured. Please contact support.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body");
  }

  const payload = body as { image?: unknown; mimeType?: unknown };
  const image = typeof payload.image === "string" ? payload.image.trim() : "";
  const mimeTypeRaw = typeof payload.mimeType === "string" ? payload.mimeType.trim() : "";
  const mimeType = mimeTypeRaw === "image/jpg" ? "image/jpeg" : mimeTypeRaw;

  if (!image) {
    return jsonError("Image data is required.");
  }

  if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
    return jsonError("Only PNG, JPG, and JPEG images are supported.");
  }

  if (image.length > MAX_BASE64_LENGTH) {
    return jsonError("Image must be 10 MB or smaller.");
  }

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
          {
            role: "user",
            content: [
              { type: "text", text: HWR_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("Groq HWR API error:", groqRes.status, errBody);
      return jsonError("Unable to analyze handwritten notes right now. Please try again later.", 502);
    }

    const data = (await groqRes.json()) as GroqChatResponse;

    let aiText = "";
    if (data?.choices?.[0]?.message?.content) {
      aiText = data.choices[0].message.content;
    }

    const summary = aiText.trim();
    if (!summary) {
      return jsonError("No readable text was extracted. Please try a clearer photo.", 502);
    }

    return jsonSuccess({ summary });
  } catch (error) {
    console.error(
      "🔴 ANALYZE HANDWRITTEN API CRASHED:",
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
