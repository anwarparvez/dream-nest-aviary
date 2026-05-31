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
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  await connectDB()
  
  const [
    totalProjects,
    totalPairs,
    totalPigeons,
    totalChickens,
    monthlyExpense,
    recentUploads,
  ] = await Promise.all([
    Project.countDocuments(),
    Pair.countDocuments(),
    Pair.countDocuments({ species: 'Pigeon' }),
    Pair.countDocuments({ species: 'Chicken' }),
    Expense.aggregate([
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
    BirdImage.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('uploadedBy', 'name')
      .lean(),
  ])

  const totalIncome = 50000
  const profitLoss = totalIncome - (monthlyExpense[0]?.total || 0)

  const monthlyExpenseData = await Expense.aggregate([
    {
      $group: {
        _id: { $month: '$date' },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { '_id': 1 } },
  ])

  const breedingSuccessData = await Pair.aggregate([
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
    recentUploads: recentUploads.map(img => ({
      ...img,
      _id: img._id.toString(),
    })),
    monthlyExpenseData: monthlyExpenseData.map(item => ({
      month: item._id,
      amount: item.amount,
    })),
    breedingSuccessData: breedingSuccessData.map(item => ({
      pair: item.pairNumber,
      hatchRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : 0,
      survivalRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : 0,
    })),
  }
}