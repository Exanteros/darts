import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET /api/admin/tournament/champions - Liest alle Champions aus
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const champions = await prisma.champion.findMany({
      orderBy: {
        order: 'asc'
      },
    });

    return NextResponse.json(champions);

  } catch (error) {
    console.error("[CHAMPIONS_ADMIN_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/tournament/champions - Erstellt einen neuen Champion
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const { name, tournament, date, avg, checkout, tag, imageUrl, imagePosY, colorClass, iconColor, order } = json;

    const champion = await prisma.champion.create({
      data: {
        name,
        tournament,
        date,
        avg,
        checkout,
        tag: tag || null,
        imageUrl: imageUrl || null,
        imagePosY: imagePosY || "50%",
        colorClass: colorClass || "bg-amber-400",
        iconColor: iconColor || "text-amber-500",
        order: order || 0,
      }
    });

    return NextResponse.json(champion, { status: 201 });

  } catch (error) {
    console.error("[CHAMPIONS_ADMIN_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}