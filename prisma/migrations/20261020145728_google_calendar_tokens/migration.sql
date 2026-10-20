-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "googleAccessToken" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ADD COLUMN     "googleTokenExpiresAt" TIMESTAMP(3);
