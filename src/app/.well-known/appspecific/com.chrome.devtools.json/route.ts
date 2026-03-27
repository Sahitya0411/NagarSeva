import { NextResponse } from "next/server";

// Suppress Chrome DevTools 146+ automatic request for this file
// Without this, Next.js logs a 404 which is harmless but noisy
export async function GET() {
  return NextResponse.json({
    workspace: "NagarSeva",
    version: "1.0",
  });
}
