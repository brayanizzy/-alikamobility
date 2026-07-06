-- =============================================
-- Alika Mobility — Module 10 Notifications
-- Tables pour templates + logs multi-canal
-- =============================================

-- Table des templates de notification
CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` VARCHAR(15) NOT NULL,
  `organization_id` VARCHAR(15) DEFAULT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `channel` ENUM('email','sms','whatsapp','in_app') NOT NULL DEFAULT 'in_app',
  `subject` VARCHAR(255) DEFAULT NULL,
  `body` TEXT NOT NULL,
  `variables_json` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_nt_org` (`organization_id`),
  INDEX `idx_nt_code` (`code`),
  INDEX `idx_nt_channel` (`channel`),
  INDEX `idx_nt_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des logs d'envoi
CREATE TABLE IF NOT EXISTS `notification_logs` (
  `id` VARCHAR(15) NOT NULL,
  `organization_id` VARCHAR(15) DEFAULT NULL,
  `notification_id` VARCHAR(15) DEFAULT NULL,
  `template_code` VARCHAR(50) DEFAULT NULL,
  `channel` ENUM('email','sms','whatsapp','in_app') NOT NULL,
  `provider` VARCHAR(50) DEFAULT NULL,
  `recipient_type` VARCHAR(50) DEFAULT NULL,
  `recipient_id` VARCHAR(15) DEFAULT NULL,
  `recipient_name` VARCHAR(255) DEFAULT NULL,
  `recipient_contact` VARCHAR(255) DEFAULT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('draft','queued','sending','sent','sent_simulated','failed','cancelled') NOT NULL DEFAULT 'draft',
  `provider_message_id` VARCHAR(255) DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `attempt_count` INT NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 3,
  `sent_at` DATETIME DEFAULT NULL,
  `idempotency_key` VARCHAR(100) DEFAULT NULL,
  `created_by` VARCHAR(15) DEFAULT NULL,
  `created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_nl_org` (`organization_id`),
  INDEX `idx_nl_notification` (`notification_id`),
  INDEX `idx_nl_channel` (`channel`),
  INDEX `idx_nl_status` (`status`),
  INDEX `idx_nl_recipient` (`recipient_id`),
  INDEX `idx_nl_idempotency` (`idempotency_key`),
  INDEX `idx_nl_created` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajout colonnes à la table notifications existante
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `channel` ENUM('in_app','email','sms','whatsapp') NOT NULL DEFAULT 'in_app' AFTER `type`;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `notification_log_id` VARCHAR(15) DEFAULT NULL AFTER `related_id`;

-- Index supplémentaires sur notifications
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notif_channel` (`channel`);
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notif_type` (`type`);
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notif_created` (`created`);
