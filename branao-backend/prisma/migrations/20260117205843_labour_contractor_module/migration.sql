-- CreateTable
CREATE TABLE `LabourContractor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mobile` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabourContract` (
    `id` VARCHAR(191) NOT NULL,
    `contractorId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `agreedAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `agreementUrl` VARCHAR(191) NULL,
    `agreementName` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabourContract_contractorId_siteId_idx`(`contractorId`, `siteId`),
    INDEX `LabourContract_siteId_idx`(`siteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabourPayment` (
    `id` VARCHAR(191) NOT NULL,
    `contractorId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `mode` ENUM('CASH', 'BANK', 'UPI', 'CHEQUE', 'OTHER') NOT NULL DEFAULT 'CASH',
    `refNo` VARCHAR(191) NULL,
    `through` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabourPayment_contractorId_paymentDate_idx`(`contractorId`, `paymentDate`),
    INDEX `LabourPayment_siteId_paymentDate_idx`(`siteId`, `paymentDate`),
    INDEX `LabourPayment_contractId_paymentDate_idx`(`contractId`, `paymentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LabourContract` ADD CONSTRAINT `LabourContract_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `LabourContractor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabourContract` ADD CONSTRAINT `LabourContract_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabourPayment` ADD CONSTRAINT `LabourPayment_contractorId_fkey` FOREIGN KEY (`contractorId`) REFERENCES `LabourContractor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabourPayment` ADD CONSTRAINT `LabourPayment_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabourPayment` ADD CONSTRAINT `LabourPayment_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `LabourContract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
