import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Expense from '@/lib/db/models/Expense';
import Pair from '@/lib/db/models/Pair';
import Project from '@/lib/db/models/Project';
import BreedingRecord from '@/lib/db/models/BreedingRecord';
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const species = searchParams.get('species');

    await connectDB();

    // Build query filters
    let expenseFilter: any = {};
    let pairFilter: any = {};
    let breedingFilter: any = {};

    if (startDate && endDate) {
      expenseFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (projectId && projectId !== 'all') {
      expenseFilter.projectId = projectId;
      pairFilter.projectId = projectId;
    }

    if (species && species !== 'all') {
      pairFilter.species = species;
    }

    // Fetch expenses
    const expenses = await Expense.find(expenseFilter)
      .populate('projectId', 'name')
      .lean();

    // Fetch pairs
    const pairs = await Pair.find(pairFilter)
      .populate('projectId', 'name')
      .lean();

    // Fetch breeding records
    if (projectId && projectId !== 'all') {
      const pairIds = pairs.map(p => p._id);
      breedingFilter.pairId = { $in: pairIds };
    }
    const breedingRecords = await BreedingRecord.find(breedingFilter).lean();

    // Fetch projects
    const projects = await Project.find().lean();

    // Calculate expense statistics
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const byCategory: Record<string, number> = {};
    expenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    });

    // Group expenses by month
    const expenseByMonth: Record<string, number> = {};
    expenses.forEach(expense => {
      const monthKey = format(new Date(expense.date), 'MMM yyyy');
      expenseByMonth[monthKey] = (expenseByMonth[monthKey] || 0) + expense.amount;
    });

    const byMonth = Object.entries(expenseByMonth).map(([month, amount]) => ({
      month,
      amount,
    })).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    // Group expenses by project
    const byProject: Record<string, number> = {};
    expenses.forEach(expense => {
      const projectName = (expense.projectId as any)?.name || 'Unknown';
      byProject[projectName] = (byProject[projectName] || 0) + expense.amount;
    });

    const byProjectArray = Object.entries(byProject).map(([name, amount]) => ({
      name,
      amount,
    })).sort((a, b) => b.amount - a.amount);

    // Calculate pair statistics
    const totalPairs = pairs.length;
    const activePairs = pairs.filter(p => p.status === 'active').length;
    const breedingPairs = pairs.filter(p => p.status === 'breeding').length;
    const soldPairs = pairs.filter(p => p.status === 'sold').length;

    const bySpecies: Record<string, number> = {};
    pairs.forEach(pair => {
      bySpecies[pair.species] = (bySpecies[pair.species] || 0) + 1;
    });

    const byProjectPairs: Record<string, number> = {};
    pairs.forEach(pair => {
      const projectName = (pair.projectId as any)?.name || 'Unknown';
      byProjectPairs[projectName] = (byProjectPairs[projectName] || 0) + 1;
    });

    const byProjectPairsArray = Object.entries(byProjectPairs).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count);

    const totalValue = pairs.reduce((sum, p) => sum + p.purchasePrice, 0);
    const averagePrice = totalPairs > 0 ? totalValue / totalPairs : 0;

    // Calculate breeding statistics
    const totalBreedings = breedingRecords.length;
    const totalEggs = breedingRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const totalChicks = breedingRecords.reduce((sum, r) => sum + (r.chickCount || 0), 0);
    const hatchRate = totalEggs > 0 ? (totalChicks / totalEggs) * 100 : 0;
    const survivalRate = totalChicks > 0 ? 100 : 0; // You can adjust this based on your data

    // Group breeding by month
    const breedingByMonth: Record<string, { eggs: number; chicks: number }> = {};
    breedingRecords.forEach(record => {
      const monthKey = format(new Date(record.eggDate), 'MMM yyyy');
      if (!breedingByMonth[monthKey]) {
        breedingByMonth[monthKey] = { eggs: 0, chicks: 0 };
      }
      breedingByMonth[monthKey].eggs += record.eggCount;
      breedingByMonth[monthKey].chicks += record.chickCount || 0;
    });

    const breedingByMonthArray = Object.entries(breedingByMonth).map(([month, data]) => ({
      month,
      eggs: data.eggs,
      chicks: data.chicks,
    })).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    // Find most productive pair
    const pairProductivity: Record<string, { pairNumber: string; chicks: number }> = {};
    breedingRecords.forEach(record => {
      const pairId = record.pairId.toString();
      if (!pairProductivity[pairId]) {
        const pair = pairs.find(p => p._id.toString() === pairId);
        pairProductivity[pairId] = {
          pairNumber: pair?.pairNumber || 'Unknown',
          chicks: 0,
        };
      }
      pairProductivity[pairId].chicks += record.chickCount || 0;
    });

    const mostProductivePair = Object.values(pairProductivity).sort((a, b) => b.chicks - a.chicks)[0];

    // Calculate project statistics
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const archivedProjects = projects.filter(p => p.status === 'archived').length;
    const totalProjects = projects.length;

    const totalPairsInProjects = pairs.length;
    const totalExpensesInProjects = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averagePairsPerProject = totalProjects > 0 ? totalPairsInProjects / totalProjects : 0;
    const averageExpensePerProject = totalProjects > 0 ? totalExpensesInProjects / totalProjects : 0;

    // Calculate monthly averages
    const monthsCount = byMonth.length;
    const averagePerMonth = monthsCount > 0 ? totalExpenses / monthsCount : 0;

    // Find top category
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    // Calculate fastest growing category (simplified)
    const fastestGrowing = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Prepare response
    const reportData = {
      expenses: {
        total: totalExpenses,
        byCategory,
        byMonth,
        byProject: byProjectArray,
        averagePerMonth,
        topCategory,
        fastestGrowing,
      },
      pairs: {
        total: totalPairs,
        active: activePairs,
        breeding: breedingPairs,
        sold: soldPairs,
        bySpecies,
        byProject: byProjectPairsArray,
        totalValue,
        averagePrice,
      },
      breeding: {
        totalBreedings,
        totalEggs,
        totalChicks,
        hatchRate: hatchRate.toFixed(2),
        survivalRate: survivalRate.toFixed(2),
        byMonth: breedingByMonthArray,
        mostProductivePair: mostProductivePair || { pairNumber: 'N/A', chicks: 0 },
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        archived: archivedProjects,
        totalPairs: totalPairsInProjects,
        totalExpenses: totalExpensesInProjects,
        averagePairsPerProject: averagePairsPerProject.toFixed(2),
        averageExpensePerProject: averageExpensePerProject.toFixed(2),
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}