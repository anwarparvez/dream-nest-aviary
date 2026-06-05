import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Income from '@/lib/db/models/Income';
import Expense from '@/lib/db/models/Expense';

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Cast models to any to avoid TypeScript issues
    const ProjectModel = Project as any;
    const PairModel = Pair as any;
    const IncomeModel = Income as any;
    const ExpenseModel = Expense as any;
    
    const projects = await ProjectModel.find({ 
      createdBy: (session.user as any).id 
    }).sort({ createdAt: -1 }).lean();
    
    // Get additional data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project: any) => {
        const pairCount = await PairModel.countDocuments({ projectId: project._id });
        
        // Calculate total income and expenses
        const totalIncomeResult = await IncomeModel.aggregate([
          { $match: { projectId: project._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const totalExpenseResult = await ExpenseModel.aggregate([
          { $match: { projectId: project._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        return {
          _id: project._id?.toString() || '',
          name: project.name || '',
          type: project.type || '',
          incomeModel: project.incomeModel || 'pair_breeding',
          startDate: project.startDate?.toISOString(),
          targetCount: project.targetCount || project.targetPairCount || 0,
          status: project.status || 'active',
          notes: project.notes || '',
          createdAt: project.createdAt?.toISOString(),
          updatedAt: project.updatedAt?.toISOString(),
          pairCount: pairCount || 0,
          totalIncome: totalIncomeResult[0]?.total || 0,
          totalExpense: totalExpenseResult[0]?.total || 0,
          profit: (totalIncomeResult[0]?.total || 0) - (totalExpenseResult[0]?.total || 0),
        };
      })
    );
    
    return NextResponse.json(projectsWithData);
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
    if (!body.name || !body.type || !body.startDate || !body.targetCount) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, startDate, targetCount' },
        { status: 400 }
      );
    }
    
    // Set default income model based on project type if not provided
    let incomeModel = body.incomeModel;
    if (!incomeModel) {
      if (body.type === 'Pigeon') {
        incomeModel = 'pair_breeding';
      } else if (body.type === 'Chicken') {
        incomeModel = 'egg_production';
      } else {
        incomeModel = 'mixed';
      }
    }
    
    await connectDB();
    
    // Cast model to any to avoid TypeScript issues
    const ProjectModel = Project as any;
    
    const project = await ProjectModel.create({
      name: body.name,
      type: body.type,
      incomeModel: incomeModel,
      startDate: new Date(body.startDate),
      targetCount: body.targetCount,
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
        incomeModel: project.incomeModel,
        startDate: project.startDate.toISOString(),
        targetCount: project.targetCount,
        status: project.status,
        notes: project.notes || '',
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project (if you want to add this)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }
    
    await connectDB();
    
    const ProjectModel = Project as any;
    
    const project = await ProjectModel.findByIdAndUpdate(
      id,
      {
        name: body.name,
        type: body.type,
        incomeModel: body.incomeModel,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        targetCount: body.targetCount,
        status: body.status,
        notes: body.notes,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: project._id.toString(),
        name: project.name,
        type: project.type,
        incomeModel: project.incomeModel,
        startDate: project.startDate?.toISOString(),
        targetCount: project.targetCount,
        status: project.status,
        notes: project.notes || '',
        createdAt: project.createdAt?.toISOString(),
        updatedAt: project.updatedAt?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project: ' + (error as Error).message },
      { status: 500 }
    );
  }
}