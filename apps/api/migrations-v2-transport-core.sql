-- =============================================
-- Alika Mobility — Migration V2 : Transport Core
-- Version Terrain V1
-- À exécuter UNE FOIS après validation du Module 0
-- Ne PAS exécuter en production sans backup
-- =============================================

-- +--------------------------------------------+
-- | 1. AGENCIES                                 |
-- | Succursales d'une organisation              |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `agencies` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `city` VARCHAR(100) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `manager_name` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_agencies_organization_id` (`organization_id`),
    INDEX `idx_agencies_status` (`status`),
    INDEX `idx_agencies_org_status` (`organization_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 2. VEHICLE_TYPES                            |
-- | Catégories de véhicules (taxi-moto, bus…)   |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `vehicle_types` (
    `id` VARCHAR(15) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `icon` VARCHAR(50) DEFAULT NULL,
    `capacity` INT DEFAULT 0 COMMENT 'Nombre de places/passagers',
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_vtype_slug` (`slug`),
    INDEX `idx_vtype_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 3. VEHICLES                                 |
-- | Parc roulant (tous types de transport)      |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `agency_id` VARCHAR(15) DEFAULT NULL,
    `parking_id` VARCHAR(15) DEFAULT NULL,
    `vehicle_type_id` VARCHAR(15) DEFAULT NULL,
    `owner_id` VARCHAR(15) DEFAULT NULL COMMENT 'Référence vers owners (table future)',
    `plate_number` VARCHAR(50) DEFAULT NULL COMMENT 'Plaque d\'immatriculation',
    `moto_number` VARCHAR(50) DEFAULT NULL COMMENT 'Numéro moto/taxi (rétrocompatibilité)',
    `brand` VARCHAR(100) DEFAULT NULL,
    `model` VARCHAR(100) DEFAULT NULL,
    `year` YEAR DEFAULT NULL,
    `color` VARCHAR(50) DEFAULT NULL,
    `chassis_number` VARCHAR(100) DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_vehicles_organization_id` (`organization_id`),
    INDEX `idx_vehicles_agency_id` (`agency_id`),
    INDEX `idx_vehicles_parking_id` (`parking_id`),
    INDEX `idx_vehicles_type_id` (`vehicle_type_id`),
    INDEX `idx_vehicles_owner_id` (`owner_id`),
    INDEX `idx_vehicles_status` (`status`),
    INDEX `idx_vehicles_plate` (`plate_number`),
    INDEX `idx_vehicles_moto_number` (`moto_number`),
    INDEX `idx_vehicles_org_status` (`organization_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 4. DRIVERS                                  |
-- | Chauffeurs (liés aux membres)               |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `drivers` (
    `id` VARCHAR(15) NOT NULL,
    `member_id` VARCHAR(15) NOT NULL COMMENT 'Un chauffeur est d\'abord un membre',
    `license_number` VARCHAR(100) DEFAULT NULL,
    `license_category` VARCHAR(20) DEFAULT NULL COMMENT 'A, B, C, D, E, F',
    `license_expiry` DATE DEFAULT NULL,
    `medical_cert_expiry` DATE DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_drivers_member_id` (`member_id`),
    INDEX `idx_drivers_status` (`status`),
    INDEX `idx_drivers_license_expiry` (`license_expiry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 5. OWNERS                                   |
-- | Propriétaires de véhicules                  |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `owners` (
    `id` VARCHAR(15) NOT NULL,
    `member_id` VARCHAR(15) NOT NULL COMMENT 'Un propriétaire est d\'abord un membre',
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_owners_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 6. LINES                                    |
-- | Lignes/itinéraires de transport             |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `lines` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `agency_id` VARCHAR(15) DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `start_point` VARCHAR(255) DEFAULT NULL,
    `end_point` VARCHAR(255) DEFAULT NULL,
    `distance_km` DECIMAL(10, 2) DEFAULT NULL,
    `base_fare` DECIMAL(15, 2) DEFAULT NULL COMMENT 'Prix de base',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_lines_organization_id` (`organization_id`),
    INDEX `idx_lines_agency_id` (`agency_id`),
    INDEX `idx_lines_status` (`status`),
    INDEX `idx_lines_org_status` (`organization_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 7. VEHICLE ASSIGNMENTS                      |
-- | Affectation chauffeur → véhicule → ligne    |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `vehicle_assignments` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `vehicle_id` VARCHAR(15) NOT NULL,
    `driver_id` VARCHAR(15) DEFAULT NULL,
    `line_id` VARCHAR(15) DEFAULT NULL,
    `parking_id` VARCHAR(15) DEFAULT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_assignments_organization_id` (`organization_id`),
    INDEX `idx_assignments_vehicle_id` (`vehicle_id`),
    INDEX `idx_assignments_driver_id` (`driver_id`),
    INDEX `idx_assignments_line_id` (`line_id`),
    INDEX `idx_assignments_parking_id` (`parking_id`),
    INDEX `idx_assignments_status` (`status`),
    INDEX `idx_assignments_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 8. DOCUMENTS                                |
-- | Documents attachés (carte grise, permis…)   |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `documents` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `related_type` VARCHAR(50) NOT NULL COMMENT 'vehicle, driver, member, owner',
    `related_id` VARCHAR(15) NOT NULL,
    `document_type` VARCHAR(50) NOT NULL COMMENT 'registration, insurance, technical_inspection, license, id_card, contract',
    `label` VARCHAR(255) DEFAULT NULL,
    `file_url` VARCHAR(500) DEFAULT NULL,
    `file_name` VARCHAR(255) DEFAULT NULL,
    `file_size` INT DEFAULT NULL COMMENT 'Taille en octets',
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `expiry_date` DATE DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_docs_organization_id` (`organization_id`),
    INDEX `idx_docs_related` (`related_type`, `related_id`),
    INDEX `idx_docs_type` (`document_type`),
    INDEX `idx_docs_expiry` (`expiry_date`),
    INDEX `idx_docs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 9. DEBTS                                    |
-- | Dettes structurées (membres, véhicules)     |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `debts` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `member_id` VARCHAR(15) DEFAULT NULL,
    `vehicle_id` VARCHAR(15) DEFAULT NULL,
    `debt_type` VARCHAR(50) NOT NULL DEFAULT 'membership' COMMENT 'membership, penalty, loan, other',
    `amount_original` DECIMAL(15, 2) NOT NULL,
    `amount_remaining` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'CDF',
    `due_date` DATE DEFAULT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, paid, partially_paid, written_off',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_debts_organization_id` (`organization_id`),
    INDEX `idx_debts_member_id` (`member_id`),
    INDEX `idx_debts_vehicle_id` (`vehicle_id`),
    INDEX `idx_debts_type` (`debt_type`),
    INDEX `idx_debts_status` (`status`),
    INDEX `idx_debts_due_date` (`due_date`),
    INDEX `idx_debts_member_status` (`member_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 10. PENALTIES                                |
-- | Pénalités/amendes sur paiements ou dettes   |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `penalties` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `payment_id` VARCHAR(15) DEFAULT NULL COMMENT 'NULL si pénalité non liée à un paiement',
    `debt_id` VARCHAR(15) DEFAULT NULL,
    `member_id` VARCHAR(15) DEFAULT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'CDF',
    `reason` VARCHAR(255) NOT NULL,
    `penalty_type` VARCHAR(50) DEFAULT 'late_payment' COMMENT 'late_payment, overcharge, damage, other',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, applied, waived, paid',
    `applied_date` DATE DEFAULT NULL,
    `waived_date` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_penalties_organization_id` (`organization_id`),
    INDEX `idx_penalties_payment_id` (`payment_id`),
    INDEX `idx_penalties_debt_id` (`debt_id`),
    INDEX `idx_penalties_member_id` (`member_id`),
    INDEX `idx_penalties_type` (`penalty_type`),
    INDEX `idx_penalties_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- +--------------------------------------------+
-- | 11. MEMBER CARDS                             |
-- | Cartes membres physiques/digitales          |
-- +--------------------------------------------+
CREATE TABLE IF NOT EXISTS `member_cards` (
    `id` VARCHAR(15) NOT NULL,
    `organization_id` VARCHAR(15) NOT NULL,
    `member_id` VARCHAR(15) NOT NULL,
    `card_number` VARCHAR(50) NOT NULL,
    `card_type` VARCHAR(20) NOT NULL DEFAULT 'standard' COMMENT 'standard, premium, vip',
    `issued_date` DATE NOT NULL,
    `expiry_date` DATE DEFAULT NULL,
    `pin_hash` VARCHAR(255) DEFAULT NULL COMMENT 'PIN chiffré pour vérification offline',
    `qr_secret` VARCHAR(255) DEFAULT NULL COMMENT 'Secret HMAC pour QR code',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, expired, lost, replaced, cancelled',
    `notes` TEXT DEFAULT NULL,
    `created` DATETIME NOT NULL,
    `updated` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `idx_card_number` (`organization_id`, `card_number`),
    INDEX `idx_mcards_member_id` (`member_id`),
    INDEX `idx_mcards_organization_id` (`organization_id`),
    INDEX `idx_mcards_status` (`status`),
    INDEX `idx_mcards_expiry` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Index supplémentaires sur tables existantes
-- (pour les nouvelles relations)
-- =============================================

-- Ajout agency_id à parkings si la colonne n'existe pas déjà
-- (à exécuter séparément après vérification)
-- ALTER TABLE parkings ADD COLUMN agency_id VARCHAR(15) DEFAULT NULL AFTER organization_id;
-- ALTER TABLE parkings ADD INDEX idx_parkings_agency_id (agency_id);

-- Ajout agency_id à members si utile
-- ALTER TABLE members ADD COLUMN agency_id VARCHAR(15) DEFAULT NULL AFTER organization_id;
-- ALTER TABLE members ADD INDEX idx_members_agency_id (agency_id);

-- Ajout agency_id à users si utile
-- ALTER TABLE users ADD COLUMN agency_id VARCHAR(15) DEFAULT NULL AFTER organization_id;
-- ALTER TABLE users ADD INDEX idx_users_agency_id (agency_id);

-- =============================================
-- Data initiale : types de véhicules
-- =============================================
INSERT IGNORE INTO `vehicle_types` (`id`, `name`, `slug`, `description`, `icon`, `capacity`, `created`, `updated`) VALUES
('vtype_taxi_moto', 'Taxi-Moto', 'taxi-moto', 'Moto taxi (commun en RDC)', 'bike', 2, NOW(), NOW()),
('vtype_taxi', 'Taxi Voiture', 'taxi', 'Taxi automobile 4 places', 'car', 4, NOW(), NOW()),
('vtype_bus', 'Bus', 'bus', 'Bus de transport en commun', 'bus', 30, NOW(), NOW()),
('vtype_camion', 'Camion', 'camion', 'Camion de marchandises', 'truck', 3, NOW(), NOW()),
('vtype_tricycle', 'Tricycle', 'tricycle', 'Tricycle taxi/bagages', 'bike', 3, NOW(), NOW()),
('vtype_minibus', 'Minibus', 'minibus', 'Minibus 15-20 places', 'bus', 18, NOW(), NOW());
