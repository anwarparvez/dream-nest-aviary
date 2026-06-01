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
    
    // Cast model to any to avoid TypeScript issues
    const PairModel = Pair as any;
    
    const pair = await PairModel.findById(id)
      .populate('projectId', 'name type')
      .lean();
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    const BreedingRecordModel = BreedingRecord as any;
    const breedingRecords = await BreedingRecordModel.find({ pairId: id })
      .sort({ eggDate: -1 })
      .lean();
    
    const totalEggs = breedingRecords.reduce((sum: number, record: any) => sum + record.eggCount, 0);
    const totalChicks = breedingRecords.reduce((sum: number, record: any) => sum + (record.chickCount || 0), 0);
    const hatchRate = totalEggs > 0 ? (totalChicks / totalEggs) * 100 : 0;
    
    const pairAny = pair as any;
    
    return NextResponse.json({
      _id: pairAny._id?.toString() || '',
      pairNumber: pairAny.pairNumber || '',
      projectId: pairAny.projectId ? {
        _id: pairAny.projectId._id?.toString() || '',
        name: pairAny.projectId.name || '',
        type: pairAny.projectId.type || '',
      } : null,
      species: pairAny.species || '',
      breed: pairAny.breed || '',
      maleName: pairAny.maleName || '',
      maleId: pairAny.maleId || '',
      femaleName: pairAny.femaleName || '',
      femaleId: pairAny.femaleId || '',
      ringNumber: pairAny.ringNumber || '',
      color: pairAny.color || '',
      age: pairAny.age || '',
      purchaseDate: pairAny.purchaseDate?.toISOString(),
      purchasePrice: pairAny.purchasePrice || 0,
      notes: pairAny.notes || '',
      images: pairAny.images || [],
      status: pairAny.status || 'active',
      createdAt: pairAny.createdAt?.toISOString(),
      updatedAt: pairAny.updatedAt?.toISOString(),
      breedingStats: {
        totalBreedings: breedingRecords.length,
        totalEggs,
        totalChicks,
        hatchRate: hatchRate.toFixed(2),
      },
      breedingRecords: breedingRecords.map((record: any) => ({
        _id: record._id?.toString() || '',
        pairId: record.pairId?.toString() || '',
        eggDate: record.eggDate?.toISOString(),
        eggCount: record.eggCount || 0,
        hatchDate: record.hatchDate?.toISOString(),
        chickCount: record.chickCount || 0,
        chickStatus: record.chickStatus || '',
        notes: record.notes || '',
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
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
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
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
    
    // Cast model to any to avoid TypeScript issues
    const PairModel = Pair as any;
    
    // Check if pair number already exists (excluding current pair)
    const existingPair = await PairModel.findOne({
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
    
    const pair = await PairModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('projectId', 'name type');
    
    if (!pair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }
    
    const pairObj = pair.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: pairObj._id.toString(),
        pairNumber: pairObj.pairNumber,
        projectId: pairObj.projectId ? {
          _id: (pairObj.projectId as any)._id.toString(),
          name: (pairObj.projectId as any).name,
          type: (pairObj.projectId as any).type,
        } : null,
        species: pairObj.species,
        breed: pairObj.breed,
        maleName: pairObj.maleName,
        maleId: pairObj.maleId || '',
        femaleName: pairObj.femaleName,
        femaleId: pairObj.femaleId || '',
        ringNumber: pairObj.ringNumber || '',
        color: pairObj.color || '',
        age: pairObj.age || '',
        purchaseDate: pairObj.purchaseDate?.toISOString(),
        purchasePrice: pairObj.purchasePrice,
        notes: pairObj.notes || '',
        status: pairObj.status,
        createdAt: pairObj.createdAt?.toISOString(),
        updatedAt: pairObj.updatedAt?.toISOString(),
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
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    // Cast models to any to avoid TypeScript issues
    const BreedingRecordModel = BreedingRecord as any;
    const PairModel = Pair as any;
    
    // Delete associated breeding records
    await BreedingRecordModel.deleteMany({ pairId: id });
    
    const pair = await PairModel.findByIdAndDelete(id);
    
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