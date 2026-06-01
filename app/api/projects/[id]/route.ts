import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Expense from '@/lib/db/models/Expense';

// GET /api/projects/[id] - Get a single project
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
    
    const project = await Project.findById(id).lean();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get pair count
    const pairCount = await Pair.countDocuments({ projectId: id });
    
    const projectAny = project as any;
    
    return NextResponse.json({
      _id: projectAny._id?.toString() || '',
      name: projectAny.name || '',
      type: projectAny.type || '',
      startDate: projectAny.startDate?.toISOString(),
      targetPairCount: projectAny.targetPairCount || 0,
      status: projectAny.status || 'active',
      notes: projectAny.notes || '',
      createdAt: projectAny.createdAt?.toISOString(),
      updatedAt: projectAny.updatedAt?.toISOString(),
      pairCount,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
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
    
    const project = await Project.findByIdAndUpdate(
      id,
      {
        name: body.name,
        type: body.type,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        targetPairCount: body.targetPairCount,
        status: body.status,
        notes: body.notes || '',
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const projectObj = project.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: projectObj._id.toString(),
        name: projectObj.name,
        type: projectObj.type,
        startDate: projectObj.startDate?.toISOString(),
        targetPairCount: projectObj.targetPairCount,
        status: projectObj.status,
        notes: projectObj.notes || '',
        createdAt: projectObj.createdAt?.toISOString(),
        updatedAt: projectObj.updatedAt?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
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
    
    // Delete associated pairs and expenses
    await Pair.deleteMany({ projectId: id });
    await Expense.deleteMany({ projectId: id });
    
    const project = await Project.findByIdAndDelete(id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}