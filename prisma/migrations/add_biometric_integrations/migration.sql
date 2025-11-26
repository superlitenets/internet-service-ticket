-- CreateTable AttendanceLog
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "checkInTime" DATETIME,
    "checkOutTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'present',
    "biometricSource" TEXT NOT NULL DEFAULT 'manual',
    "deviceSerialNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable ZKtecoDevice
CREATE TABLE "ZKtecoDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 4370,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "deviceName" TEXT,
    "location" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable HikvisionDevice
CREATE TABLE "HikvisionDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL UNIQUE,
    "ipAddress" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 8000,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "deviceName" TEXT,
    "location" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable AccessControlEvent
CREATE TABLE "AccessControlEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "eventType" TEXT NOT NULL,
    "accessPoint" TEXT,
    "eventTime" DATETIME NOT NULL,
    "cardNumber" TEXT,
    "personName" TEXT,
    "status" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable SurveillanceEvent
CREATE TABLE "SurveillanceEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cameraId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventTime" DATETIME NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "location" TEXT,
    "snapshotUrl" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AttendanceLog_employeeId_idx" ON "AttendanceLog"("employeeId");
CREATE INDEX "AttendanceLog_date_idx" ON "AttendanceLog"("date");
CREATE INDEX "AttendanceLog_biometricSource_idx" ON "AttendanceLog"("biometricSource");

-- CreateIndex
CREATE INDEX "ZKtecoDevice_deviceId_idx" ON "ZKtecoDevice"("deviceId");
CREATE INDEX "ZKtecoDevice_enabled_idx" ON "ZKtecoDevice"("enabled");

-- CreateIndex
CREATE INDEX "HikvisionDevice_deviceId_idx" ON "HikvisionDevice"("deviceId");
CREATE INDEX "HikvisionDevice_deviceType_idx" ON "HikvisionDevice"("deviceType");
CREATE INDEX "HikvisionDevice_enabled_idx" ON "HikvisionDevice"("enabled");

-- CreateIndex
CREATE INDEX "AccessControlEvent_deviceId_idx" ON "AccessControlEvent"("deviceId");
CREATE INDEX "AccessControlEvent_employeeId_idx" ON "AccessControlEvent"("employeeId");
CREATE INDEX "AccessControlEvent_eventTime_idx" ON "AccessControlEvent"("eventTime");
CREATE INDEX "AccessControlEvent_eventType_idx" ON "AccessControlEvent"("eventType");

-- CreateIndex
CREATE INDEX "SurveillanceEvent_cameraId_idx" ON "SurveillanceEvent"("cameraId");
CREATE INDEX "SurveillanceEvent_eventTime_idx" ON "SurveillanceEvent"("eventTime");
CREATE INDEX "SurveillanceEvent_eventType_idx" ON "SurveillanceEvent"("eventType");
