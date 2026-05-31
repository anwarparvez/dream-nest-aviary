import mongoose from 'mongoose';

export interface IExpense {
  projectId: mongoose.Types.ObjectId;
  date: Date;
  category: 'Feed' | 'Medicine' | 'Cage' | 'Transport' | 'Utility' | 'Other';
  amount: number;
  note?: string;
  receiptImage?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new mongoose.Schema<IExpense>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  category: {
    type: String,
    enum: ['Feed', 'Medicine', 'Cage', 'Transport', 'Utility', 'Other'],
    required: [true, 'Category is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0.01,
  },
  note: {
    type: String,
    trim: true,
  },
  receiptImage: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);