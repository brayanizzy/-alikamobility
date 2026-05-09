/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("qrcodes");
  collection.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'agent'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("qrcodes");
  collection.createRule = "organization_id = @request.auth.organization_id";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
