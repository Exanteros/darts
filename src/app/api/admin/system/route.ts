import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    // Hole System-Einstellungen aus der Datenbank
    const systemSettings = await prisma.systemSettings.findFirst();

    if (!systemSettings) {
      // Standard-Einstellungen zurückgeben
      return NextResponse.json({
        success: true,
        settings: {
          websocketTimeout: 30000,
          cacheTimeout: 15,
          maxConnections: 10,
          logLevel: 'info',
          monitoringInterval: 30
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        websocketTimeout: systemSettings.websocketTimeout,
        cacheTimeout: systemSettings.cacheTimeout,
        maxConnections: systemSettings.maxConnections,
        logLevel: systemSettings.logLevel,
        monitoringInterval: systemSettings.monitoringInterval,
        stripeEnabled: systemSettings.stripeEnabled,
        stripePublishableKey: systemSettings.stripePublishableKey,
        stripeSecretKey: systemSettings.stripeSecretKey,
        stripeWebhookSecret: systemSettings.stripeWebhookSecret
      }
    });

  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Laden der System-Einstellungen'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        message: 'Nicht authentifiziert'
      }, { status: 401 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Administrator-Berechtigung erforderlich'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      websocketTimeout,
      cacheTimeout,
      maxConnections,
      logLevel,
      monitoringInterval,
      stripeEnabled,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret
    } = body;

    const systemSettings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        websocketTimeout: websocketTimeout || 30000,
        cacheTimeout: cacheTimeout || 15,
        maxConnections: maxConnections || 10,
        logLevel: logLevel || 'info',
        monitoringInterval: monitoringInterval || 30,
        stripeEnabled: stripeEnabled !== undefined ? stripeEnabled : false,
        stripePublishableKey: stripePublishableKey || null,
        stripeSecretKey: stripeSecretKey || null,
        stripeWebhookSecret: stripeWebhookSecret || null,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        websocketTimeout: websocketTimeout || 30000,
        cacheTimeout: cacheTimeout || 15,
        maxConnections: maxConnections || 10,
        logLevel: logLevel || 'info',
        monitoringInterval: monitoringInterval || 30,
        stripeEnabled: stripeEnabled !== undefined ? stripeEnabled : false,
        stripePublishableKey: stripePublishableKey || null,
        stripeSecretKey: stripeSecretKey || null,
        stripeWebhookSecret: stripeWebhookSecret || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'System-Einstellungen gespeichert',
      settings: systemSettings
    });

  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Speichern der System-Einstellungen'
    }, { status: 500 });
  }
}
