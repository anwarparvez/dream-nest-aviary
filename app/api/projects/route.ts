import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const projects = await Project.find({ 
      createdBy: session.user.id 
    }).sort({ createdAt: -1 }).lean();
    
    // Convert MongoDB documents to plain objects with string IDs
    const formattedProjects = projects.map(project => ({
      ...project,
      _id: project._id.toString(),
      createdAt: project.createdAt?.toISOString(),
      updatedAt: project.updatedAt?.toISOString(),
      startDate: project.startDate?.toISOString(),
    }));
    
    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.startDate || !body.targetPairCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    const project = await Project.create({
      name: body.name,
      type: body.type,
      startDate: new Date(body.startDate),
      targetPairCount: body.targetPairCount,
      status: body.status || 'active',
      notes: body.notes || '',
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...project.toObject(),
        _id: project._id.toString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}