-- =============================================
-- Alika Mobility — REV-02 : Account lifecycle
-- Invitations + password reset tokens + users cols
-- Idempotent: safe to re-run (CREATE TABLE IF NOT EXISTS).
-- ALTER columns are run via the PHP migration runner
-- which skips columns that already exist.
-- =============================================

-- +--------------------------------------------+
-- | 1. USER INVITATIONS                         |
-- | Tokens pour invitation à définir son mdp    |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `user_invitations` (
    `id` VARCHAR(15) NOT NULL,
    `user_id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) DEFAULT NULL,
    `email` VARCHAR(255) NOT NULL,
    `role` VARCHAR(30) NOT NULL,
    `agent_type` VARCHAR(30) DEFAULT NULL,
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'SHA-256 du token brut (jamais le token en clair)',
    `expires_at` DATETIME NOT NULL,
    `used_at` DATETIME DEFAULT NULL,
    `sent_at` DATETIME DEFAULT NULL,
    `created_by` VARCHAR(15) DEFAULT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_invitations_user_id` (`user_id`),
    INDEX `idx_invitations_token_hash` (`token_hash`),
    INDEX `idx_invitations_email` (`email`),
    INDEX `idx_invitations_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 2. PASSWORD RESET TOKENS                    |
-- | Tokens pour "mot de passe oublié"           |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id` VARCHAR(15) NOT NULL,
    `user_id` VARCHAR(15) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL COMMENT 'SHA-256 du token brut (jamais le token en clair)',
    `expires_at` DATETIME NOT NULL,
    `used_at` DATETIME DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_reset_user_id` (`user_id`),
    INDEX `idx_reset_token_hash` (`token_hash`),
    INDEX `idx_reset_email` (`email`),
    INDEX `idx_reset_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 3. COLONNES SUPPLÉMENTAIRES SUR users        |
-- +--------------------------------------------+
-- Exécutées via le runner PHP idempotent (vérifie INFORMATION_SCHEMA).
-- ALTER TABLE `users` ADD COLUMN `email_verified_at` DATETIME DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `invited_at` DATETIME DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `last_password_change_at` DATETIME DEFAULT NULL;
-- ALTER TABLE `users` ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE `users` ADD COLUMN `created_by` VARCHAR(15) DEFAULT NULL;
