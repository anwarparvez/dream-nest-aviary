import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Expense from '@/lib/db/models/Expense';

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Fixed: Consistent role check with null safety
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    const expense = await Expense.findByIdAndDelete(id);
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Update an expense
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
    
    // Validate required fields
    if (!body.projectId || !body.date || !body.category || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, date, category, amount' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        projectId: body.projectId,
        date: new Date(body.date),
        category: body.category,
        amount: body.amount,
        note: body.note || '',
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('projectId', 'name');
    
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    
    // Safely convert to plain object with string IDs
    const expenseObj = expense.toObject();
    
    return NextResponse.json({
      success: true,
      data: {
        _id: expenseObj._id.toString(),
        projectId: expenseObj.projectId ? {
          _id: (expenseObj.projectId as any)._id.toString(),
          name: (expenseObj.projectId as any).name,
        } : null,
        date: expenseObj.date.toISOString(),
        category: expenseObj.category,
        amount: expenseObj.amount,
        note: expenseObj.note || '',
        createdAt: expenseObj.createdAt.toISOString(),
        updatedAt: expenseObj.updatedAt.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense: ' + (error as Error).message },
      { status: 500 }
    );
  }
}