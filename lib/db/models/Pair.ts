import mongoose from 'mongoose';

export interface IPair {
  pairNumber: string;
  projectId: mongoose.Types.ObjectId;
  species: 'Pigeon' | 'Chicken';
  breed: string;
  maleName: string;
  maleId?: string;
  femaleName: string;
  femaleId?: string;
  ringNumber?: string;
  color?: string;
  age?: string;
  purchaseDate: Date;
  purchasePrice: number;
  notes?: string;
  images: string[];
  status: 'active' | 'breeding' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}

const PairSchema = new mongoose.Schema<IPair>({
  pairNumber: {
    type: String,
    required: [true, 'Pair number is required'],
    unique: true,
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
    required: [true, 'Species is required'],
  },
  breed: {
    type: String,
    required: [true, 'Breed is required'],
    trim: true,
  },
  maleName: {
    type: String,
    required: [true, 'Male name is required'],
    trim: true,
  },
  maleId: {
    type: String,
    trim: true,
  },
  femaleName: {
    type: String,
    required: [true, 'Female name is required'],
    trim: true,
  },
  femaleId: {
    type: String,
    trim: true,
  },
  ringNumber: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  age: {
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
  notes: {
    type: String,
    trim: true,
  },
  images: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['active', 'breeding', 'sold'],
    default: 'active',
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

export default mongoose.models.Pair || mongoose.model<IPair>('Pair', PairSchema);