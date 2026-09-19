db = db.getSiblingDB('restaurantdb');

db.createCollection('tables');
db.createCollection('reservations');

const now = new Date();

if (db.tables.countDocuments() === 0) {
  db.tables.insertMany([
    { number: 1, capacity: 2, location: 'window',  is_active: true, created_at: now, updated_at: now },
    { number: 2, capacity: 4, location: 'window',  is_active: true, created_at: now, updated_at: now },
    { number: 3, capacity: 4, location: 'patio',   is_active: true, created_at: now, updated_at: now },
    { number: 4, capacity: 6, location: 'patio',   is_active: true, created_at: now, updated_at: now },
    { number: 5, capacity: 8, location: 'private', is_active: true, created_at: now, updated_at: now },
    { number: 6, capacity: 2, location: 'bar',     is_active: true, created_at: now, updated_at: now },
  ]);
  print('Seed: 6 tables inserted.');
} else {
  print('Seed: tables already exist, skipping.');
}

if (db.reservations.countDocuments() === 0) {.
  const at = (daysAhead, hour, minute) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + daysAhead);
    d.setUTCHours(hour, minute, 0, 0);
    return d;
  };
  const table2 = db.tables.findOne({ number: 2 });
  const table4 = db.tables.findOne({ number: 4 });

  db.reservations.insertMany([
    {
      guest_name: 'Ana Petrovska',
      guest_email: 'ana.petrovska@example.com',
      guest_phone: '+38970111222',
      table: table2._id,
      party_size: 4,
      reservation_date: at(1, 19, 0),
      duration_minutes: 90,
      status: 'confirmed',
      special_requests: 'Window seat, birthday dinner',
      notes: '',
      created_at: now,
      updated_at: now,
    },
    {
      guest_name: 'Marko Stojanov',
      guest_email: 'marko.stojanov@example.com',
      guest_phone: '+38971333444',
      table: table4._id,
      party_size: 6,
      reservation_date: at(2, 20, 30),
      duration_minutes: 120,
      status: 'pending',
      special_requests: 'One vegetarian guest',
      notes: '',
      created_at: now,
      updated_at: now,
    },
  ]);
  print('Seed: 2 reservations inserted.');
} else {
  print('Seed: reservations already exist, skipping.');
}
