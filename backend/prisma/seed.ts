import { PrismaClient, ProcessType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('demo123456', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@saarthi.ai' },
    update: {},
    create: {
      email: 'demo@saarthi.ai',
      password: hashedPassword,
      name: 'Demo User',
      language_preference: 'en',
    },
  });

  const processTypes: ProcessType[] = [
    'COMPANY_REGISTRATION',
    'PAN_REGISTRATION',
    'PASSPORT_APPLICATION',
  ];

  for (const processType of processTypes) {
    const existingChat = await prisma.chat.findFirst({
      where: {
        user_id: demoUser.id,
        process_type: processType,
      },
      select: { id: true },
    });

    const chat =
      existingChat ??
      (await prisma.chat.create({
        data: {
          user_id: demoUser.id,
          title: `${processType.replace(/_/g, ' ').toLowerCase()} - demo`,
          process_type: processType,
        },
      }));

    const hasWelcomeMessage = await prisma.message.findFirst({
      where: {
        chat_id: chat.id,
        role: 'assistant',
      },
      select: { id: true },
    });

    if (!hasWelcomeMessage) {
      await prisma.message.create({
        data: {
          chat_id: chat.id,
          role: 'assistant',
          content: `Namaste! I'm Saarthi AI. I can help you with ${processType
            .replace(/_/g, ' ')
            .toLowerCase()}. What would you like to know?`,
          metadata: { intent: processType.toLowerCase() },
        },
      });
    }
  }

  await prisma.consent.createMany({
    data: [
      {
        user_id: demoUser.id,
        consent_type: 'DATA_PROCESSING',
        ip_address: '127.0.0.1',
      },
      {
        user_id: demoUser.id,
        consent_type: 'AI_ANALYSIS',
        ip_address: '127.0.0.1',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully for:', demoUser.email);
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
