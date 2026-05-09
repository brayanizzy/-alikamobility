/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("payments");
  const field = collection.fields.getByName("payment_method");
  field.values = ["Esp\u00e8ces", "Mobile Money", "Virement"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("payments");
  const field = collection.fields.getByName("payment_method");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["Mobile Money", "Especes", "Virement"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})
