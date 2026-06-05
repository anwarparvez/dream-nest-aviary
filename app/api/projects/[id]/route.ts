import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Expense from '@/lib/db/models/Expense';
import Income from '@/lib/db/models/Income';

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
    
    const ProjectModel = Project as any;
    const PairModel = Pair as any;
    const ExpenseModel = Expense as any;
    const IncomeModel = Income as any;
    
    const project = await ProjectModel.findById(id).lean();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get pair count
    const pairCount = await PairModel.countDocuments({ projectId: id });
    
    // Get financial summary
    const totalExpensesResult = await ExpenseModel.aggregate([
      { $match: { projectId: id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalIncomeResult = await IncomeModel.aggregate([
      { $match: { projectId: id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalExpenses = totalExpensesResult[0]?.total || 0;
    const totalIncome = totalIncomeResult[0]?.total || 0;
    
    const projectAny = project as any;
    
    return NextResponse.json({
      _id: projectAny._id?.toString() || '',
      name: projectAny.name || '',
      type: projectAny.type || '',
      incomeModel: projectAny.incomeModel || 'pair_breeding',
      startDate: projectAny.startDate?.toISOString(),
      targetCount: projectAny.targetCount || projectAny.targetPairCount || 0,
      status: projectAny.status || 'active',
      notes: projectAny.notes || '',
      createdAt: projectAny.createdAt?.toISOString(),
      updatedAt: projectAny.updatedAt?.toISOString(),
      pairCount,
      totalExpenses,
      totalIncome,
      profit: totalIncome - totalExpenses,
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
    
    const ProjectModel = Project as any;
    
    const project = await ProjectModel.findByIdAndUpdate(
      id,
      {
        name: body.name,
        type: body.type,
        incomeModel: body.incomeModel,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        targetCount: body.targetCount,
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
        incomeModel: projectObj.incomeModel,
        startDate: projectObj.startDate?.toISOString(),
        targetCount: projectObj.targetCount,
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
    
    const PairModel = Pair as any;
    const ExpenseModel = Expense as any;
    const IncomeModel = Income as any;
    const ProjectModel = Project as any;
    
    // Delete all associated data
    await PairModel.deleteMany({ projectId: id });
    await ExpenseModel.deleteMany({ projectId: id });
    await IncomeModel.deleteMany({ projectId: id });
    const project = await ProjectModel.findByIdAndDelete(id);
    
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