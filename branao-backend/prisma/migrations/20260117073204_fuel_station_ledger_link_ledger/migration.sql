/*
  Warnings:

  - You are about to drop the column `fuelStationId` on the `FuelStationLedger` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `FuelStationLedger` table. All the data in the column will be lost.
  - You are about to alter the column `purchaseType` on the `FuelStationLedger` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `VarChar(191)`.
  - You are about to alter the column `amount` on the `FuelStationLedger` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,2)` to `Decimal(14,2)`.
  - You are about to drop the `FuelStation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ledgerId` to the `FuelStationLedger` table without a default value. This is not possible if the table is not empty.
  - Made the column `through` on table `FuelStationLedger` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vehicleName` on table `FuelStationLedger` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slipNo` on table `FuelStationLedger` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `FuelStationLedger` DROP FOREIGN KEY `FuelStationLedger_fuelStationId_fkey`;

-- DropForeignKey
ALTER TABLE `FuelStationLedger` DROP FOREIGN KEY `FuelStationLedger_siteExpenseId_fkey`;

-- DropForeignKey
ALTER TABLE `FuelStationLedger` DROP FOREIGN KEY `FuelStationLedger_siteId_fkey`;

-- DropIndex
DROP INDEX `FuelStationLedger_fuelStationId_idx` ON `FuelStationLedger`;

-- AlterTable
ALTER TABLE `FuelStationLedger` DROP COLUMN `fuelStationId`,
    DROP COLUMN `remarks`,
    ADD COLUMN `ledgerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `remark` VARCHAR(191) NULL,
    MODIFY `through` VARCHAR(191) NOT NULL,
    MODIFY `purchaseType` VARCHAR(191) NOT NULL,
    MODIFY `vehicleName` VARCHAR(191) NOT NULL,
    MODIFY `amount` DECIMAL(14, 2) NOT NULL,
    MODIFY `slipNo` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `FuelStation`;

-- CreateIndex
CREATE INDEX `FuelStationLedger_ledgerId_idx` ON `FuelStationLedger`(`ledgerId`);

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `Ledger`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteId_fkey` FOREIGN KEY (`siteId`) REFERENCES `Site`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FuelStationLedger` ADD CONSTRAINT `FuelStationLedger_siteExpenseId_fkey` FOREIGN KEY (`siteExpenseId`) REFERENCES `SiteExpense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
