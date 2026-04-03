import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/champions
export async function GET() {
  try {
    const champions = await prisma.champion.findMany({
      orderBy: {
        order: 'asc'
      },
    });

    return NextResponse.json({ success: true, champions });
  } catch (error) {
    console.error("[PUBLIC_CHAMPIONS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}