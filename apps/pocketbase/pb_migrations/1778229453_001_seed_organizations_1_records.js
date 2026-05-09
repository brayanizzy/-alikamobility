/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("organizations");

  const record0 = new Record(collection);
    record0.set("name", "AITMC");
    record0.set("contact_email", "admin@aitmc.com");
    record0.set("contact_phone", "+243123456789");
    record0.set("subscription_plan", "pro");
    record0.set("created_by", "admin@alika.com");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
