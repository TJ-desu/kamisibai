-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create User Table
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create Unique Index for Username
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Create Video Table
CREATE TABLE "Video" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaderId" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- Add Foreign Key
ALTER TABLE "Video" ADD CONSTRAINT "Video_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SEED DATA (from users.json)
INSERT INTO "User" ("id", "username", "password", "role") VALUES
('admin', 'saochan3333', 'Sao01010101', 'admin')
ON CONFLICT ("username") DO NOTHING;

-- SEED DATA (from videos.json)
-- Note: Requires matching uploaderId 'admin' which we just inserted.
INSERT INTO "Video" ("id", "title", "description", "tags", "url", "thumbnail", "viewCount", "uploaderId", "updatedAt") VALUES
('1', 'ももたろう', 'むかしむかしあるところに、おじいさんとおばあさんが住んでいました。', ARRAY['昔話', '3歳〜', '定番'], 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://placehold.co/600x400/FFB7C5/ffffff?text=Momotaro', 0, 'admin', CURRENT_TIMESTAMP),
('2', 'うさぎとかめ', '足の速いうさぎと、ゆっくりなかめが競争することになりました。', ARRAY['童話', '教訓', '2歳〜'], 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://placehold.co/600x400/D6D3D1/ffffff?text=Usagi+to+Kame', 0, 'admin', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
