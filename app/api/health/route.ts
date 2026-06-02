import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';

export async function GET() {
  try {
    // Check database connection
    await connectDB();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}