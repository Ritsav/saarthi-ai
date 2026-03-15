import { DocumentStatus, DocumentType, Prisma, PrismaClient, ProcessType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('demo123456', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@saarthi.ai' },
    update: {
      password: hashedPassword,
      name: 'Demo User',
      language_preference: 'en',
    },
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

  const chatsByProcess = new Map<ProcessType, string>();

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

    chatsByProcess.set(processType, chat.id);

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

  const passportChatId = chatsByProcess.get(ProcessType.PASSPORT_APPLICATION) ?? null;

  const citizenshipOcrResult = {
    document_type: 'CITIZENSHIP',
    fields: {
      name_en: 'Nabin Budha',
      name_ne: 'नबिन बुढा',
      citizenship_number: '12-34-56-78901',
      date_of_birth: '1998-10-09',
      issue_date: '2018-05-20',
      issue_district: 'Dolpa',
      father_name: 'Madan Budha',
      mother_name: 'Parbati Budha',
      address: 'Tripureshwor, Kathmandu',
      photo_detected: true,
      signature_detected: true,
    },
    confidence: {
      overall: 0.95,
      per_field: {
        name_en: 0.97,
        citizenship_number: 0.99,
        date_of_birth: 0.94,
        issue_district: 0.91,
      },
    },
  };

  const citizenshipValidationResult = {
    is_valid: true,
    readiness_score: 92,
    fields_present: ['name_en', 'citizenship_number', 'date_of_birth', 'issue_district', 'father_name', 'address'],
    fields_missing: [],
    fields_invalid: [],
    low_confidence_fields: [],
    warnings: [],
    suggestions: [],
  };

  const panOcrResult = {
    document_type: 'PAN_CERTIFICATE',
    fields: {
      pan_number: '123456789',
      registered_name: 'Nabin Budha',
      business_type: 'Individual',
      registration_date: '2020-01-15',
      tax_office: 'Kathmandu',
    },
    confidence: {
      overall: 0.93,
      per_field: {
        pan_number: 0.98,
        registered_name: 0.93,
      },
    },
  };

  const panValidationResult = {
    is_valid: true,
    readiness_score: 88,
    fields_present: ['pan_number', 'registered_name', 'business_type'],
    fields_missing: [],
    fields_invalid: [],
    low_confidence_fields: [],
    warnings: [],
    suggestions: [],
  };

  const passportPhotoOcrResult = {
    document_type: 'PASSPORT_PHOTO',
    fields: {
      face_detected: true,
      face_centered: true,
      background_color: 'white',
      resolution_sufficient: true,
      lighting_quality: 'good',
    },
    confidence: {
      overall: 0.9,
      per_field: {
        face_detected: 0.96,
        face_centered: 0.9,
      },
    },
  };

  const passportPhotoValidationResult = {
    is_valid: true,
    readiness_score: 90,
    fields_present: ['face_detected', 'face_centered', 'background_color', 'resolution_sufficient'],
    fields_missing: [],
    fields_invalid: [],
    low_confidence_fields: [],
    warnings: [],
    suggestions: [],
  };

  const seededDocuments: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
    documentType: DocumentType;
    ocrResult: Prisma.InputJsonValue;
    validationResult: Prisma.InputJsonValue;
  }> = [
    {
      fileName: 'dummy-citizenship-front.jpg',
      filePath: 'seed/dummy-citizenship-front.jpg',
      fileType: 'image/jpeg',
      fileSize: 18234,
      documentType: DocumentType.CITIZENSHIP,
      ocrResult: citizenshipOcrResult,
      validationResult: citizenshipValidationResult,
    },
    {
      fileName: 'dummy-citizenship-back.jpg',
      filePath: 'seed/dummy-citizenship-back.jpg',
      fileType: 'image/jpeg',
      fileSize: 16452,
      documentType: DocumentType.CITIZENSHIP,
      ocrResult: citizenshipOcrResult,
      validationResult: citizenshipValidationResult,
    },
    {
      fileName: 'dummy-pan-certificate.jpg',
      filePath: 'seed/dummy-pan-certificate.jpg',
      fileType: 'image/jpeg',
      fileSize: 19476,
      documentType: DocumentType.PAN_CERTIFICATE,
      ocrResult: panOcrResult,
      validationResult: panValidationResult,
    },
    {
      fileName: 'dummy-passport-photo.jpg',
      filePath: 'seed/dummy-passport-photo.jpg',
      fileType: 'image/jpeg',
      fileSize: 15220,
      documentType: DocumentType.PASSPORT_PHOTO,
      ocrResult: passportPhotoOcrResult,
      validationResult: passportPhotoValidationResult,
    },
  ];

  for (const seeded of seededDocuments) {
    const existing = await prisma.document.findFirst({
      where: {
        user_id: demoUser.id,
        process_type: ProcessType.PASSPORT_APPLICATION,
        file_name: seeded.fileName,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: {
          chat_id: passportChatId,
          file_path: seeded.filePath,
          file_type: seeded.fileType,
          file_size: seeded.fileSize,
          document_type: seeded.documentType,
          status: DocumentStatus.COMPLETED,
          processing_error: null,
          ocr_result: seeded.ocrResult,
          validation_result: seeded.validationResult,
          processed_at: new Date(),
        },
      });
    } else {
      await prisma.document.create({
        data: {
          user_id: demoUser.id,
          chat_id: passportChatId,
          file_path: seeded.filePath,
          file_name: seeded.fileName,
          file_type: seeded.fileType,
          file_size: seeded.fileSize,
          document_type: seeded.documentType,
          process_type: ProcessType.PASSPORT_APPLICATION,
          status: DocumentStatus.COMPLETED,
          ocr_result: seeded.ocrResult,
          validation_result: seeded.validationResult,
          processed_at: new Date(),
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
