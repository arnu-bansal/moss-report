-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latestVersionId" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionVersion" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MossRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MossRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MossMatch" (
    "id" TEXT NOT NULL,
    "mossRunId" TEXT NOT NULL,
    "submissionVersionAId" TEXT NOT NULL,
    "submissionVersionBId" TEXT NOT NULL,
    "percentA" DOUBLE PRECISION NOT NULL,
    "percentB" DOUBLE PRECISION NOT NULL,
    "mossMatchUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MossMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MossMatchSegment" (
    "id" TEXT NOT NULL,
    "mossMatchId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "startLine" INTEGER NOT NULL,
    "endLine" INTEGER NOT NULL,

    CONSTRAINT "MossMatchSegment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SubmissionVersion" ADD CONSTRAINT "SubmissionVersion_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MossMatch" ADD CONSTRAINT "MossMatch_mossRunId_fkey" FOREIGN KEY ("mossRunId") REFERENCES "MossRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MossMatchSegment" ADD CONSTRAINT "MossMatchSegment_mossMatchId_fkey" FOREIGN KEY ("mossMatchId") REFERENCES "MossMatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
