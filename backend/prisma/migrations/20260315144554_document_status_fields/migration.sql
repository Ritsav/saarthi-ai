-- AlterTable
ALTER TABLE `documents` ADD COLUMN `processed_at` DATETIME(3) NULL,
    ADD COLUMN `processing_error` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `documents_status_idx` ON `documents`(`status`);
