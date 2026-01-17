/*
  Warnings:

  - You are about to drop the column `remark` on the `FuelStationLedger` table. All the data in the column will be lost.
  - You are about to alter the column `purchaseType` on the `FuelStationLedger` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- DropForeignKey
ALTER TABLE `FuelStationLedger` DROP FOREIGN KEY `FuelStationLedger_siteExpenseId_fkey`;

-- DropForeignKey
ALTER TABLE `FuelStationLedger` DROP FOREIGN KEY `FuelStationLedger_siteId_fkey`;

-- AlterTable
ALTER TABLE `FuelStationLedger` DROP COLUMN `remark`,
    ADD COLUMN `remarks` VARCHAR(191) NULL,
    MODIFY `through` VARCHAR(191) NULL,
    MODIFY `purchaseType` ENUM('OWN_VEHICLE', 'RENT_VEHICLE') NOT NULL,
    MODIFY `vehicleName` VARCHAR(191) NULL,
    MODIFY `slipNo` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteExpenseId_fkey` FOREIGN KEY (`siteExpenseId`) REFERENCES `SiteExpense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
