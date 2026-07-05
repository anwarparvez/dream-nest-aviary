import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/lib/db/models/Project';
import Pair from '@/lib/db/models/Pair';
import Bird from '@/lib/db/models/Bird';
import Expense from '@/lib/db/models/Expense';
import Income from '@/lib/db/models/Income';

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

    // Get all projects
    const projects = await ProjectModel.find({ 
      createdBy: (session.user as any).id 
    }).lean();

    const projectFinancials = await Promise.all(
      projects.map(async (project: any) => {
        // Get pairs/birds count
        let currentCount = 0;
        if (project.incomeModel === 'pair_breeding') {
          currentCount = await PairModel.countDocuments({ projectId: project._id });
        } else if (project.incomeModel === 'growing') {
          currentCount = await BirdModel.countDocuments({ projectId: project._id, status: 'active' });
        }

        // Get expenses
        const expenses = await ExpenseModel.find({ projectId: project._id }).lean();
        
        // Get incomes
        const incomes = await IncomeModel.find({ projectId: project._id }).lean();

        // Calculate investment by category
        const investment = {
          total: 0,
          pairs: 0,
          birds: 0,
          feed: 0,
          medicine: 0,
          cage: 0,
          transport: 0,
          utility: 0,
          other: 0,
        };

        expenses.forEach((expense: any) => {
          investment.total += expense.amount;
          switch (expense.category) {
            case 'Feed':
              investment.feed += expense.amount;
              break;
            case 'Medicine':
              investment.medicine += expense.amount;
              break;
            case 'Cage':
              investment.cage += expense.amount;
              break;
            case 'Transport':
              investment.transport += expense.amount;
              break;
            case 'Utility':
              investment.utility += expense.amount;
              break;
            default:
              investment.other += expense.amount;
          }
        });

        // Add purchase costs
        if (project.incomeModel === 'pair_breeding') {
          const pairs = await PairModel.find({ projectId: project._id }).lean();
          investment.pairs = pairs.reduce((sum: number, p: any) => sum + p.purchasePrice, 0);
          investment.total += investment.pairs;
        } else if (project.incomeModel === 'growing') {
          const birds = await BirdModel.find({ projectId: project._id }).lean();
          investment.birds = birds.reduce((sum: number, b: any) => sum + b.purchasePrice, 0);
          investment.total += investment.birds;
        }

        // Calculate income by source
        const income = {
          total: 0,
          birdSales: 0,
          eggSales: 0,
          other: 0,
        };

        incomes.forEach((inc: any) => {
          income.total += inc.amount;
          switch (inc.source) {
            case 'bird_sales':
              income.birdSales += inc.amount;
              break;
            case 'egg_sales':
              income.eggSales += inc.amount;
              break;
            default:
              income.other += inc.amount;
          }
        });

        const profit = income.total - investment.total;
        const profitMargin = income.total > 0 ? (profit / income.total) * 100 : 0;
        const roi = investment.total > 0 ? (profit / investment.total) * 100 : 0;

        return {
          _id: project._id.toString(),
          name: project.name,
          type: project.type,
          incomeModel: project.incomeModel,
          status: project.status,
          startDate: project.startDate,
          targetCount: project.targetCount,
          currentCount,
          investment,
          income,
          profit,
          profitMargin,
          roi,
          transactions: {
            expenses: expenses.slice(0, 10).map((e: any) => ({
              _id: e._id.toString(),
              date: e.date,
              category: e.category,
              amount: e.amount,
              note: e.note,
            })),
            incomes: incomes.slice(0, 10).map((i: any) => ({
              _id: i._id.toString(),
              date: i.date,
              source: i.source,
              amount: i.amount,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              description: i.description,
            })),
          },
        };
      })
    );

    return NextResponse.json(projectFinancials);
  } catch (error) {
    console.error('Error generating project financial report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}