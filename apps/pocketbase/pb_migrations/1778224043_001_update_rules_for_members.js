/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("members");
  collection.listRule = "organization_id = @request.auth.organization_id";
  collection.viewRule = "organization_id = @request.auth.organization_id";
  collection.createRule = "organization_id = @request.auth.organization_id";
  collection.updateRule = "organization_id = @request.auth.organization_id";
  collection.deleteRule = "organization_id = @request.auth.organization_id";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("members");
  collection.listRule = "organization_id = @request.auth.organization_id";
  collection.viewRule = "organization_id = @request.auth.organization_id";
  collection.createRule = "@request.auth.id != ''";
  collection.updateRule = "organization_id = @request.auth.organization_id";
  collection.deleteRule = "organization_id = @request.auth.organization_id";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
