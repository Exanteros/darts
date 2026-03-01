import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new (require('@prisma/adapter-pg').PrismaPg)(pool);
const prisma = new PrismaClient({ adapter });

async function createAdminUser() {
  const email = 'ced.geissdoerfer@gmail.com';
  const password = 'admin123'; // Temporäres Passwort
  const name = 'Cedric';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ User mit dieser E-Mail existiert bereits:', email);
      console.log('User ID:', existingUser.id);
      console.log('Rolle:', existingUser.role);
      
      // Update to ADMIN if not already
      if (existingUser.role !== 'ADMIN') {
        const updated = await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN' }
        });
        console.log('✅ User wurde zu ADMIN upgegradet!');
      }
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin-User erfolgreich erstellt!');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Passwort:', password);
    console.log('🎭 Rolle:', user.role);
    console.log('🆔 User ID:', user.id);
    console.log('\n⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!');

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Admin-Users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
