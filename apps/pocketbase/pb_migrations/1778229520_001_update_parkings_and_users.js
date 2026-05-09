/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // --- 1. Parkings ---
  const parkings = app.findCollectionByNameOrId("parkings");
  
  const parkingFields = [
    { "name": "manager_name", "type": "text" },
    { "name": "manager_phone", "type": "text" },
    { "name": "gps_coordinates", "type": "text" },
    { "name": "daily_target", "type": "number", "min": 0 },
    { "name": "status", "type": "select", "values": ["active", "suspended"], "maxSelect": 1 }
  ];

  for (const field of parkingFields) {
    if (!parkings.fields.getByName(field.name)) {
      parkings.fields.add(new Field(field));
    }
  }
  app.save(parkings);

  // --- 2. Users ---
  const users = app.findCollectionByNameOrId("users");
  
  const userFields = [
    { "name": "parking_id", "type": "text" },
    { "name": "device_id", "type": "text" },
    { "name": "status", "type": "select", "values": ["active", "suspended"], "maxSelect": 1 }
  ];

  for (const field of userFields) {
    if (!users.fields.getByName(field.name)) {
      users.fields.add(new Field(field));
    }
  }
  
  // Set default rule for all collections to ensure multi-tenant security
  users.listRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  users.viewRule = "organization_id = @request.auth.organization_id || @request.auth.role = 'super-admin'";
  app.save(users);

}, (app) => {
  // Revert
})
