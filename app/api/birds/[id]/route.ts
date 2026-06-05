import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Bird from '@/lib/db/models/Bird';

// DELETE /api/birds/[id] - Delete a bird
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
    
    const BirdModel = Bird as any;
    const bird = await BirdModel.findByIdAndDelete(id);
    
    if (!bird) {
      return NextResponse.json({ error: 'Bird not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bird:', error);
    return NextResponse.json(
      { error: 'Failed to delete bird' },
      { status: 500 }
    );
  }
}

// GET /api/birds/[id] - Get a single bird
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
    
    const BirdModel = Bird as any;
    const bird = await BirdModel.findById(id).lean();
    
    if (!bird) {
      return NextResponse.json({ error: 'Bird not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      _id: bird._id?.toString() || '',
      birdNumber: bird.birdNumber || '',
      projectId: bird.projectId?.toString() || '',
      species: bird.species || '',
      breed: bird.breed || '',
      name: bird.name || '',
      age: bird.age || '',
      color: bird.color || '',
      purchaseDate: bird.purchaseDate?.toISOString(),
      purchasePrice: bird.purchasePrice || 0,
      status: bird.status || 'active',
      notes: bird.notes || '',
      images: bird.images || [],
      createdAt: bird.createdAt?.toISOString(),
      updatedAt: bird.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching bird:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bird' },
      { status: 500 }
    );
  }
}

// PUT /api/birds/[id] - Update a bird
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
    await connectDB();
    
    const BirdModel = Bird as any;
    
    const bird = await BirdModel.findByIdAndUpdate(
      id,
      {
        birdNumber: body.birdNumber,
        breed: body.breed,
        name: body.name,
        age: body.age,
        color: body.color,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        purchasePrice: body.purchasePrice,
        status: body.status,
        notes: body.notes,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!bird) {
      return NextResponse.json({ error: 'Bird not found' }, { status: 404 });
    }
    
    const birdObj = bird.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: birdObj._id.toString(),
        birdNumber: birdObj.birdNumber,
        projectId: birdObj.projectId.toString(),
        species: birdObj.species,
        breed: birdObj.breed,
        name: birdObj.name,
        age: birdObj.age,
        color: birdObj.color,
        purchaseDate: birdObj.purchaseDate?.toISOString(),
        purchasePrice: birdObj.purchasePrice,
        status: birdObj.status,
        notes: birdObj.notes,
        createdAt: birdObj.createdAt?.toISOString(),
        updatedAt: birdObj.updatedAt?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating bird:', error);
    return NextResponse.json(
      { error: 'Failed to update bird' },
      { status: 500 }
    );
  }
}