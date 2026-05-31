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
    
    let query = {};
    if (projectId) {
      query = { projectId };
    }

    // Populate projectId to get project details
    const expenses = await Expense.find(query)
      .populate('projectId', 'name type')
      .sort({ date: -1 })
      .lean();
    
    // Format the response with project details
    const formattedExpenses = expenses.map(expense => ({
      ...expense,
      _id: expense._id.toString(),
      projectId: expense.projectId ? {
        _id: expense.projectId._id.toString(),
        name: expense.projectId.name,
        type: expense.projectId.type,
      } : null,
      createdAt: expense.createdAt?.toISOString(),
      updatedAt: expense.updatedAt?.toISOString(),
      date: expense.date?.toISOString(),
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
    
    if (!session || session.user.role !== 'admin') {
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
    const project = await Project.findById(body.projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const expense = await Expense.create({
      projectId: body.projectId,
      date: new Date(body.date),
      category: body.category,
      amount: body.amount,
      note: body.note || '',
      receiptImage: body.receiptImage || '',
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Populate project data for response
    const populatedExpense = await Expense.findById(expense._id)
      .populate('projectId', 'name type')
      .lean();
    
    return NextResponse.json({
      success: true,
      data: {
        ...populatedExpense,
        _id: populatedExpense._id.toString(),
        projectId: populatedExpense.projectId ? {
          _id: populatedExpense.projectId._id.toString(),
          name: populatedExpense.projectId.name,
          type: populatedExpense.projectId.type,
        } : null,
        date: populatedExpense.date.toISOString(),
        createdAt: populatedExpense.createdAt.toISOString(),
        updatedAt: populatedExpense.updatedAt.toISOString(),
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