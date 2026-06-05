'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
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
  totalIncome?: number;
  totalExpense?: number;
  profit?: number;
  createdAt: string;
}

// Safe date formatting helper
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString || typeof dateString !== 'string') {
    return '';
  }
  try {
    const parts = dateString.split('T');
    return parts[0] || '';
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Get income model display text and icon
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Pigeon' as ProjectType,
    incomeModel: 'pair_breeding' as IncomeModel,
    startDate: '',
    targetCount: 1,
    status: 'active' as ProjectStatus,
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (formData.targetCount < 1) {
      toast.error('Target count must be at least 1');
      return;
    }
    
    startTransition(async () => {
      try {
        const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects';
        const method = editingProject ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            incomeModel: formData.incomeModel,
            startDate: formData.startDate,
            targetCount: formData.targetCount,
            status: formData.status,
            notes: formData.notes,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success(editingProject ? 'Project updated successfully' : 'Project created successfully');
          setDialogOpen(false);
          resetForm();
          fetchProjects();
        } else {
          toast.error(result.error || 'Failed to save project');
        }
      } catch (error) {
        console.error('Submit error:', error);
        toast.error('Failed to save project');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated data.')) {
      startTransition(async () => {
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            toast.success('Project deleted successfully');
            fetchProjects();
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to delete project');
          }
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('Failed to delete project');
        }
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      type: project.type,
      incomeModel: project.incomeModel,
      startDate: formatDateForInput(project.startDate),
      targetCount: project.targetCount,
      status: project.status,
      notes: project.notes || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      type: 'Pigeon',
      incomeModel: 'pair_breeding',
      startDate: '',
      targetCount: 1,
      status: 'active',
      notes: '',
    });
  };

  const getStatusBadgeVariant = (status: ProjectStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getTargetLabel = (incomeModel: IncomeModel) => {
    switch (incomeModel) {
      case 'pair_breeding':
        return 'Target Pairs';
      case 'egg_production':
        return 'Target Eggs/Day';
      case 'growing':
        return 'Target Birds';
      case 'mixed':
        return 'Target Count';
      default:
        return 'Target Count';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage all your farm projects and track their progress
          </p>
        </div>
        
        {/* Fixed DialogTrigger - No nested buttons */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span>
              <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              <DialogDescription>
                {editingProject
                  ? 'Update the project details below.'
                  : 'Fill in the details to create a new farm project.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Project Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ProjectType) => {
                      setFormData({ ...formData, type: value });
                      if (value === 'Pigeon') {
                        setFormData(prev => ({ ...prev, incomeModel: 'pair_breeding' }));
                      } else if (value === 'Chicken') {
                        setFormData(prev => ({ ...prev, incomeModel: 'egg_production' }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pigeon">🐦 Pigeon Project</SelectItem>
                      <SelectItem value="Chicken">🐔 Chicken Project</SelectItem>
                      <SelectItem value="Mixed">🦜 Mixed Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="incomeModel">Income Model *</Label>
                  <Select
                    value={formData.incomeModel}
                    onValueChange={(value: IncomeModel) => setFormData({ ...formData, incomeModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pair_breeding">🐦 Pair Breeding - Sell grown pigeons</SelectItem>
                      <SelectItem value="egg_production">🥚 Egg Production - Sell eggs</SelectItem>
                      <SelectItem value="growing">📈 Growing - Grow and sell chickens</SelectItem>
                      <SelectItem value="mixed">🔄 Mixed Model - Multiple sources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="targetCount">{getTargetLabel(formData.incomeModel)} *</Label>
                  <Input
                    id="targetCount"
                    type="number"
                    min="1"
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.incomeModel === 'pair_breeding' && 'Number of breeding pairs'}
                    {formData.incomeModel === 'egg_production' && 'Target eggs to produce per day'}
                    {formData.incomeModel === 'growing' && 'Number of birds to raise'}
                    {formData.incomeModel === 'mixed' && 'Target count for the project'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">🟢 Active</SelectItem>
                      <SelectItem value="completed">🔵 Completed</SelectItem>
                      <SelectItem value="archived">⚪ Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the project"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {isPending ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-600 mb-4">No projects yet. Create your first project to get started!</p>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const incomeInfo = getIncomeModelInfo(project.incomeModel);
            return (
              <Card key={project._id} className="hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 line-clamp-1">{project.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <span>{incomeInfo.icon}</span> {incomeInfo.text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    <span className="font-semibold">Type:</span> {project.type}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {format(new Date(project.startDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{getTargetLabel(project.incomeModel)}:</span>
                      <span className="font-medium">{project.targetCount}</span>
                    </div>
                    {project.pairCount !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Pairs:</span>
                        <span className="font-medium">{project.pairCount}</span>
                      </div>
                    )}
                    {project.profit !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profit:</span>
                        <span className={`font-medium ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${project.profit.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {project.notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-600 line-clamp-2">{project.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Link href={`/projects/${project._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(project)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(project._id)}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats Summary */}
      {projects.length > 0 && (
        <Card className="mt-8 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Project Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-600">
                  {projects.filter(p => p.status === 'archived').length}
                </p>
              </div>
            </div>
            
            {/* Income Model Breakdown */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-3">Income Models</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['pair_breeding', 'egg_production', 'growing', 'mixed'] as IncomeModel[]).map(model => {
                  const count = projects.filter(p => p.incomeModel === model).length;
                  if (count === 0) return null;
                  const info = getIncomeModelInfo(model);
                  return (
                    <div key={model} className="text-center p-2 bg-white/50 rounded-lg">
                      <p className="text-lg">{info.icon}</p>
                      <p className="text-xs text-gray-600">{info.text}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-gray-700 mb-3">Financial Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Investment</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${projects.reduce((sum, p) => sum + (p.totalExpense || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ${projects.reduce((sum, p) => sum + (p.totalIncome || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className={`text-xl font-bold ${projects.reduce((sum, p) => sum + (p.profit || 0), 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${projects.reduce((sum, p) => sum + (p.profit || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}