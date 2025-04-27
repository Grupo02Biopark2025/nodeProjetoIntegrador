-- DropForeignKey
ALTER TABLE "Log" DROP CONSTRAINT "Log_deviceId_fkey";

-- AlterTable
ALTER TABLE "Log" ALTER COLUMN "deviceId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;
