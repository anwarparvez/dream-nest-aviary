// scripts/seed-default-user.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'dream_nest_aviary';

async function createDefaultUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: 'admin@dreamnest.com' });
    
    if (existingUser) {
      console.log('Default user already exists!');
      console.log('Email: admin@dreamnest.com');
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create default user
    const defaultUser = {
      email: 'admin@dreamnest.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(defaultUser);
    
    console.log('✅ Default user created successfully!');
    console.log('📧 Email: admin@dreamnest.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: Admin');
    console.log(`🆔 User ID: ${result.insertedId}`);
    
  } catch (error) {
    console.error('Error creating default user:', error);
  } finally {
    await client.close();
  }
}

// Run the function
createDefaultUser();