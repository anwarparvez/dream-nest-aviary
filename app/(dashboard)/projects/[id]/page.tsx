'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Bird,
  DollarSign,
  Calendar,
  Target,
  FileText,
  Image as ImageIcon,
  Egg,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ProjectType = 'Pigeon' | 'Chicken' | 'Mixed';
type IncomeModel = 'pair_breeding' | 'egg_production' | 'growing' | 'mixed';
type ProjectStatus = 'active' | 'completed' | 'archived';

interface Project {
  _id: string;
  name: string;
  type: ProjectType;
  incomeModel: IncomeModel;
  startDate: string;
  targetCount: number;
  status: ProjectStatus;
  notes?: string;
  pairCount?: number;
  birdCount?: number;
  totalIncome?: number;
  totalExpense?: number;
  profit?: number;
  createdAt: string;
  updatedAt: string;
}

interface Pair {
  _id: string;
  pairNumber: string;
  species: string;
  breed: string;
  maleName: string;
  femaleName: string;
  status: string;
  purchasePrice: number;
  images: string[];
}

interface Bird {
  _id: string;
  birdNumber: string;
  species: string;
  breed: string;
  name: string;
  age?: string;
  color?: string;
  purchaseDate: string;
  purchasePrice: number;
  status: 'active' | 'sold';
  notes?: string;
  images: string[];
}

interface Expense {
  _id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
}

