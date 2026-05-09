/**
 * QR Code generation utility for Alika Mobility
 * 
 * Generates:
 * - member_code: ALIKA-{CITY_PREFIX}-{SEQ} e.g. ALIKA-GOM-000245
 * - qr_secret: member_code|hash for anti-falsification
 * - QR data string for scanning
 */

/**
 * Generate a simple hash from a string (not crypto-secure, but sufficient for field anti-falsification)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').substring(0, 6);
}

/**
 * Get a 3-letter city prefix
 * "Goma" -> "GOM", "Kinshasa" -> "KIN", "Bukavu" -> "BUK"
 */
function getCityPrefix(city) {
  if (!city || city.length < 3) return 'ALK';
  return city.substring(0, 3).toUpperCase();
}

/**
 * Generate a unique member code
 * Format: ALIKA-{CITY}-{SEQUENCE}
 * @param {string} city - The city of the organization
 * @param {number} existingCount - Current number of members in the org (for sequence)
 * @returns {string} e.g. "ALIKA-GOM-000245"
 */
export function generateMemberCode(city, existingCount) {
  const prefix = getCityPrefix(city);
  const seq = (existingCount + 1).toString().padStart(6, '0');
  return `ALIKA-${prefix}-${seq}`;
}

/**
 * Generate the QR secret (signed payload)
 * Format: {member_code}|{hash}
 * The hash prevents simple forgery of QR codes
 * @param {string} memberCode - The generated member_code
 * @param {string} orgId - The organization ID (acts as a salt)
 * @returns {string} e.g. "ALIKA-GOM-000245|A3F2B1"
 */
export function generateQrSecret(memberCode, orgId) {
  const payload = `${memberCode}:${orgId}`;
  const hash = simpleHash(payload);
  return `${memberCode}|${hash}`;
}

/**
 * Validate a scanned QR secret
 * @param {string} qrSecret - The full QR string scanned
 * @param {string} orgId - The organization to validate against
 * @returns {{ valid: boolean, memberCode: string|null }}
 */
export function validateQrSecret(qrSecret, orgId) {
  if (!qrSecret || !qrSecret.includes('|')) {
    return { valid: false, memberCode: null };
  }
  
  const parts = qrSecret.split('|');
  const memberCode = parts[0];
  const scannedHash = parts[1];
  
  // Rebuild expected hash
  const payload = `${memberCode}:${orgId}`;
  const expectedHash = simpleHash(payload);
  
  return {
    valid: scannedHash === expectedHash,
    memberCode
  };
}
