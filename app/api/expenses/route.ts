import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Expense from '@/lib/db/models/Expense';
import Project from '@/lib/db/models/Project';

// GET /api/expenses - Get expenses (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    await connectDB();
    
    // Cast model to any to avoid TypeScript issues
    const ExpenseModel = Expense as any;
    
    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const expenses = await ExpenseModel.find(query)
      .populate('projectId', 'name type')
      .sort({ date: -1 })
      .lean();
    
    const formattedExpenses = expenses.map((expense: any) => ({
      _id: expense._id?.toString() || '',
      projectId: expense.projectId ? {
        _id: expense.projectId._id?.toString() || '',
        name: expense.projectId.name || '',
        type: expense.projectId.type || '',
      } : null,
      date: expense.date?.toISOString(),
      category: expense.category,
      amount: expense.amount,
      note: expense.note || '',
      createdAt: expense.createdAt?.toISOString(),
      updatedAt: expense.updatedAt?.toISOString(),
    }));
    
    return NextResponse.json(formattedExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.projectId || !body.date || !body.category || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, date, category, amount' },
        { status: 400 }
      );
    }
    
    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if project exists
    const ProjectModel = Project as any;
    const project = await ProjectModel.findById(body.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Cast model to any to avoid TypeScript issues
    const ExpenseModel = Expense as any;
    
    const expense = await ExpenseModel.create({
      projectId: body.projectId,
      date: new Date(body.date),
      category: body.category,
      amount: body.amount,
      note: body.note || '',
      receiptImage: body.receiptImage || '',
      createdBy: (session.user as any).id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Populate project data for response
    const populatedExpense = await ExpenseModel.findById(expense._id)
      .populate('projectId', 'name type')
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: (populatedExpense as any)._id?.toString() || '',
        projectId: (populatedExpense as any).projectId ? {
          _id: (populatedExpense as any).projectId._id?.toString() || '',
          name: (populatedExpense as any).projectId.name || '',
          type: (populatedExpense as any).projectId.type || '',
        } : null,
        date: (populatedExpense as any).date?.toISOString(),
        category: (populatedExpense as any).category,
        amount: (populatedExpense as any).amount,
        note: (populatedExpense as any).note || '',
        createdAt: (populatedExpense as any).createdAt?.toISOString(),
        updatedAt: (populatedExpense as any).updatedAt?.toISOString(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense: ' + (error as Error).message },
      { status: 500 }
    );
  }
}