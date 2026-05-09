/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- 1. Members: add member_code, qr_secret, card_printed ---
  const members = app.findCollectionByNameOrId("members");

  const memberFields = [
    { "name": "member_code", "type": "text" },
    { "name": "qr_secret", "type": "text" },
    { "name": "card_printed", "type": "bool" },
    { "name": "debt_amount", "type": "number" }
  ];

  for (const field of memberFields) {
    if (!members.fields.getByName(field.name)) {
      members.fields.add(new Field(field));
    }
  }
  app.save(members);

  // --- 2. Payments: add sync_status, sync_attempts, synced_at ---
  const payments = app.findCollectionByNameOrId("payments");

  const paymentFields = [
    { "name": "sync_status", "type": "select", "values": ["pending", "synced", "failed"], "maxSelect": 1 },
    { "name": "sync_attempts", "type": "number" },
    { "name": "synced_at", "type": "text" }
  ];

  for (const field of paymentFields) {
    if (!payments.fields.getByName(field.name)) {
      payments.fields.add(new Field(field));
    }
  }
  app.save(payments);

}, (app) => {
  // Revert omitted for dev speed
})
