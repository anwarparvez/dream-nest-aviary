import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Bird from '@/lib/db/models/Bird';

// GET /api/birds - Get birds (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    await connectDB();
    
    const BirdModel = Bird as any;
    
    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const birds = await BirdModel.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedBirds = birds.map((bird: any) => ({
      _id: bird._id?.toString() || '',
      birdNumber: bird.birdNumber || '',
      projectId: bird.projectId?.toString() || '',
      species: bird.species || 'Chicken',
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
    }));
    
    return NextResponse.json(formattedBirds);
  } catch (error) {
    console.error('Error fetching birds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch birds' },
      { status: 500 }
    );
  }
}

// POST /api/birds - Create a new bird
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.birdNumber || !body.projectId || !body.name || !body.breed || !body.purchaseDate) {
      return NextResponse.json(
        { error: 'Missing required fields: birdNumber, projectId, name, breed, purchaseDate' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const BirdModel = Bird as any;
    
    const bird = await BirdModel.create({
      birdNumber: body.birdNumber,
      projectId: body.projectId,
      species: body.species || 'Chicken',
      breed: body.breed,
      name: body.name,
      age: body.age || '',
      color: body.color || '',
      purchaseDate: new Date(body.purchaseDate),
      purchasePrice: body.purchasePrice || 0,
      status: body.status || 'active',
      notes: body.notes || '',
      images: body.images || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: bird._id.toString(),
        birdNumber: bird.birdNumber,
        projectId: bird.projectId.toString(),
        species: bird.species,
        breed: bird.breed,
        name: bird.name,
        age: bird.age,
        color: bird.color,
        purchaseDate: bird.purchaseDate.toISOString(),
        purchasePrice: bird.purchasePrice,
        status: bird.status,
        notes: bird.notes,
        createdAt: bird.createdAt.toISOString(),
        updatedAt: bird.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bird:', error);
    return NextResponse.json(
      { error: 'Failed to create bird: ' + (error as Error).message },
      { status: 500 }
    );
  }
}