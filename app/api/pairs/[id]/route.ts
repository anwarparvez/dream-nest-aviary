import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Pair from '@/lib/db/models/Pair';
import BreedingRecord from '@/lib/db/models/BreedingRecord';

// GET /api/pairs/[id] - Get a single pair
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    
    const pair = await Pair.findById(id)
      .populate('projectId', 'name type')
      .lean();
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    const breedingRecords = await BreedingRecord.find({ pairId: id })
      .sort({ eggDate: -1 })
      .lean();
    
    const totalEggs = breedingRecords.reduce((sum, record) => sum + record.eggCount, 0);
    const totalChicks = breedingRecords.reduce((sum, record) => sum + (record.chickCount || 0), 0);
    const hatchRate = totalEggs > 0 ? (totalChicks / totalEggs) * 100 : 0;
    
    return NextResponse.json({
      ...pair,
      _id: pair._id.toString(),
      projectId: pair.projectId ? {
        _id: pair.projectId._id.toString(),
        name: pair.projectId.name,
        type: pair.projectId.type,
      } : null,
      breedingStats: {
        totalBreedings: breedingRecords.length,
        totalEggs,
        totalChicks,
        hatchRate: hatchRate.toFixed(2),
      },
      breedingRecords: breedingRecords.map(record => ({
        ...record,
        _id: record._id.toString(),
        pairId: record.pairId.toString(),
        eggDate: record.eggDate?.toISOString(),
        hatchDate: record.hatchDate?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching pair:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pair' },
      { status: 500 }
    );
  }
}

// PUT /api/pairs/[id] - Update a pair
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.pairNumber || !body.projectId || !body.species || !body.breed || 
        !body.maleName || !body.femaleName || !body.purchaseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if pair number already exists (excluding current pair)
    const existingPair = await Pair.findOne({
      pairNumber: body.pairNumber,
      projectId: body.projectId,
      _id: { $ne: id }
    });
    
    if (existingPair) {
      return NextResponse.json(
        { error: 'Pair number already exists in this project' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {
      pairNumber: body.pairNumber,
      projectId: body.projectId,
      species: body.species,
      breed: body.breed,
      maleName: body.maleName,
      maleId: body.maleId || '',
      femaleName: body.femaleName,
      femaleId: body.femaleId || '',
      ringNumber: body.ringNumber || '',
      color: body.color || '',
      age: body.age || '',
      purchaseDate: new Date(body.purchaseDate),
      purchasePrice: body.purchasePrice || 0,
      notes: body.notes || '',
      status: body.status || 'active',
      updatedAt: new Date(),
    };
    
    const pair = await Pair.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectId', 'name type');
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...pair.toObject(),
        _id: pair._id.toString(),
        projectId: pair.projectId ? {
          _id: pair.projectId._id.toString(),
          name: pair.projectId.name,
          type: pair.projectId.type,
        } : null,
        purchaseDate: pair.purchaseDate?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating pair:', error);
    return NextResponse.json(
      { error: 'Failed to update pair: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/pairs/[id] - Delete a pair
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    // Delete associated breeding records
    await BreedingRecord.deleteMany({ pairId: id });
    
    const pair = await Pair.findByIdAndDelete(id);
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pair:', error);
    return NextResponse.json(
      { error: 'Failed to delete pair' },
      { status: 500 }
    );
  }
}