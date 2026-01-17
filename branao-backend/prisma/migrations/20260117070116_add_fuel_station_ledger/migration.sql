-- CreateTable
CREATE TABLE `FuelStation` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `contactNo` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FuelStation_name_key`(`name`),
    INDEX `FuelStation_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuelStationLedger` (
    `id` VARCHAR(191) NOT NULL,
    `fuelStationId` VARCHAR(191) NOT NULL,
    `siteId` VARCHAR(191) NOT NULL,
    `siteExpenseId` VARCHAR(191) NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `through` VARCHAR(191) NULL,
    `purchaseType` ENUM('OWN_VEHICLE', 'RENT_VEHICLE') NOT NULL,
    `vehicleNumber` VARCHAR(191) NOT NULL,
    `vehicleName` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NOT NULL,
    `qty` DECIMAL(12, 3) NOT NULL,
    `rate` DECIMAL(12, 2) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `slipNo` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FuelStationLedger_siteExpenseId_key`(`siteExpenseId`),
    INDEX `FuelStationLedger_fuelStationId_idx`(`fuelStationId`),
    INDEX `FuelStationLedger_siteId_idx`(`siteId`),
    INDEX `FuelStationLedger_entryDate_idx`(`entryDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_fuelStationId_fkey` FOREIGN KEY (`fuelStationId`) REFERENCES `FuelStation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteExpenseId_fkey` FOREIGN KEY (`siteExpenseId`) REFERENCES `SiteExpense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
