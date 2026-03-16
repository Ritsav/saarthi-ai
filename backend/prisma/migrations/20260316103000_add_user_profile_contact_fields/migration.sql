-- AlterTable
ALTER TABLE `users`
  ADD COLUMN `contact_number` VARCHAR(191) NULL,
  ADD COLUMN `home_phone` VARCHAR(191) NULL,
  ADD COLUMN `contact_phone` VARCHAR(191) NULL,
  ADD COLUMN `contact_email` VARCHAR(191) NULL;
