'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bird,
  Egg,
  Calendar,
  FileText,
  PieChart,
  BarChart3,
  LineChart,
  Activity,
  Package,
  Stethoscope,
  Truck,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface ReportData {
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    byMonth: Array<{ month: string; amount: number }>;
    byProject: Array<{ name: string; amount: number }>;
    averagePerMonth: number;
    topCategory: string;
    fastestGrowing: string;
  };
  pairs: {
    total: number;
    active: number;
    breeding: number;
    sold: number;
    bySpecies: Record<string, number>;
    byProject: Array<{ name: string; count: number }>;
    totalValue: number;
    averagePrice: number;
  };
  breeding: {
    totalBreedings: number;
    totalEggs: number;
    totalChicks: number;
    hatchRate: number;
    survivalRate: number;
    byMonth: Array<{ month: string; eggs: number; chicks: number }>;
    mostProductivePair: { pairNumber: string; chicks: number };
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    archived: number;
    totalPairs: number;
    totalExpenses: number;
    averagePairsPerProject: number;
    averageExpensePerProject: number;
  };
}

const CATEGORY_ICONS = {
  Feed: Package,
  Medicine: Stethoscope,
  Cage: Package,
  Transport: Truck,
  Utility: Zap,
  Other: MoreHorizontal,
};

const CATEGORY_COLORS = {
  Feed: '#10b981',
  Medicine: '#ef4444',
  Cage: '#3b82f6',
  Transport: '#f59e0b',
  Utility: '#8b5cf6',
  Other: '#6b7280',
};

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedProject, selectedSpecies]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        projectId: selectedProject,
        species: selectedSpecies,
      });
      
      const response = await fetch(`/api/reports?${params}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {
        totalExpenses: reportData.expenses.total,
        totalPairs: reportData.pairs.total,
        totalBreedings: reportData.breeding.totalBreedings,
        hatchRate: `${reportData.breeding.hatchRate}%`,
      },
      details: reportData,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farm-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive farm performance insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div>
              <Label>Filter by Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {reportData.projects && Object.keys(reportData.projects).map((project) => (
                    <SelectItem key={project} value={project}>Project {project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter by Species</Label>
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger>
                  <SelectValue placeholder="All Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="Pigeon">Pigeons</SelectItem>
                  <SelectItem value="Chicken">Chickens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ${reportData.expenses.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg ${reportData.expenses.averagePerMonth.toLocaleString()}/month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pairs</p>
                <p className="text-2xl font-bold text-blue-700">
                  {reportData.pairs.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.pairs.active} Active | {reportData.pairs.breeding} Breeding
                </p>
              </div>
              <Bird className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hatch Rate</p>
                <p className="text-2xl font-bold text-purple-700">
                  {reportData.breeding.hatchRate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.breeding.totalChicks} chicks from {reportData.breeding.totalEggs} eggs
                </p>
              </div>
              <Egg className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-orange-700">
                  ${reportData.pairs.totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg ${reportData.pairs.averagePrice.toLocaleString()}/pair
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="birds">Bird Management</TabsTrigger>
          <TabsTrigger value="breeding">Breeding Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Overview</TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* Expenses by Category Pie Chart */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Distribution of all expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={Object.entries(reportData.expenses.byCategory).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(reportData.expenses.byCategory).map(([name], index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Expenses Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
                <CardDescription>Last 6 months performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportData.expenses.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expenses by Project Bar Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Expenses by Project</CardTitle>
                <CardDescription>Comparison across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.expenses.byProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown Cards */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Detailed expense analysis by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(reportData.expenses.byCategory).map(([category, amount]) => {
                    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
                    const percentage = (amount / reportData.expenses.total) * 100;
                    return (
                      <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                        {Icon && <Icon className="h-8 w-8 mx-auto mb-2" style={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }} />}
                        <p className="text-sm font-medium">{category}</p>
                        <p className="text-lg font-bold" style={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}>
                          ${amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bird Management Tab */}
        <TabsContent value="birds" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pairs by Species */}
            <Card>
              <CardHeader>
                <CardTitle>Pairs by Species</CardTitle>
                <CardDescription>Pigeon vs Chicken distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={Object.entries(reportData.pairs.bySpecies).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">🐦 Pigeons</span>
                    <span className="font-semibold">{reportData.pairs.bySpecies.Pigeon || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">🐔 Chickens</span>
                    <span className="font-semibold">{reportData.pairs.bySpecies.Chicken || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pairs by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Pairs by Project</CardTitle>
                <CardDescription>Distribution across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.pairs.byProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Pair Status Distribution</CardTitle>
                <CardDescription>Current status of all pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <span className="font-bold text-lg">{reportData.pairs.active}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Breeding</span>
                    </div>
                    <span className="font-bold text-lg">{reportData.pairs.breeding}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm">Sold</span>
                    </div>
                    <span className="font-bold text-lg">{reportData.pairs.sold}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Value Metrics</CardTitle>
                <CardDescription>Financial metrics for bird pairs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${reportData.pairs.totalValue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Price per Pair</p>
                  <p className="text-xl font-semibold">
                    ${reportData.pairs.averagePrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Active Pairs Value</p>
                  <p className="text-xl font-semibold text-blue-600">
                    ${((reportData.pairs.active / reportData.pairs.total) * reportData.pairs.totalValue).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Breeding Analytics Tab */}
        <TabsContent value="breeding" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Hatch Rate Gauge */}
            <Card>
              <CardHeader>
                <CardTitle>Breeding Success Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-emerald-600">{reportData.breeding.hatchRate}%</p>
                        <p className="text-sm text-gray-500">Hatch Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold">{reportData.breeding.totalBreedings}</p>
                      <p className="text-xs text-gray-500">Total Breedings</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold">{reportData.breeding.totalEggs}</p>
                      <p className="text-xs text-gray-500">Total Eggs</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold">{reportData.breeding.totalChicks}</p>
                      <p className="text-xs text-gray-500">Total Chicks</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold">{reportData.breeding.survivalRate}%</p>
                      <p className="text-xs text-gray-500">Survival Rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breeding Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breeding Activity</CardTitle>
                <CardDescription>Eggs and chicks over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportData.breeding.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="eggs" stroke="#f59e0b" name="Eggs" />
                    <Line type="monotone" dataKey="chicks" stroke="#10b981" name="Chicks" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Most Productive Pair */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Most productive breeding pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-lg font-semibold">Most Productive Pair</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">
                    {reportData.breeding.mostProductivePair?.pairNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {reportData.breeding.mostProductivePair?.chicks || 0} chicks successfully raised
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Project Overview Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
                <CardDescription>Overall project metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{reportData.projects.active}</p>
                      <p className="text-xs text-gray-500">Active Projects</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{reportData.projects.completed}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-600">{reportData.projects.archived}</p>
                      <p className="text-xs text-gray-500">Archived</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{reportData.projects.total}</p>
                      <p className="text-xs text-gray-500">Total Projects</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Averages */}
            <Card>
              <CardHeader>
                <CardTitle>Averages Per Project</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Average Pairs per Project</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Bird className="h-5 w-5 text-emerald-600" />
                      <p className="text-2xl font-bold">{reportData.projects.averagePairsPerProject}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Expense per Project</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-5 w-5 text-red-500" />
                      <p className="text-2xl font-bold">${reportData.projects.averageExpensePerProject.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Investment</p>
                    <div className="flex items-center gap-2 mt-1">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <p className="text-2xl font-bold">${reportData.projects.totalExpenses.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}