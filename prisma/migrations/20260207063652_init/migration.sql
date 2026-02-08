-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DanceStyle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Move" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    "danceStyleId" TEXT NOT NULL,
    CONSTRAINT "Move_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Move_danceStyleId_fkey" FOREIGN KEY ("danceStyleId") REFERENCES "DanceStyle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moveId" TEXT NOT NULL,
    CONSTRAINT "Video_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "Move" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoveRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relationType" TEXT NOT NULL,
    "notes" TEXT,
    "fromMoveId" TEXT NOT NULL,
    "toMoveId" TEXT NOT NULL,
    CONSTRAINT "MoveRelation_fromMoveId_fkey" FOREIGN KEY ("fromMoveId") REFERENCES "Move" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MoveRelation_toMoveId_fkey" FOREIGN KEY ("toMoveId") REFERENCES "Move" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "DanceStyle_name_key" ON "DanceStyle"("name");

-- CreateIndex
CREATE INDEX "Move_userId_idx" ON "Move"("userId");

-- CreateIndex
CREATE INDEX "Move_danceStyleId_idx" ON "Move"("danceStyleId");

-- CreateIndex
CREATE INDEX "Video_moveId_idx" ON "Video"("moveId");

-- CreateIndex
CREATE INDEX "MoveRelation_fromMoveId_idx" ON "MoveRelation"("fromMoveId");

-- CreateIndex
CREATE INDEX "MoveRelation_toMoveId_idx" ON "MoveRelation"("toMoveId");

-- CreateIndex
CREATE UNIQUE INDEX "MoveRelation_fromMoveId_toMoveId_relationType_key" ON "MoveRelation"("fromMoveId", "toMoveId", "relationType");
