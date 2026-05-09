/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- 1. Organizations ---
  const orgs = app.findCollectionByNameOrId("organizations");
  
  const orgFields = [
    { "name": "city", "type": "text", "required": false },
    { "name": "manager_name", "type": "text", "required": false },
    { "name": "logo", "type": "file", "options": { "maxSelect": 1, "maxSize": 5242880, "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml"] } }
  ];

  for (const field of orgFields) {
    if (!orgs.fields.getByName(field.name)) {
      orgs.fields.add(new Field(field));
    }
  }

  // Update rule so anyone can create an org (for Signup)
  orgs.createRule = "";
  
  app.save(orgs);


  // --- 2. Members ---
  const members = app.findCollectionByNameOrId("members");
  
  // Note: members already has name, phone, moto_number, organization_id, photo, status
  const memberFields = [
    { "name": "full_name", "type": "text" },
    { "name": "bike_number", "type": "text" },
    { "name": "parking_id", "type": "relation", "options": { "collectionId": "pbc_3362291439", "maxSelect": 1 } },
    { "name": "qr_code", "type": "text" },
    { "name": "join_date", "type": "text" },
    { "name": "emergency_contact", "type": "text" },
    { "name": "daily_fee", "type": "number", "options": { "min": 0 } },
    { "name": "debt_balance", "type": "number" }
  ];

  for (const field of memberFields) {
    if (!members.fields.getByName(field.name)) {
      members.fields.add(new Field(field));
    }
  }
  
  app.save(members);


  // --- 3. Payments ---
  const payments = app.findCollectionByNameOrId("payments");
  
  // Note: payments already has member_id, amount, payment_method, organization_id, recorded_by
  const paymentFields = [
    { "name": "collector_id", "type": "text" },
    { "name": "parking_id", "type": "text" },
    { "name": "offline_sync", "type": "bool" },
    { "name": "device_id", "type": "text" },
    { "name": "gps_location", "type": "text" },
    { "name": "receipt_number", "type": "text" }
  ];

  for (const field of paymentFields) {
    if (!payments.fields.getByName(field.name)) {
      payments.fields.add(new Field(field));
    }
  }
  
  app.save(payments);

}, (app) => {
  // Revert is complex for adding fields, skipping for dev
})
