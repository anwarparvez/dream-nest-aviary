import mongoose from 'mongoose';

export interface IProject {
  name: string;
  type: 'Pigeon' | 'Chicken' | 'Mixed';
  startDate: Date;
  targetPairCount: number;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new mongoose.Schema<IProject>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Pigeon', 'Chicken', 'Mixed'],
    required: [true, 'Project type is required'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  targetPairCount: {
    type: Number,
    required: [true, 'Target pair count is required'],
    min: 1,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
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

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);