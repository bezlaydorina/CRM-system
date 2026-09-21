/*
  Warnings:

  - You are about to drop the column `adsLive` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyAdBudget` on the `Account` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lifecycleStage" TEXT NOT NULL DEFAULT 'CSM_CONTACT',
    "lifecycleEnteredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monthlyFee" REAL NOT NULL DEFAULT 0,
    "setupFee" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "contractSignedAt" DATETIME,
    "lastPaymentAt" DATETIME,
    "source" TEXT,
    "isTestAccount" BOOLEAN NOT NULL DEFAULT false,
    "isInternalSales" BOOLEAN NOT NULL DEFAULT false,
    "nameFormat" TEXT NOT NULL DEFAULT 'HU',
    "callButtonEnabled" BOOLEAN NOT NULL DEFAULT true,
    "featureFlags" TEXT NOT NULL DEFAULT '{"crm":true,"calendar":true,"chatGptAdsTab":false}',
    "portalPasswordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("callButtonEnabled", "contractSignedAt", "createdAt", "featureFlags", "id", "industry", "isInternalSales", "isTestAccount", "lastPaymentAt", "lifecycleEnteredAt", "lifecycleStage", "monthlyFee", "name", "nameFormat", "organizationId", "portalPasswordHash", "setupFee", "source", "startDate", "status", "website") SELECT "callButtonEnabled", "contractSignedAt", "createdAt", "featureFlags", "id", "industry", "isInternalSales", "isTestAccount", "lastPaymentAt", "lifecycleEnteredAt", "lifecycleStage", "monthlyFee", "name", "nameFormat", "organizationId", "portalPasswordHash", "setupFee", "source", "startDate", "status", "website" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
