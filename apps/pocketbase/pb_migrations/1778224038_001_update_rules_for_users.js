/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  collection.viewRule = "id = @request.auth.id || @request.auth.role = 'super-admin'";
  collection.createRule = "@request.auth.role = 'super-admin'";
  collection.updateRule = "id = @request.auth.id || @request.auth.role = 'super-admin'";
  collection.deleteRule = "id = @request.auth.id || @request.auth.role = 'super-admin'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.createRule = "";
  collection.updateRule = "id = @request.auth.id";
  collection.deleteRule = "id = @request.auth.id";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
