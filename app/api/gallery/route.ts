import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import BirdImage from '@/lib/db/models/BirdImage';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';

// GET /api/gallery - Get images (filtered by query params)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const projectId = searchParams.get('projectId');
    const pairId = searchParams.get('pairId');
    const species = searchParams.get('species');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search');

    await connectDB();
    
    let query: any = {};
    
    // Filter by project
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Filter by pair
    if (pairId) {
      query.pairId = pairId;
    }
    
    // Filter by species
    if (species && species !== 'all') {
      query.species = species;
    }
    
    // Filter by visibility (only admin can see private images)
    if (visibility) {
      query.visibility = visibility;
    } else if (!session || !session.user || (session.user as any).role !== 'admin') {
      // Public visitors only see public images
      query.visibility = 'public';
    }
    
    // Search by title, breed, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    const images = await BirdImage.find(query)
      .populate('projectId', 'name type')
      .populate('pairId', 'pairNumber maleName femaleName')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedImages = images.map((image: any) => ({
      _id: image._id?.toString() || '',
      title: image.title || '',
      species: image.species || '',
      breed: image.breed || '',
      tags: image.tags || [],
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      visibility: image.visibility || 'public',
      projectId: image.projectId ? {
        _id: image.projectId._id?.toString() || '',
        name: image.projectId.name || '',
        type: image.projectId.type || '',
      } : null,
      pairId: image.pairId ? {
        _id: image.pairId._id?.toString() || '',
        pairNumber: image.pairId.pairNumber || '',
        maleName: image.pairId.maleName || '',
        femaleName: image.pairId.femaleName || '',
      } : null,
      uploadedBy: image.uploadedBy ? {
        _id: image.uploadedBy._id?.toString() || '',
        name: image.uploadedBy.name || '',
        email: image.uploadedBy.email || '',
      } : null,
      createdAt: image.createdAt?.toISOString(),
    }));
    
    return NextResponse.json(formattedImages);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}

// POST /api/gallery - Upload a new image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.species || !body.breed || !body.imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, species, breed, imageUrl' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // If projectId is provided, verify it exists
    if (body.projectId) {
      const project = await Project.findById(body.projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
    }
    
    // If pairId is provided, verify it exists
    if (body.pairId) {
      const pair = await Pair.findById(body.pairId);
      if (!pair) {
        return NextResponse.json(
          { error: 'Pair not found' },
          { status: 404 }
        );
      }
    }
    
    const image = await BirdImage.create({
      title: body.title,
      species: body.species,
      breed: body.breed,
      tags: body.tags || [],
      description: body.description || '',
      imageUrl: body.imageUrl,
      uploadedBy: (session.user as any).id,
      projectId: body.projectId || null,
      pairId: body.pairId || null,
      visibility: body.visibility || 'public',
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: image._id.toString(),
        title: image.title,
        species: image.species,
        breed: image.breed,
        tags: image.tags,
        description: image.description,
        imageUrl: image.imageUrl,
        visibility: image.visibility,
        createdAt: image.createdAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}