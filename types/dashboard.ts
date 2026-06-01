export interface DashboardStats {
  totalProjects: number;
  totalPairs: number;
  totalPigeons: number;
  totalChickens: number;
  monthlyExpense: number;
  totalIncome: number;
  profitLoss: number;
  recentUploads: RecentUpload[];
  monthlyExpenseData: MonthlyExpenseData[];
  breedingSuccessData: BreedingSuccessData[];
}

export interface RecentUpload {
  _id: string;
  title: string;
  imageUrl: string;
  createdAt: Date;
  uploadedBy: {
    name: string;
  };
}

export interface MonthlyExpenseData {
  month: number;
  amount: number;
}

export interface BreedingSuccessData {
  pair: string;
  hatchRate: string;
  survivalRate: string;
}