import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Pair from '@/lib/db/models/Pair';
import Project from '@/lib/db/models/Project';

// GET /api/pairs - Get pairs (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    await connectDB();
    
    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const pairs = await Pair.find(query)
      .populate('projectId', 'name type')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedPairs = pairs.map((pair: any) => ({
      _id: pair._id?.toString() || '',
      pairNumber: pair.pairNumber || '',
      projectId: pair.projectId ? {
        _id: pair.projectId._id?.toString() || '',
        name: pair.projectId.name || '',
        type: pair.projectId.type || '',
      } : null,
      species: pair.species || '',
      breed: pair.breed || '',
      maleName: pair.maleName || '',
      maleId: pair.maleId || '',
      femaleName: pair.femaleName || '',
      femaleId: pair.femaleId || '',
      ringNumber: pair.ringNumber || '',
      color: pair.color || '',
      age: pair.age || '',
      purchaseDate: pair.purchaseDate?.toISOString(),
      purchasePrice: pair.purchasePrice || 0,
      notes: pair.notes || '',
      images: pair.images || [],
      status: pair.status || 'active',
      createdAt: pair.createdAt?.toISOString(),
      updatedAt: pair.updatedAt?.toISOString(),
    }));
    
    return NextResponse.json(formattedPairs);
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 }
    );
  }
}

// POST /api/pairs - Create a new pair
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['pairNumber', 'projectId', 'species', 'breed', 'maleName', 'femaleName', 'purchaseDate', 'purchasePrice'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    await connectDB();
    
    // Check if project exists
    const project = await Project.findById(body.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check if pair number is unique within the project
    const existingPair = await Pair.findOne({ 
      projectId: body.projectId, 
      pairNumber: body.pairNumber 
    });
    
    if (existingPair) {
      return NextResponse.json(
        { error: 'Pair number already exists in this project' },
        { status: 400 }
      );
    }
    
    const pair = await Pair.create({
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
      purchasePrice: body.purchasePrice,
      notes: body.notes || '',
      images: body.images || [],
      status: body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: pair._id.toString(),
        pairNumber: pair.pairNumber,
        projectId: pair.projectId.toString(),
        species: pair.species,
        breed: pair.breed,
        maleName: pair.maleName,
        maleId: pair.maleId || '',
        femaleName: pair.femaleName,
        femaleId: pair.femaleId || '',
        ringNumber: pair.ringNumber || '',
        color: pair.color || '',
        age: pair.age || '',
        purchaseDate: pair.purchaseDate.toISOString(),
        purchasePrice: pair.purchasePrice,
        notes: pair.notes || '',
        status: pair.status,
        createdAt: pair.createdAt.toISOString(),
        updatedAt: pair.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating pair:', error);
    return NextResponse.json(
      { error: 'Failed to create pair: ' + (error as Error).message },
      { status: 500 }
    );
  }
}