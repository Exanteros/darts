import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');

    try {
      const files = await readdir(uploadsDir);
      const imageFiles = files.filter(file =>
        file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      // Return URLs pointing to the API route for serving
      const imageUrls = imageFiles.map(file => `/api/uploads/logos/${file}`);

      return NextResponse.json({ images: imageUrls });
    } catch (error) {
      // Directory doesn't exist or is empty
      return NextResponse.json({ images: [] });
    }
  } catch (error) {
    console.error('Error fetching uploaded images:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role === 'ADMIN';
    if (!isAdmin) {
      const access = await prisma.tournamentAccess.findFirst({
        where: { userId: session.userId }
      });
      if (!access) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Check if image is still being used in tournament settings
    const settings = await prisma.tournamentSettings.findUnique({
      where: { id: 'default' },
    });

    if (settings) {
      const mainLogo = (settings as any).mainLogo;
      const sponsorLogos = (settings as any).sponsorLogos ? JSON.parse((settings as any).sponsorLogos) : [];
      const backgroundImage = (settings as any).backgroundImage;

      if (mainLogo === imageUrl || backgroundImage === imageUrl || sponsorLogos.includes(imageUrl)) {
        return NextResponse.json({
          error: 'Bild wird noch verwendet',
          message: 'Das Bild kann nicht gelöscht werden, da es noch in den Turnier-Einstellungen verwendet wird.'
        }, { status: 400 });
      }
    }

    // Delete the file
    const filePath = join(process.cwd(), 'public', 'uploads', 'logos', filename);

    try {
      await unlink(filePath);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json({ error: 'Datei konnte nicht gelöscht werden' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
