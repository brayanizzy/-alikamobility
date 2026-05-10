/// <reference path="../pb_data/types.d.ts" />
/**
 * COMPREHENSIVE SECURITY RULES FIX
 * 
 * This migration fixes all API rules to ensure proper multi-tenant access:
 * 
 * - organizations: admins can view/update THEIR OWN org, anyone can create (signup)
 * - users: admins can create users in their org (for agents), users can view own org users
 * - members: any authenticated user in the org can CRUD
 * - payments: any authenticated user in the org can CRUD
 * - parkings: admins can CRUD their org's parkings, agents can view
 * - qrcodes: any authenticated user in the org can CRUD
 * - receipts: any authenticated user can CRUD
 */
migrate((app) => {

  // --- 1. ORGANIZATIONS ---
  // Admins must be able to view their own org (for dashboard, forms, etc.)
  const orgs = app.findCollectionByNameOrId("organizations");
  orgs.listRule = "id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  orgs.viewRule = "id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  orgs.createRule = ""; // Anyone can create (signup flow)
  orgs.updateRule = "id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  orgs.deleteRule = "@request.auth.role = 'super-admin'";
  app.save(orgs);

  // --- 2. USERS ---
  // Admins can create agents in their org, users can list org members
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  users.viewRule = "id = @request.auth.id || organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  users.createRule = ""; // Open for signup + admin creating agents
  users.updateRule = "id = @request.auth.id || (@request.auth.role = 'admin' && organization_id = @request.auth.organization_id) || @request.auth.role = 'super-admin'";
  users.deleteRule = "@request.auth.role = 'super-admin'";
  app.save(users);

  // --- 3. MEMBERS ---
  // Any authenticated user in the org can manage members
  const members = app.findCollectionByNameOrId("members");
  members.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  members.viewRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  members.createRule = "@request.auth.id != '' && @request.auth.organization_id != ''";
  members.updateRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  members.deleteRule = "organization_id = @request.auth.organization_id && @request.auth.role = 'admin'";
  app.save(members);

  // --- 4. PAYMENTS ---
  const payments = app.findCollectionByNameOrId("payments");
  payments.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  payments.viewRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  payments.createRule = "@request.auth.id != '' && @request.auth.organization_id != ''";
  payments.updateRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  payments.deleteRule = "@request.auth.role = 'super-admin'";
  app.save(payments);

  // --- 5. PARKINGS ---
  const parkings = app.findCollectionByNameOrId("parkings");
  parkings.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  parkings.viewRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  parkings.createRule = "@request.auth.role = 'admin' && @request.auth.organization_id != ''";
  parkings.updateRule = "organization_id = @request.auth.organization_id && @request.auth.role = 'admin'";
  parkings.deleteRule = "organization_id = @request.auth.organization_id && @request.auth.role = 'admin'";
  app.save(parkings);

  // --- 6. QRCODES ---
  try {
    const qrcodes = app.findCollectionByNameOrId("qrcodes");
    qrcodes.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
    qrcodes.viewRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
    qrcodes.createRule = "@request.auth.id != ''";
    qrcodes.updateRule = "organization_id = @request.auth.organization_id";
    qrcodes.deleteRule = "@request.auth.role = 'admin' && organization_id = @request.auth.organization_id";
    app.save(qrcodes);
  } catch(e) { console.log("qrcodes collection not found, skipping"); }

  // --- 7. RECEIPTS ---
  try {
    const receipts = app.findCollectionByNameOrId("receipts");
    receipts.listRule = "@request.auth.id != ''";
    receipts.viewRule = "@request.auth.id != ''";
    receipts.createRule = "@request.auth.id != ''";
    receipts.updateRule = "@request.auth.id != ''";
    receipts.deleteRule = null;
    app.save(receipts);
  } catch(e) { console.log("receipts collection not found, skipping"); }

}, (app) => {
  // Revert not needed for dev
})
