-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "pageUrl" TEXT
);

-- CreateTable
CREATE TABLE "AdminTelegram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminEmail" TEXT NOT NULL,
    "chatId" TEXT,
    "userId" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "linkToken" TEXT,
    "linkTokenExpiresAt" DATETIME,
    "linkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TelegramLeadMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    CONSTRAINT "TelegramLeadMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminTelegram_adminEmail_key" ON "AdminTelegram"("adminEmail");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLeadMessage_leadId_key" ON "TelegramLeadMessage"("leadId");

-- CreateIndex
CREATE INDEX "TelegramLeadMessage_chatId_idx" ON "TelegramLeadMessage"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramLeadMessage_chatId_messageId_key" ON "TelegramLeadMessage"("chatId", "messageId");
