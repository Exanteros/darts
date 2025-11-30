import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 401 });
    }

    // Return SMTP settings (without password)
    const settings = {
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT || "",
      user: process.env.SMTP_USER || "",
      from: process.env.SMTP_FROM || "",
      // Never expose the password
      configured: !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM
      ),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching SMTP settings:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der SMTP-Einstellungen" },
      { status: 500 }
    );
  }
}
