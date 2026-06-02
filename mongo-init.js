// Switch to the database
db = db.getSiblingDB(process.env.MONGODB_DB_NAME || 'dream_nest_aviary');

// Create collections
db.createCollection('users');
db.createCollection('projects');
db.createCollection('pairs');
db.createCollection('breedingrecords');
db.createCollection('expenses');
db.createCollection('birdimages');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ createdBy: 1, createdAt: -1 });
db.pairs.createIndex({ projectId: 1, pairNumber: 1 }, { unique: true });
db.breedingrecords.createIndex({ pairId: 1, eggDate: -1 });
db.expenses.createIndex({ projectId: 1, date: -1 });
db.birdimages.createIndex({ createdAt: -1 });
db.birdimages.createIndex({ visibility: 1, species: 1 });

// Create default admin user (password will be hashed by the app)
print('Database initialized successfully!');