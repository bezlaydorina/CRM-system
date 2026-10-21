-- CreateTable
CREATE TABLE "IntakeFormFieldDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "formKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'Általános',
    "options" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IntakeFormFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeFormResponse" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "formKey" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntakeFormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntakeFormResponse_accountId_formKey_key" ON "IntakeFormResponse"("accountId", "formKey");

-- AddForeignKey
ALTER TABLE "IntakeFormFieldDefinition" ADD CONSTRAINT "IntakeFormFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeFormResponse" ADD CONSTRAINT "IntakeFormResponse_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
