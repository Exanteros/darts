import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// DELETE /api/admin/tournament/champions/[id] - Löscht einen Champion
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const resolvedParams = await params;

    await prisma.champion.delete({
      where: {
        id: resolvedParams.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAMPION_DELETE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/admin/tournament/champions/[id] - Bearbeitet einen Champion
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, tournament, date, avg, checkout, tag, imageUrl, imagePosY, colorClass, iconColor, order } = body;

    const champion = await prisma.champion.update({
      where: {
        id: (await params).id,
      },
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
        order: typeof order === 'number' ? order : undefined,
      },
    });

    return NextResponse.json(champion);
  } catch (error) {
    console.error("[CHAMPION_UPDATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}