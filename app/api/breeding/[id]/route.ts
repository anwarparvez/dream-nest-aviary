import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import BreedingRecord from '@/lib/db/models/BreedingRecord';
import Pair from '@/lib/db/models/Pair';

// GET /api/breeding/[id] - Get a single breeding record
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
    
    const record = await BreedingRecord.findById(id)
      .populate('pairId', 'pairNumber maleName femaleName species breed')
      .lean();
    
    if (!record) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      ...record,
      _id: record._id.toString(),
      pairId: record.pairId ? {
        _id: record.pairId._id.toString(),
        pairNumber: record.pairId.pairNumber,
        maleName: record.pairId.maleName,
        femaleName: record.pairId.femaleName,
        species: record.pairId.species,
        breed: record.pairId.breed,
      } : null,
      eggDate: record.eggDate?.toISOString(),
      hatchDate: record.hatchDate?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching breeding record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breeding record' },
      { status: 500 }
    );
  }
}

// PUT /api/breeding/[id] - Update a breeding record
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
    
    await connectDB();
    
    const updateData: any = {
      eggCount: body.eggCount,
      chickCount: body.chickCount || 0,
      chickStatus: body.chickStatus || '',
      notes: body.notes || '',
      updatedAt: new Date(),
    };
    
    if (body.eggDate) updateData.eggDate = new Date(body.eggDate);
    if (body.hatchDate) updateData.hatchDate = new Date(body.hatchDate);
    
    const record = await BreedingRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!record) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...record.toObject(),
        _id: record._id.toString(),
      }
    });
  } catch (error) {
    console.error('Error updating breeding record:', error);
    return NextResponse.json(
      { error: 'Failed to update breeding record' },
      { status: 500 }
    );
  }
}

// DELETE /api/breeding/[id] - Delete a breeding record
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
    
    const record = await BreedingRecord.findByIdAndDelete(id);
    
    if (!record) {
      return NextResponse.json({ error: 'Breeding record not found' }, { status: 404 });
    }
    
    // Check if pair has any remaining breeding records
    const remainingRecords = await BreedingRecord.countDocuments({ pairId: record.pairId });
    if (remainingRecords === 0) {
      await Pair.findByIdAndUpdate(record.pairId, { 
        status: 'active',
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting breeding record:', error);
    return NextResponse.json(
      { error: 'Failed to delete breeding record' },
      { status: 500 }
    );
  }
}