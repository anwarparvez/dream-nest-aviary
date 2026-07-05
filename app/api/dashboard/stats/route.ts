import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Bird from '@/lib/db/models/Bird';
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
    const BirdModel = Bird as any;
    const ExpenseModel = Expense as any;
    const IncomeModel = Income as any;
    const BirdImageModel = BirdImage as any;
    
    // Get all projects to filter by type
    const projects = await ProjectModel.find().lean();
    
    // Separate projects by type and income model
    const pigeonProjects = projects.filter((p: any) => p.type === 'Pigeon');
    const chickenEggProjects = projects.filter((p: any) => p.type === 'Chicken' && p.incomeModel === 'egg_production');
    const chickenGrowingProjects = projects.filter((p: any) => p.type === 'Chicken' && p.incomeModel === 'growing');
    
    // Count pairs (for pigeon projects)
    const totalPairs = await PairModel.countDocuments();
    
    // Count individual birds (only for growing chicken projects)
    const chickenGrowingBirds = await BirdModel.countDocuments({ 
      species: 'Chicken',
      projectId: { $in: chickenGrowingProjects.map((p: any) => p._id) }
    });
    
    // For egg production projects, we don't count individual birds
    // Instead, we track daily egg production
    const eggProductionProjects = chickenEggProjects.length;
    
    // Calculate total egg production (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const eggIncome = await IncomeModel.aggregate([
      {
        $match: {
          source: 'egg_sales',
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalEggs: { $sum: '$quantity' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);
    
    const [
      totalProjects,
      totalPigeons,
      totalChickenBirds,
      monthlyExpenseResult,
      monthlyIncomeResult,
      recentUploads,
      incomeBySource,
    ] = await Promise.all([
      ProjectModel.countDocuments(),
      PairModel.countDocuments({ species: 'Pigeon' }),
      BirdModel.countDocuments({ species: 'Chicken' }),
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
      IncomeModel.aggregate([
        {
          $group: {
            _id: '$source',
            total: { $sum: '$amount' },
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
    
    // Get breeding success data (only for pigeon projects)
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
    
    // Format the response
    const formattedRecentUploads = (recentUploads || []).map((img: any) => ({
      _id: img._id?.toString() || '',
      title: img.title || '',
      imageUrl: img.imageUrl || '',
      createdAt: img.createdAt?.toISOString(),
      uploadedBy: {
        name: img.uploadedBy?.name || 'Unknown',
      },
    }));
    
    const formattedMonthlyExpenseData = monthlyExpenseData.map((item: any) => ({
      month: item._id,
      amount: Number(item.amount) || 0,
    }));
    
    const formattedMonthlyIncomeData = monthlyIncomeData.map((item: any) => ({
      month: item._id,
      amount: Number(item.amount) || 0,
    }));
    
    const formattedIncomeBySource = incomeBySource.map((item: any) => ({
      source: item._id === 'bird_sales' ? '🦜 Bird Sales' : 
              item._id === 'egg_sales' ? '🥚 Egg Sales' : 
              '💰 Other',
      amount: Number(item.total) || 0,
    }));
    
    const formattedBreedingSuccessData = breedingSuccessData.map((item: any) => ({
      pair: item.pairNumber || 'Unknown',
      hatchRate: item.totalEggs > 0 ? Number(((item.totalChicks / item.totalEggs) * 100).toFixed(2)) : 0,
      survivalRate: item.totalEggs > 0 ? Number(((item.totalChicks / item.totalEggs) * 100).toFixed(2)) : 0,
    }));
    
    return NextResponse.json({
      totalProjects: Number(totalProjects) || 0,
      // For pigeons: count pairs
      totalPigeons: Number(totalPigeons) || 0,
      // For chickens: show meaningful metrics based on model
      totalChickens: {
        growing: Number(chickenGrowingBirds) || 0,
        eggProduction: eggProductionProjects,
        totalEggsLast30Days: eggIncome[0]?.totalEggs || 0,
        eggRevenue: eggIncome[0]?.totalAmount || 0,
      },
      totalPairs: Number(totalPairs) || 0,
      monthlyExpense: Number(monthlyExpense) || 0,
      totalIncome: Number(totalIncome) || 0,
      profitLoss: Number(profitLoss) || 0,
      recentUploads: formattedRecentUploads,
      monthlyExpenseData: formattedMonthlyExpenseData,
      monthlyIncomeData: formattedMonthlyIncomeData,
      incomeBySource: formattedIncomeBySource,
      breedingSuccessData: formattedBreedingSuccessData,
      projectBreakdown: {
        pigeon: pigeonProjects.length,
        chickenEgg: chickenEggProjects.length,
        chickenGrowing: chickenGrowingProjects.length,
      },
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}