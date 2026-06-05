'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Search,
  Download,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
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
import { toast } from 'sonner';

type IncomeSource = 'bird_sales' | 'egg_sales' | 'other';

interface Income {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    type: string;
    incomeModel: string;
  };
  source: IncomeSource;
  date: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  type: string;
  incomeModel: string;
}

const SOURCE_COLORS = {
  bird_sales: '#10b981',
  egg_sales: '#f59e0b',
  other: '#8b5cf6',
};

const SOURCE_ICONS = {
  bird_sales: '🦜',
  egg_sales: '🥚',
  other: '💰',
};

const SOURCE_LABELS = {
  bird_sales: 'Bird Sales',
  egg_sales: 'Egg Sales',
  other: 'Other Income',
};

export default function IncomePage() {
  const { data: session } = useSession();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    source: 'bird_sales' as IncomeSource,
    amount: 0,
    quantity: 1,
    unitPrice: 0,
    date: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incomesRes, projectsRes] = await Promise.all([
        fetch('/api/income'),
        fetch('/api/projects'),
      ]);

      const incomesData = await incomesRes.json();
      const projectsData = await projectsRes.json();

      setIncomes(Array.isArray(incomesData) ? incomesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    if (formData.unitPrice < 0) {
      toast.error('Unit price must be a positive number');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const url = editingIncome ? `/api/income/${editingIncome._id}` : '/api/income';
      const method = editingIncome ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingIncome ? 'Income updated successfully' : 'Income added successfully');
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(result.error || 'Failed to save income');
      }
    } catch (error) {
      console.error('Failed to save income:', error);
      toast.error('Failed to save income');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      try {
        const response = await fetch(`/api/income/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Income deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete income');
        }
      } catch (error) {
        console.error('Failed to delete income:', error);
        toast.error('Failed to delete income');
      }
    }
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setFormData({
      projectId: income.projectId._id,
      source: income.source,
      amount: income.amount,
      quantity: income.quantity,
      unitPrice: income.unitPrice,
      date: income.date.split('T')[0],
      description: income.description || '',
      notes: income.notes || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingIncome(null);
    setFormData({
      projectId: '',
      source: 'bird_sales',
      amount: 0,
      quantity: 1,
      unitPrice: 0,
      date: '',
      description: '',
      notes: '',
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredIncomes();
    if (filtered.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const csvData = filtered.map(income => ({
      Date: format(new Date(income.date), 'PPP'),
      Project: income.projectId.name,
      Source: SOURCE_LABELS[income.source],
      Quantity: income.quantity,
      'Unit Price': income.unitPrice,
      Amount: income.amount,
      Description: income.description || '',
      Notes: income.notes || '',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Export completed');
  };

  const getFilteredIncomes = () => {
    return incomes.filter(income => {
      const matchesSearch = searchTerm === '' || 
        income.projectId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = selectedSource === 'all' || income.source === selectedSource;
      const matchesProject = selectedProject === 'all' || income.projectId._id === selectedProject;
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = new Date(income.date) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDate = matchesDate && new Date(income.date) <= new Date(dateRange.end);
      }
      
      return matchesSearch && matchesSource && matchesProject && matchesDate;
    });
  };

  const filteredIncomes = getFilteredIncomes();
  
  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const averageIncome = filteredIncomes.length > 0 ? totalIncome / filteredIncomes.length : 0;
  
  const sourceData = Object.entries(SOURCE_LABELS).map(([key, label]) => ({
    name: label,
    value: filteredIncomes.filter(i => i.source === key).reduce((sum, i) => sum + i.amount, 0),
    source: key,
  })).filter(item => item.value > 0);
  
  const monthlyData = filteredIncomes.reduce((acc, income) => {
    const month = format(new Date(income.date), 'MMM yyyy');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += income.amount;
    } else {
      acc.push({ month, amount: income.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]).slice(-6);
  
  const projectData = filteredIncomes.reduce((acc, income) => {
    const existing = acc.find(item => item.name === income.projectId.name);
    if (existing) {
      existing.amount += income.amount;
    } else {
      acc.push({ name: income.projectId.name, amount: income.amount });
    }
    return acc;
  }, [] as { name: string; amount: number }[]);

  const isAdmin = (session?.user as any)?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income</h1>
          <p className="text-gray-600 mt-2">
            Track all income from your farm operations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <span>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Income
                  </Button>
                </span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingIncome ? 'Edit Income' : 'Add New Income'}</DialogTitle>
                  <DialogDescription>
                    {editingIncome ? 'Update the income details below.' : 'Fill in the details to add a new income record.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Project *</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) => {
                          if (value) setFormData({ ...formData, projectId: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Source *</Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value: IncomeSource) => setFormData({ ...formData, source: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bird_sales">🦜 Bird Sales</SelectItem>
                          <SelectItem value="egg_sales">🥚 Egg Sales</SelectItem>
                          <SelectItem value="other">💰 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Unit Price ($) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Total Amount ($) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        placeholder="Calculated from quantity × unit price"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.quantity} × ${formData.unitPrice.toFixed(2)} = ${(formData.quantity * formData.unitPrice).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., Sale of 10 pigeons"
                      />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes about this income..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting ? 'Saving...' : (editingIncome ? 'Update Income' : 'Add Income')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Number of Transactions</p>
                <p className="text-2xl font-bold">{filteredIncomes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Income</p>
                <p className="text-2xl font-bold">${averageIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by project or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSource} onValueChange={(value) => {
              if (value) setSelectedSource(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="bird_sales">🦜 Bird Sales</SelectItem>
                <SelectItem value="egg_sales">🥚 Egg Sales</SelectItem>
                <SelectItem value="other">💰 Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedProject} onValueChange={(value) => {
              if (value) setSelectedProject(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <Input
                type="date"
                placeholder="End date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="table" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Source Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Income by Source</CardTitle>
                <CardDescription>Distribution across different sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.source as IncomeSource]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income Trend</CardTitle>
                <CardDescription>Last 6 months performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#10b981" name="Income ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Income by Project */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Income by Project</CardTitle>
                <CardDescription>Comparison across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3b82f6" name="Income ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filteredIncomes.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No income records found</p>
                  <p className="text-gray-400 mt-2">
                    {searchTerm || selectedSource !== 'all' || selectedProject !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first income record to get started'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncomes.map((income) => (
                        <TableRow key={income._id}>
                          <TableCell>{format(new Date(income.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{income.projectId.name}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: SOURCE_COLORS[income.source] }}>
                              {SOURCE_ICONS[income.source]} {SOURCE_LABELS[income.source]}
                            </Badge>
                          </TableCell>
                          <TableCell>{income.quantity}</TableCell>
                          <TableCell>${income.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            ${income.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{income.description || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(income)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(income._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      {filteredIncomes.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary by Source</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(SOURCE_LABELS).map(([source, label]) => {
                const amount = filteredIncomes
                  .filter(i => i.source === source)
                  .reduce((sum, i) => sum + i.amount, 0);
                if (amount === 0) return null;
                return (
                  <div key={source} className="text-center p-4 bg-white/50 rounded-lg">
                    <p className="text-2xl mb-2">{SOURCE_ICONS[source as IncomeSource]}</p>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-xl font-bold" style={{ color: SOURCE_COLORS[source as IncomeSource] }}>
                      ${amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((amount / totalIncome) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}