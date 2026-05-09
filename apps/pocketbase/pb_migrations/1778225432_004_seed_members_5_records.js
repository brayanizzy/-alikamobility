/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("members");

  const record0 = new Record(collection);
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("member_id", "MEM001");
    record0.set("name", "Jean Dupont");
    record0.set("phone", "+237670123456");
    record0.set("moto_number", "CM-2024-001");
    record0.set("parking_id", "P001");
    record0.set("status", "active");
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
    record1.set("name", "Marie Nkomo");
    record1.set("phone", "+237671234567");
    record1.set("moto_number", "CM-2024-002");
    record1.set("parking_id", "P002");
    record1.set("status", "active");
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
    record2.set("name", "Pierre Kamga");
    record2.set("phone", "+237672345678");
    record2.set("moto_number", "CM-2024-003");
    record2.set("parking_id", "P003");
    record2.set("status", "active");
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
    record3.set("name", "Amara Diallo");
    record3.set("phone", "+237673456789");
    record3.set("moto_number", "CM-2024-004");
    record3.set("parking_id", "P004");
    record3.set("status", "active");
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
    record4.set("name", "Sophie Tagne");
    record4.set("phone", "+237674567890");
    record4.set("moto_number", "CM-2024-005");
    record4.set("parking_id", "P005");
    record4.set("status", "active");
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
