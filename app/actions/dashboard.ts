'use server'

import { connectDB } from '@/lib/db/mongodb'
import Project from '@/lib/db/models/Project'
import Pair from '@/lib/db/models/Pair'
import Expense from '@/lib/db/models/Expense'
import BirdImage from '@/lib/db/models/BirdImage'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

export async function getDashboardStats() {
  const session = await getServerSession(authOptions)
  
  // Check if session exists and user has admin role
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  await connectDB()
  
  // Cast models to any to avoid TypeScript complex type inference
  const ProjectModel = Project as any
  const PairModel = Pair as any
  const ExpenseModel = Expense as any
  const BirdImageModel = BirdImage as any
  
  const [
    totalProjects,
    totalPairs,
    totalPigeons,
    totalChickens,
    monthlyExpense,
    recentUploads,
  ] = await Promise.all([
    ProjectModel.countDocuments(),
    PairModel.countDocuments(),
    PairModel.countDocuments({ species: 'Pigeon' }),
    PairModel.countDocuments({ species: 'Chicken' }),
    ExpenseModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: new Date(),
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    BirdImageModel.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('uploadedBy', 'name')
      .lean()
      .exec(),
  ])

  const totalIncome = 50000
  const profitLoss = totalIncome - (monthlyExpense[0]?.total || 0)

  const monthlyExpenseData = await ExpenseModel.aggregate([
    {
      $group: {
        _id: { $month: '$date' },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { '_id': 1 } },
  ])

  const breedingSuccessData = await PairModel.aggregate([
    {
      $lookup: {
        from: 'breedingrecords',
        localField: '_id',
        foreignField: 'pairId',
        as: 'breedings',
      },
    },
    {
      $project: {
        pairNumber: 1,
        totalEggs: { $sum: '$breedings.eggCount' },
        totalChicks: { $sum: '$breedings.chickCount' },
      },
    },
  ])

  return {
    totalProjects,
    totalPairs,
    totalPigeons,
    totalChickens,
    monthlyExpense: monthlyExpense[0]?.total || 0,
    totalIncome,
    profitLoss,
    recentUploads: (recentUploads || []).map((img: any) => ({
      _id: img._id?.toString() || '',
      title: img.title || '',
      imageUrl: img.imageUrl || '',
      createdAt: img.createdAt || new Date(),
      uploadedBy: {
        name: img.uploadedBy?.name || 'Unknown',
      },
    })),
    monthlyExpenseData: monthlyExpenseData.map((item: any) => ({
      month: item._id,
      amount: item.amount,
    })),
    breedingSuccessData: breedingSuccessData.map((item: any) => ({
      pair: item.pairNumber,
      hatchRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : '0',
      survivalRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : '0',
    })),
  }
}