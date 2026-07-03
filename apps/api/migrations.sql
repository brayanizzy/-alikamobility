-- =============================================
-- Alika Mobility — Index MySQL Optimisation
-- À exécuter UNE FOIS sur la base Hostinger
-- =============================================

-- organizations
ALTER TABLE organizations ADD INDEX idx_org_status (status);
ALTER TABLE organizations ADD INDEX idx_org_created (created);

-- users
ALTER TABLE users ADD INDEX idx_users_email (email);
ALTER TABLE users ADD INDEX idx_users_organization_id (organization_id);
ALTER TABLE users ADD INDEX idx_users_role (role);
ALTER TABLE users ADD INDEX idx_users_status (status);
ALTER TABLE users ADD INDEX idx_users_org_role (organization_id, role);

-- members
ALTER TABLE members ADD INDEX idx_members_organization_id (organization_id);
ALTER TABLE members ADD INDEX idx_members_status (status);
ALTER TABLE members ADD INDEX idx_members_org_status (organization_id, status);
ALTER TABLE members ADD INDEX idx_members_member_code (member_code);
ALTER TABLE members ADD INDEX idx_members_parking_id (parking_id);

-- payments
ALTER TABLE payments ADD INDEX idx_payments_organization_id (organization_id);
ALTER TABLE payments ADD INDEX idx_payments_member_id (member_id);
ALTER TABLE payments ADD INDEX idx_payments_payment_date (payment_date);
ALTER TABLE payments ADD INDEX idx_payments_collector_id (collector_id);
ALTER TABLE payments ADD INDEX idx_payments_org_date (organization_id, payment_date);
ALTER TABLE payments ADD INDEX idx_payments_client_id (client_payment_id);

-- parkings
ALTER TABLE parkings ADD INDEX idx_parkings_organization_id (organization_id);

-- qrcodes
ALTER TABLE qrcodes ADD INDEX idx_qrcodes_organization_id (organization_id);
ALTER TABLE qrcodes ADD INDEX idx_qrcodes_member_id (member_id);

-- receipts
ALTER TABLE receipts ADD INDEX idx_receipts_payment_id (payment_id);

-- notifications
ALTER TABLE notifications ADD INDEX idx_notif_user_id (user_id);
ALTER TABLE notifications ADD INDEX idx_notif_org_id (organization_id);
ALTER TABLE notifications ADD INDEX idx_notif_user_read (user_id, is_read);

-- sessions
ALTER TABLE sessions ADD INDEX idx_sessions_token (token);
ALTER TABLE sessions ADD INDEX idx_sessions_user_id (user_id);
ALTER TABLE sessions ADD INDEX idx_sessions_expires (expires_at);
