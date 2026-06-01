import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import BirdImage from '@/lib/db/models/BirdImage';

// GET /api/gallery/[id] - Get a single image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    await connectDB();
    
    const image = await BirdImage.findById(id)
      .populate('projectId', 'name type')
      .populate('pairId', 'pairNumber maleName femaleName breed')
      .populate('uploadedBy', 'name email')
      .lean();
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Type assertion for the image object
    const imageAny = image as any;
    
    // Check visibility
    if (imageAny.visibility === 'private' && (!session || !session.user || (session.user as any).role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({
      ...imageAny,
      _id: imageAny._id?.toString() || '',
      projectId: imageAny.projectId ? {
        _id: imageAny.projectId._id?.toString() || '',
        name: imageAny.projectId.name || '',
        type: imageAny.projectId.type || '',
      } : null,
      pairId: imageAny.pairId ? {
        _id: imageAny.pairId._id?.toString() || '',
        pairNumber: imageAny.pairId.pairNumber || '',
        maleName: imageAny.pairId.maleName || '',
        femaleName: imageAny.pairId.femaleName || '',
        breed: imageAny.pairId.breed || '',
      } : null,
      uploadedBy: imageAny.uploadedBy ? {
        _id: imageAny.uploadedBy._id?.toString() || '',
        name: imageAny.uploadedBy.name || '',
        email: imageAny.uploadedBy.email || '',
      } : null,
      createdAt: imageAny.createdAt?.toISOString(),
      updatedAt: imageAny.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// PUT /api/gallery/[id] - Update an image
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
    
    const image = await BirdImage.findByIdAndUpdate(
      id,
      {
        title: body.title,
        species: body.species,
        breed: body.breed,
        tags: body.tags,
        description: body.description,
        visibility: body.visibility,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    const imageObj = image.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        ...imageObj,
        _id: imageObj._id.toString(),
      }
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE /api/gallery/[id] - Delete an image
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
    
    const image = await BirdImage.findByIdAndDelete(id);
    
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}