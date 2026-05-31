import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import BreedingRecord from '@/lib/db/models/BreedingRecord';
import Pair from '@/lib/db/models/Pair';

// GET /api/breeding - Get breeding records (optionally filtered by pairId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pairId');

    await connectDB();
    
    let query = {};
    if (pairId) {
      query = { pairId };
    }

    const records = await BreedingRecord.find(query)
      .populate('pairId', 'pairNumber maleName femaleName species')
      .sort({ eggDate: -1 })
      .lean();
    
    const formattedRecords = records.map(record => ({
      ...record,
      _id: record._id.toString(),
      pairId: record.pairId ? {
        _id: record.pairId._id.toString(),
        pairNumber: record.pairId.pairNumber,
        maleName: record.pairId.maleName,
        femaleName: record.pairId.femaleName,
        species: record.pairId.species,
      } : null,
      eggDate: record.eggDate?.toISOString(),
      hatchDate: record.hatchDate?.toISOString(),
      createdAt: record.createdAt?.toISOString(),
      updatedAt: record.updatedAt?.toISOString(),
    }));
    
    return NextResponse.json(formattedRecords);
  } catch (error) {
    console.error('Error fetching breeding records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breeding records' },
      { status: 500 }
    );
  }
}

// POST /api/breeding - Create a new breeding record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.pairId || !body.eggDate || !body.eggCount) {
      return NextResponse.json(
        { error: 'Missing required fields: pairId, eggDate, eggCount' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if pair exists
    const pair = await Pair.findById(body.pairId);
    if (!pair) {
      return NextResponse.json(
        { error: 'Pair not found' },
        { status: 404 }
      );
    }
    
    const record = await BreedingRecord.create({
      pairId: body.pairId,
      eggDate: new Date(body.eggDate),
      eggCount: body.eggCount,
      hatchDate: body.hatchDate ? new Date(body.hatchDate) : null,
      chickCount: body.chickCount || 0,
      chickStatus: body.chickStatus || '',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update pair status to breeding
    await Pair.findByIdAndUpdate(body.pairId, { 
      status: 'breeding',
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...record.toObject(),
        _id: record._id.toString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating breeding record:', error);
    return NextResponse.json(
      { error: 'Failed to create breeding record: ' + (error as Error).message },
      { status: 500 }
    );
  }
}