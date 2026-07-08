-- =============================================
-- Alika Mobility — REV-03 : Association registration
-- Public signup flow + plans + subscriptions
-- Idempotent. Tables use CREATE TABLE IF NOT EXISTS.
-- Enum/column alterations are run via the PHP
-- migration runner which checks INFORMATION_SCHEMA.
-- =============================================

-- 1. Extend users.status enum
-- ALTER TABLE `users` MODIFY COLUMN `status` ENUM('active','suspended','pending_invite','pending_approval','disabled') NOT NULL DEFAULT 'active';

-- 2. Extend organizations.status enum
-- ALTER TABLE `organizations` MODIFY COLUMN `status` ENUM('pending','active','suspended','rejected','expired') NOT NULL DEFAULT 'pending';

-- 3. Columns added to organizations (idempotent):
-- plan_code VARCHAR(30) DEFAULT NULL
-- approved_at DATETIME DEFAULT NULL
-- approved_by VARCHAR(15) DEFAULT NULL
-- rejected_at DATETIME DEFAULT NULL
-- rejection_reason TEXT DEFAULT NULL

-- 4. subscription_plans
CREATE TABLE IF NOT EXISTS `subscription_plans` (
    `id` VARCHAR(15) NOT NULL, `code` VARCHAR(30) NOT NULL, `name` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL, `max_admins` INT DEFAULT 1, `max_agents` INT DEFAULT 5,
    `max_members` INT DEFAULT 100, `max_vehicles` INT DEFAULT 50, `max_parkings` INT DEFAULT 5,
    `features_json` TEXT DEFAULT NULL, `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`), UNIQUE KEY `uq_plan_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. organization_subscriptions
CREATE TABLE IF NOT EXISTS `organization_subscriptions` (
    `id` VARCHAR(15) NOT NULL, `organization_id` VARCHAR(15) NOT NULL, `plan_code` VARCHAR(30) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending_validation',
    `trial_starts_at` DATETIME DEFAULT NULL, `trial_ends_at` DATETIME DEFAULT NULL,
    `starts_at` DATETIME DEFAULT NULL, `ends_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`), INDEX `idx_subscr_org` (`organization_id`), INDEX `idx_subscr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. association_registration_requests
CREATE TABLE IF NOT EXISTS `association_registration_requests` (
    `id` VARCHAR(15) NOT NULL, `organization_id` VARCHAR(15) NOT NULL, `admin_user_id` VARCHAR(15) NOT NULL,
    `plan_code` VARCHAR(30) NOT NULL, `association_name` VARCHAR(255) NOT NULL, `activity_type` VARCHAR(50) DEFAULT NULL,
    `province` VARCHAR(100) DEFAULT NULL, `city` VARCHAR(100) DEFAULT NULL, `address` VARCHAR(255) DEFAULT NULL,
    `manager_name` VARCHAR(255) NOT NULL, `manager_phone` VARCHAR(50) DEFAULT NULL, `manager_email` VARCHAR(255) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending_approval',
    `submitted_at` DATETIME NOT NULL, `reviewed_at` DATETIME DEFAULT NULL, `reviewed_by` VARCHAR(15) DEFAULT NULL,
    `review_note` TEXT DEFAULT NULL, `created_at` DATETIME NOT NULL, `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`id`), INDEX `idx_regreq_status` (`status`), INDEX `idx_regreq_org` (`organization_id`),
    INDEX `idx_regreq_email` (`manager_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
