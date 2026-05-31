'use client';

import { useEffect, useState } from 'react';
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
  DollarSign,
  Search,
  Download,
  FileText,
  TrendingUp,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

type ExpenseCategory = 'Feed' | 'Medicine' | 'Cage' | 'Transport' | 'Utility' | 'Other';

interface Expense {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  date: string;
  category: ExpenseCategory;
  amount: number;
  note?: string;
  receiptImage?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
  type: string;
}

const CATEGORIES: ExpenseCategory[] = ['Feed', 'Medicine', 'Cage', 'Transport', 'Utility', 'Other'];
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Feed: '#10b981',
  Medicine: '#ef4444',
  Cage: '#3b82f6',
  Transport: '#f59e0b',
  Utility: '#8b5cf6',
  Other: '#6b7280',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    projectId: '',
    date: '',
    category: 'Feed' as ExpenseCategory,
    amount: 0,
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expensesRes, projectsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/projects'),
      ]);

      const expensesData = await expensesRes.json();
      const projectsData = await projectsRes.json();

      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load expenses');
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
    
    setSubmitting(true);
    
    try {
      const url = editingExpense ? `/api/expenses/${editingExpense._id}` : '/api/expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      
      const submitData = {
        projectId: formData.projectId,
        date: formData.date,
        category: formData.category,
        amount: formData.amount,
        note: formData.note || '',
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingExpense ? 'Expense updated successfully' : 'Expense added successfully');
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        console.error('API Error:', result);
        toast.error(result.error || 'Failed to save expense');
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Expense deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete expense');
        }
      } catch (error) {
        console.error('Failed to delete expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      projectId: expense.projectId._id,
      date: expense.date.split('T')[0],
      category: expense.category,
      amount: expense.amount,
      note: expense.note || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      projectId: '',
      date: '',
      category: 'Feed',
      amount: 0,
      note: '',
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredExpenses();
    if (filtered.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const csvData = filtered.map(expense => ({
      Date: format(new Date(expense.date), 'PPP'),
      Project: expense.projectId.name,
      Category: expense.category,
      Amount: expense.amount,
      Note: expense.note || '',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Export completed');
  };

  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const matchesSearch = searchTerm === '' || 
        expense.projectId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.note?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
      const matchesProject = selectedProject === 'all' || expense.projectId._id === selectedProject;
      
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = new Date(expense.date) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDate = matchesDate && new Date(expense.date) <= new Date(dateRange.end);
      }
      
      return matchesSearch && matchesCategory && matchesProject && matchesDate;
    });
  };

  const filteredExpenses = getFilteredExpenses();
  
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  
  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(item => item.value > 0);
  
  const monthlyData = filteredExpenses.reduce((acc, expense) => {
    const month = format(new Date(expense.date), 'MMM yyyy');
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ month, amount: expense.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]).slice(-6);
  
  const projectData = filteredExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.projectId.name);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ name: expense.projectId.name, amount: expense.amount });
    }
    return acc;
  }, [] as { name: string; amount: number }[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-2">
            Track and manage all farm expenses
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                <DialogDescription>
                  {editingExpense ? 'Update the expense details below.' : 'Fill in the details to add a new expense.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Project *</Label>
                    <Select
                      value={formData.projectId || undefined}
                      onValueChange={(value) => {
                        if (value) {
                          setFormData({ ...formData, projectId: value });
                        }
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
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        if (value && CATEGORIES.includes(value as ExpenseCategory)) {
                          setFormData({ ...formData, category: value as ExpenseCategory });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Amount ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label>Note (Optional)</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional details about this expense..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingExpense ? 'Update Expense' : 'Add Expense'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Number of Transactions</p>
                <p className="text-2xl font-bold">{filteredExpenses.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Expense</p>
                <p className="text-2xl font-bold">${averageExpense.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
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
              <BarChart3 className="h-8 w-8 text-purple-500" />
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
                placeholder="Search by project or note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Fixed Category Filter */}
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedCategory(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Fixed Project Filter */}
            <Select 
              value={selectedProject} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedProject(value);
                }
              }}
            >
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
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Distribution across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as ExpenseCategory]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardDescription>Last 6 months trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Expenses by Project</CardTitle>
                <CardDescription>Comparison across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" fill="#3b82f6" name="Amount ($)" />
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
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No expenses found</p>
                  <p className="text-gray-400 mt-2">
                    {searchTerm || selectedCategory !== 'all' || selectedProject !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first expense to get started'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{expense.projectId.name}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}>
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">${expense.amount.toLocaleString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{expense.note || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(expense)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(expense._id)}
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

      {/* Summary */}
      {filteredExpenses.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIES.map(cat => {
                const amount = filteredExpenses
                  .filter(e => e.category === cat)
                  .reduce((sum, e) => sum + e.amount, 0);
                if (amount === 0) return null;
                return (
                  <div key={cat} className="text-center">
                    <p className="text-sm text-gray-600">{cat}</p>
                    <p className="text-xl font-bold" style={{ color: CATEGORY_COLORS[cat] }}>
                      ${amount.toLocaleString()}
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