import { NextResponse } from 'next/server';
import { connectDB, isDBConnected } from '@/lib/db/mongodb';

export async function GET() {
  try {
    // Only check database if we're not in build time
    let dbStatus = 'skipped';
    
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      const isConnected = await isDBConnected();
      dbStatus = isConnected ? 'connected' : 'disconnected';
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV,
      buildTime: process.env.NEXT_PHASE === 'phase-production-build'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 500 }
    );
  }
}