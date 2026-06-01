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
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ProjectType = 'Pigeon' | 'Chicken' | 'Mixed';
type ProjectStatus = 'active' | 'completed' | 'archived';

interface Project {
  _id: string;
  name: string;
  type: ProjectType;
  startDate: string;
  targetPairCount: number;
  status: ProjectStatus;
  notes?: string;
  pairCount: number;
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

interface Expense {
  _id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPairDialogOpen, setAddPairDialogOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'Pigeon' as ProjectType,
    targetPairCount: 0,
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
  const [expenseFormData, setExpenseFormData] = useState({
    category: 'Feed',
    amount: 0,
    date: '',
    note: '',
  });

  useEffect(() => {
    fetchProjectData();
  }, [params.id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, pairsRes, expensesRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/pairs?projectId=${params.id}`),
        fetch(`/api/expenses?projectId=${params.id}`),
      ]);

      const projectData = await projectRes.json();
      const pairsData = await pairsRes.json();
      const expensesData = await expensesRes.json();

      setProject(projectData);
      setPairs(Array.isArray(pairsData) ? pairsData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setEditFormData({
        name: projectData.name,
        type: projectData.type,
        targetPairCount: projectData.targetPairCount,
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
    if (confirm('Are you sure you want to delete this project? This will also delete all associated pairs and expenses.')) {
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

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const averageCostPerPair = project?.pairCount ? totalExpenses / project.pairCount : 0;
  const progress = project ? (project.pairCount / project.targetPairCount) * 100 : 0;

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
            </div>
            <p className="text-gray-600">Type: {project.type}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
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
                      <Label>Target Pair Count</Label>
                      <Input
                        type="number"
                        value={editFormData.targetPairCount}
                        onChange={(e) => setEditFormData({ ...editFormData, targetPairCount: parseInt(e.target.value) })}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pairs</p>
                <p className="text-2xl font-bold">{project.pairCount || 0}</p>
                <p className="text-xs text-gray-500">Target: {project.targetPairCount}</p>
              </div>
              <Bird className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">${totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Avg ${averageCostPerPair.toFixed(2)}/pair</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="text-lg font-semibold">
                  {format(new Date(project.startDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
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
                    style={{ width: `${progress}%` }}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pairs">Pairs ({pairs.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          <TabsTrigger value="breeding">Breeding</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Key information about this project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Project Name:</p>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Project Type:</p>
                    <p className="font-medium">{project.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status:</p>
                    <p className="font-medium capitalize">{project.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Created:</p>
                    <p className="font-medium">{format(new Date(project.createdAt), 'PPP')}</p>
                  </div>
                </div>
              </div>
              
              {project.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pairs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Bird Pairs</CardTitle>
                  <CardDescription>
                    Manage all pairs in this project
                  </CardDescription>
                </div>
                <Dialog open={addPairDialogOpen} onOpenChange={setAddPairDialogOpen}>
                  <DialogTrigger>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Pair
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Pair</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new bird pair.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddPair}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Pair Number *</Label>
                          <Input
                            value={pairFormData.pairNumber}
                            onChange={(e) => setPairFormData({ ...pairFormData, pairNumber: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Species *</Label>
                          <Select
                            value={pairFormData.species}
                            onValueChange={(value: any) => setPairFormData({ ...pairFormData, species: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pigeon">Pigeon</SelectItem>
                              <SelectItem value="Chicken">Chicken</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Breed *</Label>
                          <Input
                            value={pairFormData.breed}
                            onChange={(e) => setPairFormData({ ...pairFormData, breed: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Male Name *</Label>
                          <Input
                            value={pairFormData.maleName}
                            onChange={(e) => setPairFormData({ ...pairFormData, maleName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Female Name *</Label>
                          <Input
                            value={pairFormData.femaleName}
                            onChange={(e) => setPairFormData({ ...pairFormData, femaleName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Purchase Date *</Label>
                          <Input
                            type="date"
                            value={pairFormData.purchaseDate}
                            onChange={(e) => setPairFormData({ ...pairFormData, purchaseDate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Purchase Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={pairFormData.purchasePrice}
                            onChange={(e) => setPairFormData({ ...pairFormData, purchasePrice: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddPairDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                          {submitting ? 'Adding...' : 'Add Pair'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {pairs.length === 0 ? (
                <div className="text-center py-8">
                  <Bird className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No pairs added yet</p>
                  <Button
                    variant="outline"
                    onClick={() => setAddPairDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Pair
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pair #</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pairs.map((pair) => (
                        <TableRow key={pair._id}>
                          <TableCell className="font-medium">{pair.pairNumber}</TableCell>
                          <TableCell>{pair.species}</TableCell>
                          <TableCell>{pair.breed}</TableCell>
                          <TableCell>{pair.maleName}</TableCell>
                          <TableCell>{pair.femaleName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {pair.status}
                            </Badge>
                          </TableCell>
                          <TableCell>${pair.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/pairs/${pair._id}`)}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePair(pair._id)}
                                className="text-red-600"
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

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>
                    Track all project expenses
                  </CardDescription>
                </div>
                <Dialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen}>
                  <DialogTrigger>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new expense.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddExpense}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Category *</Label>
                          <Select
                            value={expenseFormData.category}
                            onValueChange={(value: any) => setExpenseFormData({ ...expenseFormData, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Feed">Feed</SelectItem>
                              <SelectItem value="Medicine">Medicine</SelectItem>
                              <SelectItem value="Cage">Cage</SelectItem>
                              <SelectItem value="Transport">Transport</SelectItem>
                              <SelectItem value="Utility">Utility</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Amount ($) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={expenseFormData.amount}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={expenseFormData.date}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Note</Label>
                          <Textarea
                            value={expenseFormData.note}
                            onChange={(e) => setExpenseFormData({ ...expenseFormData, note: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddExpenseDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                          {submitting ? 'Adding...' : 'Add Expense'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No expenses recorded yet</p>
                  <Button
                    variant="outline"
                    onClick={() => setAddExpenseDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Expense
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>${expense.amount.toLocaleString()}</TableCell>
                          <TableCell>{expense.note || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="breeding">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Records</CardTitle>
              <CardDescription>
                Track breeding success and hatch rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Egg className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Breeding records will appear here</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add breeding records from individual pair pages
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>
                Images and photos from this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Gallery coming soon</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload and manage photos from pair pages
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}