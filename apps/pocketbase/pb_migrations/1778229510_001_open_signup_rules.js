/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "@request.auth.role = 'super-admin'";
  app.save(users);
})
