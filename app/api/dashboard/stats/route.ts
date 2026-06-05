import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Expense from '@/lib/db/models/Expense';
import Income from '@/lib/db/models/Income';
import BirdImage from '@/lib/db/models/BirdImage';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const ProjectModel = Project as any;
    const PairModel = Pair as any;
    const ExpenseModel = Expense as any;
    const IncomeModel = Income as any;
    const BirdImageModel = BirdImage as any;
    
    // Get all statistics
    const [
      totalProjects,
      totalPairs,
      totalPigeons,
      totalChickens,
      monthlyExpenseResult,
      monthlyIncomeResult,
      recentUploads,
      projectsByIncomeModel,
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
      IncomeModel.aggregate([
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
      ProjectModel.aggregate([
        {
          $group: {
            _id: '$incomeModel',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    
    const monthlyExpense = monthlyExpenseResult[0]?.total || 0;
    const totalIncome = monthlyIncomeResult[0]?.total || 0;
    const profitLoss = totalIncome - monthlyExpense;
    
    // Get monthly data for charts
    const monthlyExpenseData = await ExpenseModel.aggregate([
      {
        $group: {
          _id: { $month: '$date' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);
    
    const monthlyIncomeData = await IncomeModel.aggregate([
      {
        $group: {
          _id: { $month: '$date' },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);
    
    // Get income by source
    const incomeBySource = await IncomeModel.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: '$amount' },
        },
      },
    ]);
    
    // Get breeding success data
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
    ]);
    
    // Format response
    const formattedRecentUploads = (recentUploads || []).map((img: any) => ({
      _id: img._id?.toString() || '',
      title: img.title || '',
      imageUrl: img.imageUrl || '',
      createdAt: img.createdAt || new Date(),
      uploadedBy: {
        name: img.uploadedBy?.name || 'Unknown',
      },
    }));
    
    const formattedMonthlyExpenseData = monthlyExpenseData.map((item: any) => ({
      month: item._id,
      amount: item.amount,
    }));
    
    const formattedMonthlyIncomeData = monthlyIncomeData.map((item: any) => ({
      month: item._id,
      amount: item.amount,
    }));
    
    const formattedIncomeBySource = incomeBySource.map((item: any) => ({
      source: item._id,
      amount: item.total,
    }));
    
    const formattedBreedingSuccessData = breedingSuccessData.map((item: any) => ({
      pair: item.pairNumber,
      hatchRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : 0,
      survivalRate: item.totalEggs > 0 ? ((item.totalChicks / item.totalEggs) * 100).toFixed(2) : 0,
    }));
    
    return NextResponse.json({
      totalProjects,
      totalPairs,
      totalPigeons,
      totalChickens,
      monthlyExpense,
      totalIncome,
      profitLoss,
      recentUploads: formattedRecentUploads,
      monthlyExpenseData: formattedMonthlyExpenseData,
      monthlyIncomeData: formattedMonthlyIncomeData,
      incomeBySource: formattedIncomeBySource,
      breedingSuccessData: formattedBreedingSuccessData,
      projectsByIncomeModel,
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}