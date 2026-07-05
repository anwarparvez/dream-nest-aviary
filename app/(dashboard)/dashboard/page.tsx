'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FolderTree,
  Bird,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Camera,
  Loader2,
  Egg,
  TrendingUp as GrowthIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalProjects: number;
  totalPairs: number;
  totalPigeons: number;
  totalChickens: {
    growing: number;
    eggProduction: number;
    totalEggsLast30Days: number;
    eggRevenue: number;
  };
  monthlyExpense: number;
  totalIncome: number;
  profitLoss: number;
  recentUploads: any[];
  monthlyExpenseData: Array<{ month: number; amount: number }>;
  monthlyIncomeData: Array<{ month: number; amount: number }>;
  breedingSuccessData: Array<{ pair: string; hatchRate: number; survivalRate: number }>;
  incomeBySource?: Array<{ source: string; amount: number }>;
  projectBreakdown?: {
    pigeon: number;
    chickenEgg: number;
    chickenGrowing: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Stats cards
  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderTree,
      color: 'bg-blue-500',
    },
    {
      title: 'Pigeon Pairs',
      value: stats?.totalPigeons || 0,
      icon: Bird,
      color: 'bg-purple-500',
      subtitle: 'Breeding pairs',
    },
    {
      title: 'Growing Chickens',
      value: stats?.totalChickens?.growing || 0,
      icon: GrowthIcon,
      color: 'bg-green-500',
      subtitle: 'Individual birds',
    },
    {
      title: 'Egg Production',
      value: stats?.totalChickens?.eggProduction || 0,
      icon: Egg,
      color: 'bg-yellow-500',
      subtitle: 'Active projects',
    },
    {
      title: 'Eggs Sold (30d)',
      value: stats?.totalChickens?.totalEggsLast30Days?.toLocaleString() || 0,
      icon: Egg,
      color: 'bg-orange-500',
      subtitle: `${stats?.totalChickens?.eggRevenue ? `$${stats.totalChickens.eggRevenue.toLocaleString()}` : '$0'} revenue`,
    },
    {
      title: 'Monthly Expense',
      value: `$${stats?.monthlyExpense?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-red-500',
    },
    {
      title: 'Total Income',
      value: `$${stats?.totalIncome?.toLocaleString() || 0}`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Profit/Loss',
      value: `$${stats?.profitLoss?.toLocaleString() || 0}`,
      icon: stats?.profitLoss && stats.profitLoss > 0 ? TrendingUp : TrendingDown,
      color: stats?.profitLoss && stats.profitLoss > 0 ? 'bg-emerald-500' : 'bg-red-500',
    },
  ];

  const monthlyExpenseData = stats?.monthlyExpenseData || [];
  const monthlyIncomeData = stats?.monthlyIncomeData || [];
  const breedingSuccessData = stats?.breedingSuccessData || [];
  const incomeBySource = stats?.incomeBySource || [];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Welcome to Dream Nest Aviary Management System
        </p>
      </div>

      {/* Project Type Breakdown */}
      {stats?.projectBreakdown && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bird className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.projectBreakdown.pigeon}</p>
                <p className="text-xs text-gray-500">Pigeon Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Egg className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.projectBreakdown.chickenEgg}</p>
                <p className="text-xs text-gray-500">Egg Production Projects</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <GrowthIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.projectBreakdown.chickenGrowing}</p>
                <p className="text-xs text-gray-500">Growing Projects</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.color} bg-opacity-10`}>
                  <Icon className={`h-4 w-4 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyExpenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyExpenseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#ef4444" name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Income Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyIncomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyIncomeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" name="Income" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No income data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income by Source Pie Chart */}
        {incomeBySource.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Income by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeBySource}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="source"
                  >
                    {incomeBySource.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Breeding Success Chart - Only relevant for pigeon projects */}
        {breedingSuccessData.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Pigeon Breeding Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breedingSuccessData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="pair" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="hatchRate" fill="#10b981" name="Hatch Rate %" />
                  <Bar dataKey="survivalRate" fill="#3b82f6" name="Survival Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Uploads */}
      {stats?.recentUploads && stats.recentUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Gallery Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.recentUploads.map((upload: any) => (
                <div key={upload._id} className="relative group">
                  <img
                    src={upload.imageUrl}
                    alt={upload.title}
                    className="rounded-lg w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm font-medium text-center px-2">
                      {upload.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}