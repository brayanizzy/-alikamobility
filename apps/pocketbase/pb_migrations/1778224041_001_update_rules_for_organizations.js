/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("organizations");
  collection.listRule = "@request.auth.role = 'super-admin'";
  collection.viewRule = "@request.auth.role = 'super-admin'";
  collection.createRule = "@request.auth.role = 'super-admin'";
  collection.updateRule = "@request.auth.role = 'super-admin'";
  collection.deleteRule = "@request.auth.role = 'super-admin'";
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("organizations");
  collection.listRule = "@request.auth.role = 'super-admin'";
  collection.viewRule = "@request.auth.role = 'super-admin'";
  collection.createRule = "@request.auth.role = 'super-admin'";
  collection.updateRule = "@request.auth.role = 'super-admin'";
  collection.deleteRule = "@request.auth.role = 'super-admin'";
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
