-- CreateTable
CREATE TABLE `PaymentEntry` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerId` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `paymentMode` VARCHAR(191) NOT NULL,
    `particulars` VARCHAR(191) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentEntry_ledgerId_idx`(`ledgerId`),
    INDEX `PaymentEntry_entryDate_idx`(`entryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PaymentEntry` ADD CONSTRAINT `PaymentEntry_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
