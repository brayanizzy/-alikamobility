/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qrcodes");

  const record0 = new Record(collection);
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("member_id", "MEM001");
    record0.set("qr_data", "MEM001|AITMC");
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
    const record1_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record1_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record1.set("organization_id", record1_organization_idLookup.id);
    record1.set("member_id", "MEM002");
    record1.set("qr_data", "MEM002|AITMC");
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
    const record2_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record2_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record2.set("organization_id", record2_organization_idLookup.id);
    record2.set("member_id", "MEM003");
    record2.set("qr_data", "MEM003|AITMC");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    const record3_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record3_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record3.set("organization_id", record3_organization_idLookup.id);
    record3.set("member_id", "MEM004");
    record3.set("qr_data", "MEM004|AITMC");
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    const record4_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record4_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record4.set("organization_id", record4_organization_idLookup.id);
    record4.set("member_id", "MEM005");
    record4.set("qr_data", "MEM005|AITMC");
  try {
    app.save(record4);
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
