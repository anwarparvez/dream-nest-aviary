import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import BirdImage from '@/lib/db/models/BirdImage';

// GET /api/gallery/public - Get public images for visitors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    const breed = searchParams.get('breed');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    await connectDB();
    
    // Cast model to any to avoid TypeScript issues
    const BirdImageModel = BirdImage as any;
    
    let query: any = { visibility: 'public' };
    
    // Filter by species
    if (species && species !== 'all') {
      query.species = species;
    }
    
    // Filter by breed
    if (breed && breed !== 'all') {
      query.breed = breed;
    }
    
    // Search by title, breed, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { breed: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [images, total] = await Promise.all([
      BirdImageModel.find(query)
        .populate('projectId', 'name')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BirdImageModel.countDocuments(query),
    ]);
    
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
      } : null,
      uploadedBy: image.uploadedBy ? {
        _id: image.uploadedBy._id?.toString() || '',
        name: image.uploadedBy.name || '',
      } : null,
      createdAt: image.createdAt?.toISOString(),
    }));
    
    return NextResponse.json({
      images: formattedImages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching public gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery images' },
      { status: 500 }
    );
  }
}