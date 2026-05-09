/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("parkings");

  const record0 = new Record(collection);
    record0.set("name", "Mudzi-Pela");
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("daily_rate", 50);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("name", "Kindia");
    const record1_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record1_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record1.set("organization_id", record1_organization_idLookup.id);
    record1.set("daily_rate", 50);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("name", "Saio");
    const record2_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record2_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record2.set("organization_id", record2_organization_idLookup.id);
    record2.set("daily_rate", 50);
  try {
    app.save(record2);
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
