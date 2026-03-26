-- CreateTable
CREATE TABLE "RtwRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rtwToken" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RtwRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RtwRequest_rtwToken_key" ON "RtwRequest"("rtwToken");

-- CreateIndex
CREATE INDEX "RtwRequest_tenantId_idx" ON "RtwRequest"("tenantId");
