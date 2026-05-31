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
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
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
  pairCount?: number;
  createdAt: string;
}

interface FormData {
  name: string;
  type: ProjectType;
  startDate: string;
  targetPairCount: number;
  status: ProjectStatus;
  notes: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'Pigeon',
    startDate: '',
    targetPairCount: 1,
    status: 'active',
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
      setError('Failed to load projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }
    if (formData.targetPairCount < 1) {
      toast.error('Target pair count must be at least 1');
      return;
    }
    
    startTransition(async () => {
      try {
        const url = editingProject ? `/api/projects/${editingProject._id}` : '/api/projects';
        const method = editingProject ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
      } catch (err) {
        console.error('Submit error:', err);
        toast.error('Failed to save project');
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? This will also delete all associated pairs and expenses.')) {
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
        } catch (err) {
          console.error('Delete error:', err);
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
      startDate: project.startDate.split('T')[0],
      targetPairCount: project.targetPairCount,
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
      startDate: '',
      targetPairCount: 1,
      status: 'active',
      notes: '',
    });
    setError(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            Manage all your farm projects and track their progress
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              <DialogDescription>
                {editingProject
                  ? 'Update the project details below.'
                  : 'Fill in the details to create a new farm project.'}
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
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
                    onValueChange={(value: ProjectType) => setFormData({ ...formData, type: value })}
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
                  <Label htmlFor="targetPairCount">Target Pair Count *</Label>
                  <Input
                    id="targetPairCount"
                    type="number"
                    min="1"
                    value={formData.targetPairCount}
                    onChange={(e) => setFormData({ ...formData, targetPairCount: parseInt(e.target.value) })}
                    required
                  />
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
          {projects.map((project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  <span className="font-semibold">Type:</span> {project.type}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">
                      {format(new Date(project.startDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target Pairs:</span>
                    <span className="font-medium">{project.targetPairCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Pairs:</span>
                    <span className="font-medium">{project.pairCount || 0}</span>
                  </div>
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
          ))}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}