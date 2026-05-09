/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("payments");

  const record0 = new Record(collection);
    const record0_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record0_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record0.set("organization_id", record0_organization_idLookup.id);
    record0.set("member_id", "MEM001");
    record0.set("amount", 5000);
    record0.set("payment_date", "2025-01-10");
    record0.set("payment_method", "Mobile Money");
    record0.set("status", "paid");
    record0.set("recorded_by", "agent@aitmc.com");
    record0.set("notes", "Payment for parking");
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
    record1.set("amount", 4000);
    record1.set("payment_date", "2025-01-10");
    record1.set("payment_method", "Especes");
    record1.set("status", "paid");
    record1.set("recorded_by", "agent@aitmc.com");
    record1.set("notes", "Cash payment");
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
    record2.set("amount", 3500);
    record2.set("payment_date", "2025-01-10");
    record2.set("payment_method", "Virement");
    record2.set("status", "paid");
    record2.set("recorded_by", "agent@aitmc.com");
    record2.set("notes", "Bank transfer");
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
    record3.set("amount", 5000);
    record3.set("payment_date", "2025-01-09");
    record3.set("payment_method", "Mobile Money");
    record3.set("status", "paid");
    record3.set("recorded_by", "agent@aitmc.com");
    record3.set("notes", "Payment for parking");
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
    record4.set("amount", 4000);
    record4.set("payment_date", "2025-01-09");
    record4.set("payment_method", "Especes");
    record4.set("status", "unpaid");
    record4.set("recorded_by", "agent@aitmc.com");
    record4.set("notes", "Pending payment");
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
    record5.set("amount", 3500);
    record5.set("payment_date", "2025-01-09");
    record5.set("payment_method", "Mobile Money");
    record5.set("status", "paid");
    record5.set("recorded_by", "agent@aitmc.com");
    record5.set("notes", "Payment for parking");
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
    record6.set("amount", 5000);
    record6.set("payment_date", "2025-01-08");
    record6.set("payment_method", "Virement");
    record6.set("status", "paid");
    record6.set("recorded_by", "agent@aitmc.com");
    record6.set("notes", "Bank transfer");
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
    record7.set("amount", 4000);
    record7.set("payment_date", "2025-01-08");
    record7.set("payment_method", "Mobile Money");
    record7.set("status", "late");
    record7.set("recorded_by", "agent@aitmc.com");
    record7.set("notes", "Late payment");
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
    record8.set("amount", 3500);
    record8.set("payment_date", "2025-01-08");
    record8.set("payment_method", "Especes");
    record8.set("status", "paid");
    record8.set("recorded_by", "agent@aitmc.com");
    record8.set("notes", "Cash payment");
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
    record9.set("amount", 5000);
    record9.set("payment_date", "2025-01-07");
    record9.set("payment_method", "Mobile Money");
    record9.set("status", "paid");
    record9.set("recorded_by", "agent@aitmc.com");
    record9.set("notes", "Payment for parking");
  try {
    app.save(record9);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record10 = new Record(collection);
    const record10_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record10_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record10.set("organization_id", record10_organization_idLookup.id);
    record10.set("member_id", "MEM001");
    record10.set("amount", 5000);
    record10.set("payment_date", "2025-01-07");
    record10.set("payment_method", "Especes");
    record10.set("status", "unpaid");
    record10.set("recorded_by", "agent@aitmc.com");
    record10.set("notes", "Pending payment");
  try {
    app.save(record10);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record11 = new Record(collection);
    const record11_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record11_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record11.set("organization_id", record11_organization_idLookup.id);
    record11.set("member_id", "MEM002");
    record11.set("amount", 4000);
    record11.set("payment_date", "2025-01-07");
    record11.set("payment_method", "Virement");
    record11.set("status", "paid");
    record11.set("recorded_by", "agent@aitmc.com");
    record11.set("notes", "Bank transfer");
  try {
    app.save(record11);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record12 = new Record(collection);
    const record12_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record12_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record12.set("organization_id", record12_organization_idLookup.id);
    record12.set("member_id", "MEM003");
    record12.set("amount", 3500);
    record12.set("payment_date", "2025-01-06");
    record12.set("payment_method", "Mobile Money");
    record12.set("status", "late");
    record12.set("recorded_by", "agent@aitmc.com");
    record12.set("notes", "Late payment");
  try {
    app.save(record12);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record13 = new Record(collection);
    const record13_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record13_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record13.set("organization_id", record13_organization_idLookup.id);
    record13.set("member_id", "MEM004");
    record13.set("amount", 5000);
    record13.set("payment_date", "2025-01-06");
    record13.set("payment_method", "Especes");
    record13.set("status", "paid");
    record13.set("recorded_by", "agent@aitmc.com");
    record13.set("notes", "Cash payment");
  try {
    app.save(record13);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record14 = new Record(collection);
    const record14_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record14_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record14.set("organization_id", record14_organization_idLookup.id);
    record14.set("member_id", "MEM005");
    record14.set("amount", 4000);
    record14.set("payment_date", "2025-01-06");
    record14.set("payment_method", "Mobile Money");
    record14.set("status", "paid");
    record14.set("recorded_by", "agent@aitmc.com");
    record14.set("notes", "Payment for parking");
  try {
    app.save(record14);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record15 = new Record(collection);
    const record15_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record15_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record15.set("organization_id", record15_organization_idLookup.id);
    record15.set("member_id", "MEM006");
    record15.set("amount", 3500);
    record15.set("payment_date", "2025-01-05");
    record15.set("payment_method", "Virement");
    record15.set("status", "unpaid");
    record15.set("recorded_by", "agent@aitmc.com");
    record15.set("notes", "Pending payment");
  try {
    app.save(record15);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record16 = new Record(collection);
    const record16_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record16_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record16.set("organization_id", record16_organization_idLookup.id);
    record16.set("member_id", "MEM007");
    record16.set("amount", 5000);
    record16.set("payment_date", "2025-01-05");
    record16.set("payment_method", "Mobile Money");
    record16.set("status", "paid");
    record16.set("recorded_by", "agent@aitmc.com");
    record16.set("notes", "Payment for parking");
  try {
    app.save(record16);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record17 = new Record(collection);
    const record17_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record17_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record17.set("organization_id", record17_organization_idLookup.id);
    record17.set("member_id", "MEM008");
    record17.set("amount", 4000);
    record17.set("payment_date", "2025-01-05");
    record17.set("payment_method", "Especes");
    record17.set("status", "late");
    record17.set("recorded_by", "agent@aitmc.com");
    record17.set("notes", "Late payment");
  try {
    app.save(record17);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record18 = new Record(collection);
    const record18_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record18_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record18.set("organization_id", record18_organization_idLookup.id);
    record18.set("member_id", "MEM009");
    record18.set("amount", 3500);
    record18.set("payment_date", "2025-01-04");
    record18.set("payment_method", "Mobile Money");
    record18.set("status", "paid");
    record18.set("recorded_by", "agent@aitmc.com");
    record18.set("notes", "Payment for parking");
  try {
    app.save(record18);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record19 = new Record(collection);
    const record19_organization_idLookup = app.findFirstRecordByFilter("organizations", "name='AITMC'");
    if (!record19_organization_idLookup) { throw new Error("Lookup failed for organization_id: no record in 'organizations' matching \"name='AITMC'\""); }
    record19.set("organization_id", record19_organization_idLookup.id);
    record19.set("member_id", "MEM010");
    record19.set("amount", 5000);
    record19.set("payment_date", "2025-01-04");
    record19.set("payment_method", "Virement");
    record19.set("status", "paid");
    record19.set("recorded_by", "agent@aitmc.com");
    record19.set("notes", "Bank transfer");
  try {
    app.save(record19);
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
