import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  text: string;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as TTSRequest;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text required" }, { status: 400 });
    }

    // Using browser's Web Speech API (client-side)
    // Return text for client-side synthesis
    return NextResponse.json({
      success: true,
      text,
      message: "Use client-side speech synthesis",
    });
  } catch (error: any) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: error.message,
      },
      { status: 500 }
    );
  }
}