import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    worker: true,
    timestamp: Date.now(),
  });
}
