import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let tournaments = [];
    if (session.user.role === "ADMIN") {
      tournaments = await prisma.tournament.findMany({ orderBy: { createdAt: "desc" } });
    } else {
      const access = await prisma.tournamentAccess.findMany({
        where: { userId: session.user.id },
        include: { tournament: true }
      });
      tournaments = access.map((a: any) => a.tournament);
    }
    return NextResponse.json(tournaments);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
