/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("payments");

  const record0 = new Record(collection);
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("member_id", "MEM001");
    record0.set("amount", 5000);
    record0.set("payment_date", "2024-01-15");
    record0.set("payment_method", "Mobile Money");
    record0.set("status", "paid");
    record0.set("recorded_by", "admin");
    record0.set("notes", "Monthly parking fee");
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
    record1.set("amount", 5000);
    record1.set("payment_date", "2024-01-16");
    record1.set("payment_method", "Especes");
    record1.set("status", "paid");
    record1.set("recorded_by", "admin");
    record1.set("notes", "Monthly parking fee");
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
    record2.set("amount", 5000);
    record2.set("payment_date", "2024-01-17");
    record2.set("payment_method", "Virement");
    record2.set("status", "paid");
    record2.set("recorded_by", "admin");
    record2.set("notes", "Monthly parking fee");
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
    record3.set("amount", 2500);
    record3.set("payment_date", "2024-01-18");
    record3.set("payment_method", "Mobile Money");
    record3.set("status", "unpaid");
    record3.set("recorded_by", "admin");
    record3.set("notes", "Partial payment - half month");
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
    record4.set("amount", 5000);
    record4.set("payment_date", "2023-12-20");
    record4.set("payment_method", "Especes");
    record4.set("status", "late");
    record4.set("recorded_by", "admin");
    record4.set("notes", "Previous month - overdue");
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
