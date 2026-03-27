import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiAnalysis, Severity } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface AnalyseComplaintParams {
  images?: string[]; // base64
  voiceTranscript?: string;
  textDescription?: string;
  locationAddress?: string;
  city: string;
  state: string;
  ward?: string;
  userLanguage?: string;
  lat?: number;
  lng?: number;
}

interface VerifyResolutionParams {
  originalPhotos: string[]; // base64
  resolutionPhoto: string; // base64
  issueType: string;
}

export async function analyseComplaint(
  params: AnalyseComplaintParams
): Promise<GeminiAnalysis> {
  const {
    images = [],
    voiceTranscript = "",
    textDescription = "",
    locationAddress = "",
    city,
    state,
    ward = "",
    userLanguage = "English",
    lat = 0,
    lng = 0,
  } = params;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Available on this API key; fast + free tier
  });

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `You are NagarSeva AI — a smart civic complaint router for India.

A citizen from ${city}, ${state} has submitted a complaint.

Location: ${locationAddress}
GPS: ${lat}, ${lng}
Ward: ${ward}
Today's Date: ${today}
Description: ${textDescription || "Not provided"}
Voice Note Transcript: ${voiceTranscript || "Not provided"}
Number of images attached: ${images.length}

Your tasks:
1. Analyse all images and text to identify the exact civic issue type
2. Assess severity: Low / Medium / High / Critical
3. Check if the complaint appears genuine or fraudulent:
   - Look for stock photos, AI-generated images, irrelevant content
   - Check if location seems plausible for this issue
   - Identify if description matches images
4. Based on your knowledge of Indian government departments, determine the CORRECT government department responsible for resolving this issue in ${city}, ${state}, India:
   - Official department name (e.g., "Public Works Department (PWD) Mumbai West")
   - Official email address (use realistic format like dept@mcgm.gov.in)
   - Phone number (use realistic Indian format)
   - Website
5. Write a formal, professional complaint email in English
6. Write the SAME email in ${userLanguage} language (if not English), properly translated
7. Return ONLY clean JSON with NO markdown, no preamble, no code blocks

Return exactly this JSON structure:
{
  "issue_type": "specific issue type",
  "severity": "Low|Medium|High|Critical",
  "is_genuine": true,
  "fraud_indicators": [],
  "department": "department name",
  "dept_email": "email@example.gov.in",
  "dept_phone": "022-12345678",
  "dept_website": "example.gov.in",
  "search_confidence": 0.85,
  "draft_email": {
    "subject": "formal subject line",
    "body": "formal complaint email body"
  },
  "draft_email_local": {
    "subject": "subject in ${userLanguage}",
    "body": "body in ${userLanguage}"
  },
  "summary": "brief summary of the issue",
  "suggested_resolution_days": 14
}`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt },
  ];

  // Add images
  for (const base64 of images.slice(0, 5)) {
    parts.push({
      inlineData: {
        data: base64,
        mimeType: "image/jpeg",
      },
    });
  }

  let text = "";
  try {
    const result = await model.generateContent(parts);
    text = result.response.text();
  } catch (geminiErr) {
    console.error("[Gemini] generateContent error:", geminiErr);
    throw geminiErr;
  }

  // Clean JSON (remove markdown fences if present)
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as GeminiAnalysis;
  } catch {
    // Fallback if Gemini doesn't return valid JSON
    return {
      issue_type: "General Civic Issue",
      severity: "Medium" as Severity,
      is_genuine: true,
      fraud_indicators: [],
      department: `Municipal Corporation of ${city}`,
      dept_email: `complaints@municipal.gov.in`,
      dept_phone: "1916",
      dept_website: "municipal.gov.in",
      search_confidence: 0.5,
      draft_email: {
        subject: `Complaint regarding civic issue in ${city}`,
        body: `Dear Sir/Madam,\n\nI am writing to formally report a civic issue in ${city}, ${state}.\n\nLocation: ${locationAddress}\n\nDescription: ${textDescription}\n\nKindly take immediate action to resolve this issue.\n\nYours sincerely,\nConcerned Citizen`,
      },
      draft_email_local: {
        subject: `${city} में नागरिक समस्या की शिकायत`,
        body: `माननीय महोदय/महोदया,\n\nमैं ${city}, ${state} में एक नागरिक समस्या की सूचना देने के लिए लिख रहा हूँ।\n\nस्थान: ${locationAddress}\n\nविवरण: ${textDescription}\n\nकृपया इस समस्या का समाधान करें।\n\nसधन्यवाद,\nसंबंधित नागरिक`,
      },
      summary: textDescription?.slice(0, 100) || "Civic complaint submitted",
      suggested_resolution_days: 14,
    };
  }
}

export async function verifyResolution(
  params: VerifyResolutionParams
): Promise<{ verified: boolean; confidence: number; reason: string }> {
  const { originalPhotos, resolutionPhoto, issueType } = params;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are NagarSeva AI — verifying if a civic complaint has been resolved.

Issue Type: ${issueType}

You have been provided:
- ${originalPhotos.length} original complaint photo(s)
- 1 resolution photo (the last image)

Please verify:
1. Does the resolution photo show that the ${issueType} has been fixed?
2. Is the resolution in the same location as the original complaint?
3. How confident are you that this complaint is genuinely resolved?

Return ONLY clean JSON:
{
  "verified": true/false,
  "confidence": 0.0-1.0,
  "reason": "explanation"
}`;

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: prompt },
    ...originalPhotos.slice(0, 3).map((img) => ({
      inlineData: { data: img, mimeType: "image/jpeg" as const },
    })),
    {
      inlineData: { data: resolutionPhoto, mimeType: "image/jpeg" },
    },
  ];

  const result = await model.generateContent(parts);
  const text = result.response.text();
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return { verified: false, confidence: 0.5, reason: "Unable to verify automatically" };
  }
}

export async function transcribeVoice(audioBase64: string, mimeType = "audio/webm"): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Transcribe this audio recording of a civic complaint made by an Indian citizen.
The recording may be in any Indian language (Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Punjabi, Kannada, Malayalam, Odia, Urdu, or English).
Please:
1. Transcribe what is said
2. Translate it to English
3. Return ONLY a JSON object: { "transcript": "original in native language", "english": "English translation" }`;

  try {
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: audioBase64, mimeType } },
    ]);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.english || parsed.transcript || "";
  } catch {
    return "";
  }
}
