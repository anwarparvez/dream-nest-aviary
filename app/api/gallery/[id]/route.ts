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
    
    // Check visibility
    if (image.visibility === 'private' && (!session || session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({
      ...image,
      _id: image._id.toString(),
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
    
    if (!session || session.user.role !== 'admin') {
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
    
    return NextResponse.json({
      success: true,
      data: {
        ...image.toObject(),
        _id: image._id.toString(),
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
    
    if (!session || session.user.role !== 'admin') {
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