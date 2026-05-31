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

    // Populate projectId to get project details
    const pairs = await Pair.find(query)
      .populate('projectId', 'name type')
      .sort({ createdAt: -1 })
      .lean();
    
    // Format the response
    const formattedPairs = pairs.map(pair => ({
      ...pair,
      _id: pair._id.toString(),
      projectId: pair.projectId ? {
        _id: pair.projectId._id.toString(),
        name: pair.projectId.name,
        type: pair.projectId.type,
      } : null,
      createdAt: pair.createdAt?.toISOString(),
      updatedAt: pair.updatedAt?.toISOString(),
      purchaseDate: pair.purchaseDate?.toISOString(),
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
    
    if (!session || session.user.role !== 'admin') {
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
    
    // Return with populated project data
    const populatedPair = await Pair.findById(pair._id)
      .populate('projectId', 'name type')
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        ...populatedPair,
        _id: populatedPair._id.toString(),
        projectId: populatedPair.projectId ? {
          _id: populatedPair.projectId._id.toString(),
          name: populatedPair.projectId.name,
          type: populatedPair.projectId.type,
        } : null,
        purchaseDate: populatedPair.purchaseDate?.toISOString(),
        createdAt: populatedPair.createdAt?.toISOString(),
        updatedAt: populatedPair.updatedAt?.toISOString(),
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