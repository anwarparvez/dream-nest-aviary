import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Cast model to any to avoid TypeScript issues
    const ProjectModel = Project as any;
    const PairModel = Pair as any;
    
    const projects = await ProjectModel.find({ 
      createdBy: (session.user as any).id 
    }).sort({ createdAt: -1 }).lean();
    
    // Get pair counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project: any) => {
        const pairCount = await PairModel.countDocuments({ projectId: project._id });
        return {
          _id: project._id?.toString() || '',
          name: project.name || '',
          type: project.type || '',
          startDate: project.startDate?.toISOString(),
          targetPairCount: project.targetPairCount || 0,
          status: project.status || 'active',
          notes: project.notes || '',
          createdAt: project.createdAt?.toISOString(),
          updatedAt: project.updatedAt?.toISOString(),
          pairCount,
        };
      })
    );
    
    return NextResponse.json(projectsWithCounts);
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
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
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
    
    // Cast model to any to avoid TypeScript issues
    const ProjectModel = Project as any;
    
    const project = await ProjectModel.create({
      name: body.name,
      type: body.type,
      startDate: new Date(body.startDate),
      targetPairCount: body.targetPairCount,
      status: body.status || 'active',
      notes: body.notes || '',
      createdBy: (session.user as any).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: project._id.toString(),
        name: project.name,
        type: project.type,
        startDate: project.startDate.toISOString(),
        targetPairCount: project.targetPairCount,
        status: project.status,
        notes: project.notes || '',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
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