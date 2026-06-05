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
} from 'recharts';
import {
  FolderTree,
  Bird,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Camera,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalProjects: number;
  totalPairs: number;
  totalPigeons: number;
  totalChickens: number;
  monthlyExpense: number;
  totalIncome: number;
  profitLoss: number;
  recentUploads: any[];
  monthlyExpenseData: any[];
  monthlyIncomeData: any[];
  breedingSuccessData: any[];
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

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      icon: FolderTree,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Bird Pairs',
      value: stats?.totalPairs || 0,
      icon: Bird,
      color: 'bg-green-500',
    },
    {
      title: 'Total Pigeons',
      value: stats?.totalPigeons || 0,
      icon: Bird,
      color: 'bg-purple-500',
    },
    {
      title: 'Total Chickens',
      value: stats?.totalChickens || 0,
      icon: Bird,
      color: 'bg-yellow-500',
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
    {
      title: 'Recent Uploads',
      value: stats?.recentUploads?.length || 0,
      icon: Camera,
      color: 'bg-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Welcome to Dream Nest Aviary Management System
        </p>
      </div>

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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.monthlyExpenseData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#ef4444" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.monthlyIncomeData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#10b981" name="Income" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Breeding Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.breedingSuccessData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pair" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hatchRate" fill="#10b981" name="Hatch Rate %" />
                <Bar dataKey="survivalRate" fill="#3b82f6" name="Survival Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm font-medium">{upload.title}</p>
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