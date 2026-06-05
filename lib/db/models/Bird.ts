import mongoose from 'mongoose';

export interface IBird {
  birdNumber: string;
  projectId: mongoose.Types.ObjectId;
  species: 'Pigeon' | 'Chicken';
  breed: string;
  name: string;
  age?: string;
  color?: string;
  purchaseDate: Date;
  purchasePrice: number;
  status: 'active' | 'sold';
  notes?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BirdSchema = new mongoose.Schema<IBird>({
  birdNumber: {
    type: String,
    required: [true, 'Bird number is required'],
    trim: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
  },
  species: {
    type: String,
    enum: ['Pigeon', 'Chicken'],
    default: 'Chicken',
    required: true,
  },
  breed: {
    type: String,
    required: [true, 'Breed is required'],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Bird name is required'],
    trim: true,
  },
  age: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: 0,
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active',
  },
  notes: {
    type: String,
    trim: true,
  },
  images: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique bird numbers within a project
BirdSchema.index({ projectId: 1, birdNumber: 1 }, { unique: true });

export default mongoose.models.Bird || mongoose.model<IBird>('Bird', BirdSchema);