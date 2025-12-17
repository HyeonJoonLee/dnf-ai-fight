-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "server_id" TEXT NOT NULL,
    "character_name" TEXT NOT NULL,
    "dnf_character_id" TEXT NOT NULL,
    "job_name" TEXT,
    "level" INTEGER,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "last_image_url" TEXT,
    "last_ai_image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "last_analysis" TEXT,
    "battle_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "battle_stats" JSONB,
    "battle_stats_version" INTEGER NOT NULL DEFAULT 1,
    "battle_stats_updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "challenger_user_id" UUID NOT NULL,
    "challenger_character_id" UUID NOT NULL,
    "target_character_id" UUID NOT NULL,
    "winner_side" TEXT NOT NULL,
    "score_challenger" DECIMAL,
    "score_target" DECIMAL,
    "log_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attacker_character_id" UUID,
    "defender_character_id" UUID,
    "winner_character_id" UUID,
    "winrate_a" DOUBLE PRECISION,
    "winrate_b" DOUBLE PRECISION,
    "score_a" DOUBLE PRECISION,
    "score_b" DOUBLE PRECISION,
    "delta" DOUBLE PRECISION,
    "highlights" JSONB,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "server_id" TEXT NOT NULL,
    "dnf_character_id" TEXT NOT NULL,
    "character_name" TEXT NOT NULL,
    "job_name" TEXT,
    "level" INTEGER,
    "last_image_url" TEXT,
    "last_ai_image_url" TEXT,
    "last_analysis" TEXT,
    "battle_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "battle_stats" JSONB,
    "battle_stats_version" INTEGER NOT NULL DEFAULT 1,
    "battle_stats_updated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_characters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "slot_index" INTEGER,
    "bg_key" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_provider_provider_user_id_key" ON "app_users"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "idx_characters_user_id" ON "characters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "characters_user_server_name_idx" ON "characters"("user_id", "server_id", "character_name");

-- CreateIndex
CREATE INDEX "battles_challenger_user_idx" ON "battles"("challenger_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "battles_target_character_idx" ON "battles"("target_character_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_battles_attacker_created" ON "battles"("attacker_character_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_battles_defender_created" ON "battles"("defender_character_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_battles_winner_created" ON "battles"("winner_character_id", "created_at");

-- CreateIndex
CREATE INDEX "character_profiles_server_name_idx" ON "character_profiles"("server_id", "character_name");

-- CreateIndex
CREATE UNIQUE INDEX "character_profiles_server_dnf_uidx" ON "character_profiles"("server_id", "dnf_character_id");

-- CreateIndex
CREATE INDEX "user_characters_profile_idx" ON "user_characters"("profile_id");

-- CreateIndex
CREATE INDEX "user_characters_user_idx" ON "user_characters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_characters_user_profile_uidx" ON "user_characters"("user_id", "profile_id");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_challenger_character_id_fkey" FOREIGN KEY ("challenger_character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_challenger_user_id_fkey" FOREIGN KEY ("challenger_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_target_character_id_fkey" FOREIGN KEY ("target_character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "character_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_user_fk" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
