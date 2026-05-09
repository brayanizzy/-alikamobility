/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("members");

  const record0 = new Record(collection);
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("member_id", "MEM001");
    record0.set("name", "Jean Kasongo");
    record0.set("phone", "+243812345001");
    record0.set("moto_number", "MOTO001");
    const record0_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Mudzi-Pela'");
    if (!record0_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Mudzi-Pela'\""); }
    record0.set("parking_id", record0_parking_idLookup.id);
    record0.set("status", "active");
    record0.set("qr_code", "QR_MEM001_JEAN_KASONGO");
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
    record1.set("name", "Marie Mwamba");
    record1.set("phone", "+243812345002");
    record1.set("moto_number", "MOTO002");
    const record1_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Kindia'");
    if (!record1_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Kindia'\""); }
    record1.set("parking_id", record1_parking_idLookup.id);
    record1.set("status", "active");
    record1.set("qr_code", "QR_MEM002_MARIE_MWAMBA");
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
    record2.set("name", "Pierre Ndala");
    record2.set("phone", "+243812345003");
    record2.set("moto_number", "MOTO003");
    const record2_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Saio'");
    if (!record2_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Saio'\""); }
    record2.set("parking_id", record2_parking_idLookup.id);
    record2.set("status", "active");
    record2.set("qr_code", "QR_MEM003_PIERRE_NDALA");
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
    record3.set("name", "Sophie Kambale");
    record3.set("phone", "+243812345004");
    record3.set("moto_number", "MOTO004");
    const record3_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Mudzi-Pela'");
    if (!record3_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Mudzi-Pela'\""); }
    record3.set("parking_id", record3_parking_idLookup.id);
    record3.set("status", "active");
    record3.set("qr_code", "QR_MEM004_SOPHIE_KAMBALE");
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
    record4.set("name", "Thomas Mbuyi");
    record4.set("phone", "+243812345005");
    record4.set("moto_number", "MOTO005");
    const record4_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Kindia'");
    if (!record4_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Kindia'\""); }
    record4.set("parking_id", record4_parking_idLookup.id);
    record4.set("status", "active");
    record4.set("qr_code", "QR_MEM005_THOMAS_MBUYI");
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    const record5_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record5_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record5.set("organization_id", record5_organization_idLookup.id);
    record5.set("member_id", "MEM006");
    record5.set("name", "Amina Samba");
    record5.set("phone", "+243812345006");
    record5.set("moto_number", "MOTO006");
    const record5_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Saio'");
    if (!record5_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Saio'\""); }
    record5.set("parking_id", record5_parking_idLookup.id);
    record5.set("status", "active");
    record5.set("qr_code", "QR_MEM006_AMINA_SAMBA");
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    const record6_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record6_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record6.set("organization_id", record6_organization_idLookup.id);
    record6.set("member_id", "MEM007");
    record6.set("name", "David Kabuya");
    record6.set("phone", "+243812345007");
    record6.set("moto_number", "MOTO007");
    const record6_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Mudzi-Pela'");
    if (!record6_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Mudzi-Pela'\""); }
    record6.set("parking_id", record6_parking_idLookup.id);
    record6.set("status", "active");
    record6.set("qr_code", "QR_MEM007_DAVID_KABUYA");
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    const record7_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record7_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record7.set("organization_id", record7_organization_idLookup.id);
    record7.set("member_id", "MEM008");
    record7.set("name", "Fatima Diallo");
    record7.set("phone", "+243812345008");
    record7.set("moto_number", "MOTO008");
    const record7_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Kindia'");
    if (!record7_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Kindia'\""); }
    record7.set("parking_id", record7_parking_idLookup.id);
    record7.set("status", "active");
    record7.set("qr_code", "QR_MEM008_FATIMA_DIALLO");
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    const record8_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record8_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record8.set("organization_id", record8_organization_idLookup.id);
    record8.set("member_id", "MEM009");
    record8.set("name", "Robert Mwangi");
    record8.set("phone", "+243812345009");
    record8.set("moto_number", "MOTO009");
    const record8_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Saio'");
    if (!record8_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Saio'\""); }
    record8.set("parking_id", record8_parking_idLookup.id);
    record8.set("status", "active");
    record8.set("qr_code", "QR_MEM009_ROBERT_MWANGI");
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    const record9_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record9_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record9.set("organization_id", record9_organization_idLookup.id);
    record9.set("member_id", "MEM010");
    record9.set("name", "Zainab Hassan");
    record9.set("phone", "+243812345010");
    record9.set("moto_number", "MOTO010");
    const record9_parking_idLookup = app.findFirstRecordByFilter("parkings", "name='Mudzi-Pela'");
    if (!record9_parking_idLookup) { throw new Error("Lookup failed for parking_id: no record in 'parkings' matching \"name='Mudzi-Pela'\""); }
    record9.set("parking_id", record9_parking_idLookup.id);
    record9.set("status", "active");
    record9.set("qr_code", "QR_MEM010_ZAINAB_HASSAN");
  try {
    app.save(record9);
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
