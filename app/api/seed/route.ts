import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@dreamnest.com' });
    
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Default user already exists',
        user: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create default admin user
    const adminUser = await User.create({
      email: 'admin@dreamnest.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Default user created successfully',
      user: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@dreamnest.com',
        password: 'admin123'
      }
    });
    
  } catch (error) {
    console.error('Error creating default user:', error);
    return NextResponse.json(
      { error: 'Failed to create default user' },
      { status: 500 }
    );
  }
}