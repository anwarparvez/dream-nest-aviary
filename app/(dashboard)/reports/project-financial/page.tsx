'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bird,
  Calendar,
  Search,
  Loader2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProjectFinancial {
  _id: string;
  name: string;
  type: string;
  incomeModel: string;
  status: string;
  startDate: string;
  targetCount: number;
  currentCount: number;
  investment: {
    total: number;
    pairs: number;
    birds: number;
    feed: number;
    medicine: number;
    cage: number;
    transport: number;
    utility: number;
    other: number;
  };
  income: {
    total: number;
    birdSales: number;
    eggSales: number;
    other: number;
  };
  profit: number;
  profitMargin: number;
  roi: number;
  transactions: {
    expenses: Array<{
      _id: string;
      date: string;
      category: string;
      amount: number;
      note: string;
    }>;
    incomes: Array<{
      _id: string;
      date: string;
      source: string;
      amount: number;
      quantity: number;
      unitPrice: number;
      description: string;
    }>;
  };
}

export default function ProjectFinancialReportPage() {
  const [projects, setProjects] = useState<ProjectFinancial[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIncomeModel, setSelectedIncomeModel] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectFinancialData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, selectedType, selectedStatus, selectedIncomeModel, selectedProject, dateRange, projects]);

  const fetchProjectFinancialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/project-financial');
      const data = await response.json();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Failed to fetch project financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    if (selectedIncomeModel !== 'all') {
      filtered = filtered.filter(p => p.incomeModel === selectedIncomeModel);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(p => p._id === selectedProject);
    }

    if (dateRange.start) {
      filtered = filtered.filter(p => new Date(p.startDate) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(p => new Date(p.startDate) <= new Date(dateRange.end));
    }

    setFilteredProjects(filtered);
  };

  const exportToCSV = () => {
    if (filteredProjects.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvData = filteredProjects.map(project => ({
      'Project Name': project.name,
      'Type': project.type,
      'Income Model': project.incomeModel,
      'Status': project.status,
      'Start Date': format(new Date(project.startDate), 'PPP'),
      'Total Investment': project.investment.total,
      'Feed Investment': project.investment.feed,
      'Medicine Investment': project.investment.medicine,
      'Cage Investment': project.investment.cage,
      'Transport Investment': project.investment.transport,
      'Utility Investment': project.investment.utility,
      'Other Investment': project.investment.other,
      'Total Income': project.income.total,
      'Bird Sales': project.income.birdSales,
      'Egg Sales': project.income.eggSales,
      'Other Income': project.income.other,
      'Profit': project.profit,
      'Profit Margin %': project.profitMargin,
      'ROI %': project.roi,
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitIcon = (profit: number) => {
    if (profit > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (profit < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const totalInvestment = filteredProjects.reduce((sum, p) => sum + p.investment.total, 0);
  const totalIncome = filteredProjects.reduce((sum, p) => sum + p.income.total, 0);
  const totalProfit = filteredProjects.reduce((sum, p) => sum + p.profit, 0);
  const averageROI = filteredProjects.length > 0 
    ? filteredProjects.reduce((sum, p) => sum + p.roi, 0) / filteredProjects.length 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Financial Report</h1>
          <p className="text-gray-600 mt-2">
            Detailed investment, expense, and income analysis by project
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${totalInvestment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Across {filteredProjects.length} projects
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Profit</p>
                <p className={`text-2xl font-bold ${getProfitColor(totalProfit)}`}>
                  ${totalProfit.toLocaleString()}
                </p>
              </div>
              {getProfitIcon(totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average ROI</p>
                <p className="text-2xl font-bold text-purple-700">
                  {averageROI.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Project Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Pigeon">🐦 Pigeon</SelectItem>
                <SelectItem value="Chicken">🐔 Chicken</SelectItem>
                <SelectItem value="Mixed">🦜 Mixed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">🟢 Active</SelectItem>
                <SelectItem value="completed">🔵 Completed</SelectItem>
                <SelectItem value="archived">⚪ Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedIncomeModel} onValueChange={setSelectedIncomeModel}>
              <SelectTrigger>
                <SelectValue placeholder="Income Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="pair_breeding">🐦 Pair Breeding</SelectItem>
                <SelectItem value="egg_production">🥚 Egg Production</SelectItem>
                <SelectItem value="growing">📈 Growing</SelectItem>
                <SelectItem value="mixed">🔄 Mixed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />

            <Input
              type="date"
              placeholder="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Financial Table */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No projects found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Create a project to see financial data'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project._id} className="overflow-hidden">
              {/* Project Header */}
              <div 
                className="p-4 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleProjectExpansion(project._id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-green-100 text-green-700' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Type: {project.type}</span>
                      <span>Model: {project.incomeModel}</span>
                      <span>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Investment</p>
                      <p className="font-semibold">${project.investment.total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Income</p>
                      <p className="font-semibold text-green-600">${project.income.total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Profit</p>
                      <p className={`font-semibold ${getProfitColor(project.profit)}`}>
                        ${project.profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">ROI</p>
                      <p className="font-semibold text-purple-600">{project.roi.toFixed(2)}%</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedProject === project._id ? '▲ Hide' : '▼ Details'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedProject === project._id && (
                <div className="p-4 border-t">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Investment Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Investment Breakdown</CardTitle>
                        <CardDescription>Expense categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between py-1">
                            <span>Pairs/Birds Purchase</span>
                            <span className="font-medium">
                              ${(project.investment.pairs + project.investment.birds).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Feed</span>
                            <span>${project.investment.feed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Medicine</span>
                            <span>${project.investment.medicine.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Cage/Equipment</span>
                            <span>${project.investment.cage.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Transport</span>
                            <span>${project.investment.transport.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Utility</span>
                            <span>${project.investment.utility.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1 pt-2 border-t font-semibold">
                            <span>Total Investment</span>
                            <span>${project.investment.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Income Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Income Breakdown</CardTitle>
                        <CardDescription>Revenue sources</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between py-1">
                            <span>Bird Sales</span>
                            <span className="text-green-600">${project.income.birdSales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Egg Sales</span>
                            <span className="text-green-600">${project.income.eggSales.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Other Income</span>
                            <span>${project.income.other.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1 pt-2 border-t font-semibold">
                            <span>Total Income</span>
                            <span className="text-green-600">${project.income.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Key Metrics */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">Key Performance Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Target Count</p>
                            <p className="text-xl font-bold">{project.targetCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Current Count</p>
                            <p className="text-xl font-bold">{project.currentCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Progress</p>
                            <p className="text-xl font-bold">
                              {((project.currentCount / project.targetCount) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Profit Margin</p>
                            <p className={`text-xl font-bold ${getProfitColor(project.profitMargin)}`}>
                              {project.profitMargin.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transactions Section */}
                    {(project.transactions.expenses.length > 0 || project.transactions.incomes.length > 0) && (
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {project.transactions.expenses.slice(0, 5).map((expense) => (
                              <div key={expense._id} className="flex justify-between items-center py-2 border-b">
                                <div>
                                  <p className="font-medium">{expense.category}</p>
                                  <p className="text-xs text-gray-500">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-red-600">-${expense.amount.toLocaleString()}</p>
                                  {expense.note && <p className="text-xs text-gray-500">{expense.note}</p>}
                                </div>
                              </div>
                            ))}
                            {project.transactions.incomes.slice(0, 5).map((income) => (
                              <div key={income._id} className="flex justify-between items-center py-2 border-b">
                                <div>
                                  <p className="font-medium">
                                    {income.source === 'bird_sales' ? 'Bird Sale' : 
                                     income.source === 'egg_sales' ? 'Egg Sale' : 'Other Income'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {income.quantity} × ${income.unitPrice}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-green-600">+${income.amount.toLocaleString()}</p>
                                  {income.description && <p className="text-xs text-gray-500">{income.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <Link href={`/projects/${project._id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Eye className="mr-2 h-4 w-4" />
                                View Full Project Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}