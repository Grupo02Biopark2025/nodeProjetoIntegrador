-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "batteryDrainRate" DOUBLE PRECISION,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "connectionType" TEXT,
ADD COLUMN     "diskUsedPercentage" DOUBLE PRECISION,
ADD COLUMN     "firstSync" TIMESTAMP(3),
ADD COLUMN     "isDeviceRooted" BOOLEAN,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhysicalDevice" BOOLEAN,
ADD COLUMN     "lastBatteryLevel" INTEGER,
ADD COLUMN     "lastBatteryState" TEXT,
ADD COLUMN     "lastPing" TIMESTAMP(3),
ADD COLUMN     "lastSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "screenTimeMinutes" INTEGER,
ADD COLUMN     "sdkVersion" TEXT,
ADD COLUMN     "systemAppsCount" INTEGER,
ADD COLUMN     "totalAppsCount" INTEGER,
ADD COLUMN     "userAppsCount" INTEGER,
ADD COLUMN     "wifiName" TEXT;

-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "altitude" DOUBLE PRECISION,
ADD COLUMN     "connectionType" TEXT,
ADD COLUMN     "diskUsedPercentage" DOUBLE PRECISION,
ADD COLUMN     "freeDiskSpace" TEXT,
ADD COLUMN     "locationAccuracy" DOUBLE PRECISION,
ADD COLUMN     "mobileDataType" TEXT,
ADD COLUMN     "speed" DOUBLE PRECISION,
ADD COLUMN     "totalDiskSpace" TEXT,
ADD COLUMN     "wifiName" TEXT,
ADD COLUMN     "wifiSignalStrength" INTEGER;
