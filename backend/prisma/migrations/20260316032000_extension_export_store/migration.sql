-- CreateTable
CREATE TABLE `extension_exports` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `process_type` ENUM('PASSPORT_APPLICATION') NOT NULL,
    `portal_key` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `extension_exports_user_id_process_type_portal_key_key`(`user_id`, `process_type`, `portal_key`),
    INDEX `extension_exports_user_id_idx`(`user_id`),
    INDEX `extension_exports_process_type_idx`(`process_type`),
    INDEX `extension_exports_portal_key_idx`(`portal_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `extension_exports` ADD CONSTRAINT `extension_exports_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;