interface Income {
  _id: string;
  source: 'egg_sales' | 'bird_sales' | 'other';
  date: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  description?: string;
  notes?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPairDialogOpen, setAddPairDialogOpen] = useState(false);
  const [addBirdDialogOpen, setAddBirdDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'Pigeon' as ProjectType,
    incomeModel: 'pair_breeding' as IncomeModel,
    targetCount: 0,
    status: 'active' as ProjectStatus,
    notes: '',
  });
  const [pairFormData, setPairFormData] = useState({
    pairNumber: '',
    species: 'Pigeon' as const,
    breed: '',
    maleName: '',
    femaleName: '',
    purchasePrice: 0,
    purchaseDate: '',
    status: 'active' as const,
  });
  const [birdFormData, setBirdFormData] = useState({
    birdNumber: '',
    breed: '',
    name: '',
    age: '',
    color: '',
    purchasePrice: 0,
    purchaseDate: '',
    status: 'active' as const,
    notes: '',
  });
  const [expenseFormData, setExpenseFormData] = useState({
    category: 'Feed',
    amount: 0,
    date: '',
    note: '',
  });
  const [incomeFormData, setIncomeFormData] = useState({
    source: 'bird_sales' as 'egg_sales' | 'bird_sales' | 'other',
    amount: 0,
    quantity: 1,
    unitPrice: 0,
    date: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, pairsRes, birdsRes, expensesRes, incomesRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/pairs?projectId=${params.id}`),
        fetch(`/api/birds?projectId=${params.id}`),
        fetch(`/api/expenses?projectId=${params.id}`),
        fetch(`/api/income?projectId=${params.id}`),
      ]);

      const projectData = await projectRes.json();
      const pairsData = await pairsRes.json();
      const birdsData = await birdsRes.json();
      const expensesData = await expensesRes.json();
      const incomesData = await incomesRes.json();

      setProject(projectData);
      setPairs(Array.isArray(pairsData) ? pairsData : []);
      setBirds(Array.isArray(birdsData) ? birdsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setIncomes(Array.isArray(incomesData) ? incomesData : []);
      setEditFormData({
        name: projectData.name,
        type: projectData.type,
        incomeModel: projectData.incomeModel || 'pair_breeding',
        targetCount: projectData.targetCount || projectData.targetPairCount || 0,
        status: projectData.status,
        notes: projectData.notes || '',
      });
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Project updated successfully');
        setEditDialogOpen(false);
        fetchProjectData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated data.')) {
      try {
        const response = await fetch(`/api/projects/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Project deleted successfully');
          router.push('/projects');
        } else {
          toast.error('Failed to delete project');
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const handleAddPair = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/pairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pairFormData, projectId: params.id }),
      });

      if (response.ok) {
        toast.success('Pair added successfully');
        setAddPairDialogOpen(false);
        setPairFormData({
          pairNumber: '',
          species: 'Pigeon',
          breed: '',
          maleName: '',
          femaleName: '',
          purchasePrice: 0,
          purchaseDate: '',
          status: 'active',
        });
        fetchProjectData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add pair');
      }
    } catch (error) {
      console.error('Failed to add pair:', error);
      toast.error('Failed to add pair');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBird = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/birds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...birdFormData, projectId: params.id }),
      });

      if (response.ok) {
        toast.success('Bird added successfully');
        setAddBirdDialogOpen(false);
        setBirdFormData({
          birdNumber: '',
          breed: '',
          name: '',
          age: '',
          color: '',
          purchasePrice: 0,
          purchaseDate: '',
          status: 'active',
          notes: '',
        });
        fetchProjectData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add bird');
      }
    } catch (error) {
      console.error('Failed to add bird:', error);
      toast.error('Failed to add bird');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseFormData, projectId: params.id }),
      });

      if (response.ok) {
        toast.success('Expense added successfully');
        setAddExpenseDialogOpen(false);
        setExpenseFormData({
          category: 'Feed',
          amount: 0,
          date: '',
          note: '',
        });
        fetchProjectData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Failed to add expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...incomeFormData, projectId: params.id }),
      });

      if (response.ok) {
        toast.success('Income added successfully');
        setAddIncomeDialogOpen(false);
        setIncomeFormData({
          source: 'bird_sales',
          amount: 0,
          quantity: 1,
          unitPrice: 0,
          date: '',
          description: '',
          notes: '',
        });
        fetchProjectData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add income');
      }
    } catch (error) {
      console.error('Failed to add income:', error);
      toast.error('Failed to add income');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    if (confirm('Are you sure you want to delete this pair?')) {
      try {
        const response = await fetch(`/api/pairs/${pairId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Pair deleted successfully');
          fetchProjectData();
        } else {
          toast.error('Failed to delete pair');
        }
      } catch (error) {
        console.error('Failed to delete pair:', error);
        toast.error('Failed to delete pair');
      }
    }
  };

  const handleDeleteBird = async (birdId: string) => {
    if (confirm('Are you sure you want to delete this bird?')) {
      try {
        const response = await fetch(`/api/birds/${birdId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Bird deleted successfully');
          fetchProjectData();
        } else {
          toast.error('Failed to delete bird');
        }
      } catch (error) {
        console.error('Failed to delete bird:', error);
        toast.error('Failed to delete bird');
      }
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Expense deleted successfully');
          fetchProjectData();
        } else {
          toast.error('Failed to delete expense');
        }
      } catch (error) {
        console.error('Failed to delete expense:', error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      try {
        const response = await fetch(`/api/income/${incomeId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Income deleted successfully');
          fetchProjectData();
        } else {
          toast.error('Failed to delete income');
        }
      } catch (error) {
        console.error('Failed to delete income:', error);
        toast.error('Failed to delete income');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIncomeModelInfo = (model: IncomeModel) => {
    switch (model) {
      case 'pair_breeding':
        return { text: 'Pair Breeding', icon: '🐦', description: 'Income from selling grown pigeons bred from pairs' };
      case 'egg_production':
        return { text: 'Egg Production', icon: '🥚', description: 'Income from selling eggs' };
      case 'growing':
        return { text: 'Growing', icon: '📈', description: 'Income from growing and selling chickens' };
      case 'mixed':
        return { text: 'Mixed Model', icon: '🔄', description: 'Multiple income sources' };
      default:
        return { text: 'Unknown', icon: '❓', description: '' };
    }
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const profit = totalIncome - totalExpenses;
  
  const totalCount = project?.incomeModel === 'pair_breeding' ? pairs.length : birds.length;
  const progress = project ? (totalCount / project.targetCount) * 100 : 0;
  const incomeInfo = project ? getIncomeModelInfo(project.incomeModel) : { text: '', icon: '', description: '' };

  const isPairBreeding = project?.incomeModel === 'pair_breeding';
  const isEggProduction = project?.incomeModel === 'egg_production';
  const isGrowing = project?.incomeModel === 'growing';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Project not found</p>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Back to Projects
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/projects')}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Badge className={getStatusColor(project.status)}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <span>{incomeInfo.icon}</span> {incomeInfo.text}
              </Badge>
            </div>
            <p className="text-gray-600">Type: {project.type}</p>
            <p className="text-sm text-gray-500 mt-1">{incomeInfo.description}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <span>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditProject}>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Project Name</Label>
                      <Input
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Target {isEggProduction ? 'Eggs/Day' : isGrowing ? 'Birds' : 'Pairs'}</Label>
                      <Input
                        type="number"
                        value={editFormData.targetCount}
                        onChange={(e) => setEditFormData({ ...editFormData, targetCount: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value) => {
                          if (value === 'active' || value === 'completed' || value === 'archived') {
                            setEditFormData({ ...editFormData, status: value });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isEggProduction ? 'Daily Egg Production' : isGrowing ? 'Total Birds' : 'Total Pairs'}
                </p>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-gray-500">Target: {project.targetCount}</p>
              </div>
              {isEggProduction ? (
                <Egg className="h-8 w-8 text-yellow-500" />
              ) : (
                <Bird className="h-8 w-8 text-emerald-600" />
              )}
            </div>
          </CardContent>
        </Card>

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
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit / Loss</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${profit.toLocaleString()}
                </p>
              </div>
              {profit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              ) : (
                <TrendingUp className="h-8 w-8 text-red-600 transform rotate-180" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">
            {isPairBreeding ? 'Pairs' : isEggProduction ? 'Egg Production' : 'Birds'} ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="income">Income ({incomes.length})</TabsTrigger>
          <TabsTrigger value="breeding">Breeding</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Key information about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-600">Project Name:</p><p className="font-medium">{project.name}</p></div>
                  <div><p className="text-gray-600">Project Type:</p><p className="font-medium">{project.type}</p></div>
                  <div><p className="text-gray-600">Income Model:</p><p className="font-medium">{incomeInfo.text} {incomeInfo.icon}</p></div>
                  <div><p className="text-gray-600">Status:</p><p className="font-medium capitalize">{project.status}</p></div>
                  <div><p className="text-gray-600">Created:</p><p className="font-medium">{format(new Date(project.createdAt), 'PPP')}</p></div>
                  <div><p className="text-gray-600">Start Date:</p><p className="font-medium">{format(new Date(project.startDate), 'PPP')}</p></div>
                </div>
              </div>
              
              {project.notes && (
                <div><h3 className="font-semibold mb-2">Notes</h3><p className="text-gray-600 whitespace-pre-wrap">{project.notes}</p></div>
              )}

              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold mb-2">Financial Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className={`text-xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>${profit.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {isPairBreeding ? 'Breeding Pairs' : isEggProduction ? 'Egg Production' : 'Birds'}
                  </CardTitle>
                  <CardDescription>
                    {isPairBreeding 
                      ? 'Manage all breeding pairs in this project'
                      : isEggProduction 
                        ? 'Track egg production and sales'
                        : 'Manage all birds in this project'}
                  </CardDescription>
                </div>
                {!isEggProduction && (
                  <Dialog open={isPairBreeding ? addPairDialogOpen : addBirdDialogOpen} onOpenChange={isPairBreeding ? setAddPairDialogOpen : setAddBirdDialogOpen}>
                    <DialogTrigger asChild>
                      <span>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="mr-2 h-4 w-4" />
                          Add {isPairBreeding ? 'Pair' : 'Bird'}
                        </Button>
                      </span>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New {isPairBreeding ? 'Pair' : 'Bird'}</DialogTitle>
                        <DialogDescription>
                          Fill in the details to add a new {isPairBreeding ? 'breeding pair' : 'bird'}.
                        </DialogDescription>
                      </DialogHeader>
                      {isPairBreeding ? (
                        <form onSubmit={handleAddPair}>
                          <div className="space-y-4 py-4">
                            <div><Label>Pair Number *</Label><Input value={pairFormData.pairNumber} onChange={(e) => setPairFormData({ ...pairFormData, pairNumber: e.target.value })} required /></div>
                            <div><Label>Species *</Label><Select value={pairFormData.species} onValueChange={(value: any) => setPairFormData({ ...pairFormData, species: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pigeon">Pigeon</SelectItem><SelectItem value="Chicken">Chicken</SelectItem></SelectContent></Select></div>
                            <div><Label>Breed *</Label><Input value={pairFormData.breed} onChange={(e) => setPairFormData({ ...pairFormData, breed: e.target.value })} required /></div>
                            <div><Label>Male Name *</Label><Input value={pairFormData.maleName} onChange={(e) => setPairFormData({ ...pairFormData, maleName: e.target.value })} required /></div>
                            <div><Label>Female Name *</Label><Input value={pairFormData.femaleName} onChange={(e) => setPairFormData({ ...pairFormData, femaleName: e.target.value })} required /></div>
                            <div><Label>Purchase Date *</Label><Input type="date" value={pairFormData.purchaseDate} onChange={(e) => setPairFormData({ ...pairFormData, purchaseDate: e.target.value })} required /></div>
                            <div><Label>Purchase Price *</Label><Input type="number" step="0.01" value={pairFormData.purchasePrice} onChange={(e) => setPairFormData({ ...pairFormData, purchasePrice: parseFloat(e.target.value) })} required /></div>
                          </div>
                          <DialogFooter><Button type="button" variant="outline" onClick={() => setAddPairDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting ? 'Adding...' : 'Add Pair'}</Button></DialogFooter>
                        </form>
                      ) : (
                        <form onSubmit={handleAddBird}>
                          <div className="space-y-4 py-4">
                            <div><Label>Bird Number *</Label><Input value={birdFormData.birdNumber} onChange={(e) => setBirdFormData({ ...birdFormData, birdNumber: e.target.value })} required /></div>
                            <div><Label>Name *</Label><Input value={birdFormData.name} onChange={(e) => setBirdFormData({ ...birdFormData, name: e.target.value })} required /></div>
                            <div><Label>Breed *</Label><Input value={birdFormData.breed} onChange={(e) => setBirdFormData({ ...birdFormData, breed: e.target.value })} required /></div>
                            <div><Label>Age</Label><Input value={birdFormData.age} onChange={(e) => setBirdFormData({ ...birdFormData, age: e.target.value })} placeholder="e.g., 6 months" /></div>
                            <div><Label>Color</Label><Input value={birdFormData.color} onChange={(e) => setBirdFormData({ ...birdFormData, color: e.target.value })} placeholder="White, Black, etc." /></div>
                            <div><Label>Purchase Date *</Label><Input type="date" value={birdFormData.purchaseDate} onChange={(e) => setBirdFormData({ ...birdFormData, purchaseDate: e.target.value })} required /></div>
                            <div><Label>Purchase Price *</Label><Input type="number" step="0.01" value={birdFormData.purchasePrice} onChange={(e) => setBirdFormData({ ...birdFormData, purchasePrice: parseFloat(e.target.value) })} required /></div>
                            <div><Label>Notes</Label><Textarea value={birdFormData.notes} onChange={(e) => setBirdFormData({ ...birdFormData, notes: e.target.value })} rows={2} /></div>
                          </div>
                          <DialogFooter><Button type="button" variant="outline" onClick={() => setAddBirdDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting ? 'Adding...' : 'Add Bird'}</Button></DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEggProduction ? (
                <div className="text-center py-8">
                  <Egg className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-500">Track egg production from this project</p>
                  <p className="text-sm text-gray-400 mt-2">Use the Income tab to record egg sales</p>
                  <Button variant="outline" onClick={() => setAddIncomeDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Record Egg Sale
                  </Button>
                </div>
              ) : isPairBreeding ? (
                pairs.length === 0 ? (
                  <div className="text-center py-8"><Bird className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No pairs added yet</p><Button variant="outline" onClick={() => setAddPairDialogOpen(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Your First Pair</Button></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Pair #</TableHead><TableHead>Species</TableHead><TableHead>Breed</TableHead><TableHead>Male</TableHead><TableHead>Female</TableHead><TableHead>Status</TableHead><TableHead>Purchase Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {pairs.map((pair) => (
                          <TableRow key={pair._id}>
                            <TableCell className="font-medium">{pair.pairNumber}</TableCell>
                            <TableCell>{pair.species}</TableCell><TableCell>{pair.breed}</TableCell>
                            <TableCell>{pair.maleName}</TableCell><TableCell>{pair.femaleName}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{pair.status}</Badge></TableCell>
                            <TableCell>${pair.purchasePrice.toLocaleString()}</TableCell>
                            <TableCell><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => router.push(`/pairs/${pair._id}`)}>View Details</Button><Button variant="ghost" size="sm" onClick={() => handleDeletePair(pair._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                birds.length === 0 ? (
                  <div className="text-center py-8"><Bird className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No birds added yet</p><Button variant="outline" onClick={() => setAddBirdDialogOpen(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Your First Bird</Button></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Bird #</TableHead><TableHead>Name</TableHead><TableHead>Breed</TableHead><TableHead>Age</TableHead><TableHead>Color</TableHead><TableHead>Status</TableHead><TableHead>Purchase Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {birds.map((bird) => (
                          <TableRow key={bird._id}>
                            <TableCell className="font-medium">{bird.birdNumber}</TableCell>
                            <TableCell>{bird.name}</TableCell><TableCell>{bird.breed}</TableCell>
                            <TableCell>{bird.age || '-'}</TableCell><TableCell>{bird.color || '-'}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{bird.status}</Badge></TableCell>
                            <TableCell>${bird.purchasePrice.toLocaleString()}</TableCell>
                            <TableCell><Button variant="ghost" size="sm" onClick={() => handleDeleteBird(bird._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>Expenses</CardTitle><CardDescription>Track all project expenses</CardDescription></div>
                <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
                  <DialogTrigger asChild>
                    <span>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Expense
                      </Button>
                    </span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Expense</DialogTitle><DialogDescription>Fill in the details to add a new expense.</DialogDescription></DialogHeader>
                    <form onSubmit={handleAddExpense}>
                      <div className="space-y-4 py-4">
                        <div><Label>Category *</Label><Select value={expenseFormData.category} onValueChange={(value: any) => setExpenseFormData({ ...expenseFormData, category: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Feed">Feed</SelectItem><SelectItem value="Medicine">Medicine</SelectItem><SelectItem value="Cage">Cage</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Utility">Utility</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                        <div><Label>Amount ($) *</Label><Input type="number" step="0.01" value={expenseFormData.amount} onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) })} required /></div>
                        <div><Label>Date *</Label><Input type="date" value={expenseFormData.date} onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })} required /></div>
                        <div><Label>Note</Label><Textarea value={expenseFormData.note} onChange={(e) => setExpenseFormData({ ...expenseFormData, note: e.target.value })} rows={3} /></div>
                      </div>
                      <DialogFooter><Button type="button" variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting ? 'Adding...' : 'Add Expense'}</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8"><DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No expenses recorded yet</p><Button variant="outline" onClick={() => setAddExpenseDialogOpen(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add First Expense</Button></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Note</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                          <TableCell>${expense.amount.toLocaleString()}</TableCell>
                          <TableCell>{expense.note || '-'}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>Income Records</CardTitle><CardDescription>Track all income from this project</CardDescription></div>
                <Dialog open={addIncomeDialogOpen} onOpenChange={setAddIncomeDialogOpen}>
                  <DialogTrigger asChild>
                    <span>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Income
                      </Button>
                    </span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Income</DialogTitle><DialogDescription>Record income from sales or other sources.</DialogDescription></DialogHeader>
                    <form onSubmit={handleAddIncome}>
                      <div className="space-y-4 py-4">
                        <div><Label>Source *</Label><Select value={incomeFormData.source} onValueChange={(value: any) => setIncomeFormData({ ...incomeFormData, source: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bird_sales">🦜 Bird Sales</SelectItem><SelectItem value="egg_sales">🥚 Egg Sales</SelectItem><SelectItem value="other">💰 Other</SelectItem></SelectContent></Select></div>
                        <div><Label>Quantity *</Label><Input type="number" min="1" value={incomeFormData.quantity} onChange={(e) => setIncomeFormData({ ...incomeFormData, quantity: parseInt(e.target.value) })} required /></div>
                        <div><Label>Unit Price ($) *</Label><Input type="number" step="0.01" value={incomeFormData.unitPrice} onChange={(e) => setIncomeFormData({ ...incomeFormData, unitPrice: parseFloat(e.target.value) })} required /></div>
                        <div><Label>Total Amount ($) *</Label><Input type="number" step="0.01" value={incomeFormData.amount} onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: parseFloat(e.target.value) })} required /></div>
                        <div><Label>Date *</Label><Input type="date" value={incomeFormData.date} onChange={(e) => setIncomeFormData({ ...incomeFormData, date: e.target.value })} required /></div>
                        <div><Label>Description</Label><Input value={incomeFormData.description} onChange={(e) => setIncomeFormData({ ...incomeFormData, description: e.target.value })} placeholder="Sale of 10 pigeons" /></div>
                        <div><Label>Notes</Label><Textarea value={incomeFormData.notes} onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })} rows={2} /></div>
                      </div>
                      <DialogFooter><Button type="button" variant="outline" onClick={() => setAddIncomeDialogOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting ? 'Adding...' : 'Add Income'}</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {incomes.length === 0 ? (
                <div className="text-center py-8"><TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">No income recorded yet</p><Button variant="outline" onClick={() => setAddIncomeDialogOpen(true)} className="mt-4"><Plus className="mr-2 h-4 w-4" />Add First Income</Button></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Quantity</TableHead><TableHead>Unit Price</TableHead><TableHead>Amount</TableHead><TableHead>Description</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {incomes.map((income) => (
                        <TableRow key={income._id}>
                          <TableCell>{format(new Date(income.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell><Badge variant="outline">{income.source === 'bird_sales' ? '🦜 Bird Sales' : income.source === 'egg_sales' ? '🥚 Egg Sales' : '💰 Other'}</Badge></TableCell>
                          <TableCell>{income.quantity}</TableCell>
                          <TableCell>${income.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="font-medium text-green-600">${income.amount.toLocaleString()}</TableCell>
                          <TableCell>{income.description || '-'}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(income._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breeding Tab */}
        <TabsContent value="breeding">
          <Card>
            <CardHeader><CardTitle>Breeding Records</CardTitle><CardDescription>Track breeding success and hatch rates</CardDescription></CardHeader>
            <CardContent>
              {isPairBreeding ? (
                <div className="text-center py-8"><Egg className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">Breeding records will appear here</p><p className="text-sm text-gray-400 mt-2">Add breeding records from individual pair pages</p></div>
              ) : (
                <div className="text-center py-8"><Egg className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">Breeding records are only available for Pair Breeding projects</p><p className="text-sm text-gray-400 mt-2">This project uses {incomeInfo.text.toLowerCase()} model</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <Card>
            <CardHeader><CardTitle>Photo Gallery</CardTitle><CardDescription>Images and photos from this project</CardDescription></CardHeader>
            <CardContent><div className="text-center py-8"><ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-500">Gallery coming soon</p><p className="text-sm text-gray-400 mt-2">Upload and manage photos from this project</p></div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}