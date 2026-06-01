'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Bird,
  Search,
  X,
  Heart,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

type SpeciesType = 'Pigeon' | 'Chicken';
type PairStatus = 'active' | 'breeding' | 'sold';

interface Pair {
  _id: string;
  pairNumber: string;
  projectId: {
    _id: string;
    name: string;
  };
  species: SpeciesType;
  breed: string;
  maleName: string;
  maleId?: string;
  femaleName: string;
  femaleId?: string;
  ringNumber?: string;
  color?: string;
  age?: string;
  purchaseDate: string;
  purchasePrice: number;
  notes?: string;
  images: string[];
  status: PairStatus;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  type: string;
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

export default function PairsPage() {
  const router = useRouter();
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<Pair | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pairNumber: '',
    projectId: '',
    species: 'Pigeon' as SpeciesType,
    breed: '',
    maleName: '',
    maleId: '',
    femaleName: '',
    femaleId: '',
    ringNumber: '',
    color: '',
    age: '',
    purchaseDate: '',
    purchasePrice: 0,
    notes: '',
    status: 'active' as PairStatus,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pairsRes, projectsRes] = await Promise.all([
        fetch('/api/pairs'),
        fetch('/api/projects'),
      ]);

      const pairsData = await pairsRes.json();
      const projectsData = await projectsRes.json();

      setPairs(Array.isArray(pairsData) ? pairsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load pairs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = editingPair ? `/api/pairs/${editingPair._id}` : '/api/pairs';
      const method = editingPair ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingPair ? 'Pair updated successfully' : 'Pair added successfully');
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save pair');
      }
    } catch (error) {
      console.error('Failed to save pair:', error);
      toast.error('Failed to save pair');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this pair? This will also delete all breeding records.')) {
      try {
        const response = await fetch(`/api/pairs/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Pair deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete pair');
        }
      } catch (error) {
        console.error('Failed to delete pair:', error);
        toast.error('Failed to delete pair');
      }
    }
  };

  const handleEdit = (pair: Pair) => {
    setEditingPair(pair);
    setFormData({
      pairNumber: pair.pairNumber,
      projectId: pair.projectId._id,
      species: pair.species,
      breed: pair.breed,
      maleName: pair.maleName,
      maleId: pair.maleId || '',
      femaleName: pair.femaleName,
      femaleId: pair.femaleId || '',
      ringNumber: pair.ringNumber || '',
      color: pair.color || '',
      age: pair.age || '',
      purchaseDate: formatDateForInput(pair.purchaseDate),
      purchasePrice: pair.purchasePrice,
      notes: pair.notes || '',
      status: pair.status,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPair(null);
    setFormData({
      pairNumber: '',
      projectId: '',
      species: 'Pigeon',
      breed: '',
      maleName: '',
      maleId: '',
      femaleName: '',
      femaleId: '',
      ringNumber: '',
      color: '',
      age: '',
      purchaseDate: '',
      purchasePrice: 0,
      notes: '',
      status: 'active',
    });
  };

  const getStatusBadge = (status: PairStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'breeding':
        return <Badge className="bg-blue-500">Breeding</Badge>;
      case 'sold':
        return <Badge variant="secondary">Sold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSpeciesIcon = (species: SpeciesType) => {
    return species === 'Pigeon' ? '🐦' : '🐔';
  };

  // Filter pairs
  const filteredPairs = pairs.filter(pair => {
    const matchesSearch = searchTerm === '' || 
      pair.pairNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.maleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.femaleName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || pair.species === selectedSpecies;
    const matchesStatus = selectedStatus === 'all' || pair.status === selectedStatus;
    const matchesProject = selectedProject === 'all' || pair.projectId._id === selectedProject;
    
    return matchesSearch && matchesSpecies && matchesStatus && matchesProject;
  });

  const stats = {
    total: pairs.length,
    active: pairs.filter(p => p.status === 'active').length,
    breeding: pairs.filter(p => p.status === 'breeding').length,
    sold: pairs.filter(p => p.status === 'sold').length,
    pigeons: pairs.filter(p => p.species === 'Pigeon').length,
    chickens: pairs.filter(p => p.species === 'Chicken').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pairs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bird Pairs</h1>
          <p className="text-gray-600 mt-2">
            Manage all your pigeon and chicken pairs
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Pair
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPair ? 'Edit Pair' : 'Add New Pair'}</DialogTitle>
              <DialogDescription>
                {editingPair ? 'Update the pair details below.' : 'Fill in the details to add a new bird pair.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Pair Number *</Label>
                  <Input
                    value={formData.pairNumber}
                    onChange={(e) => setFormData({ ...formData, pairNumber: e.target.value })}
                    placeholder="P-001"
                    required
                  />
                </div>

                <div>
                  <Label>Project *</Label>
                  <Select
                    value={formData.projectId}
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
                  <Label>Species *</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) => {
                      if (value === 'Pigeon' || value === 'Chicken') {
                        setFormData({ ...formData, species: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pigeon">🐦 Pigeon</SelectItem>
                      <SelectItem value="Chicken">🐔 Chicken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Breed *</Label>
                  <Input
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="Fancy Pigeon, Silkie, etc."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Male Name *</Label>
                    <Input
                      value={formData.maleName}
                      onChange={(e) => setFormData({ ...formData, maleName: e.target.value })}
                      placeholder="Male name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Male ID (Optional)</Label>
                    <Input
                      value={formData.maleId}
                      onChange={(e) => setFormData({ ...formData, maleId: e.target.value })}
                      placeholder="Ring/ID number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Female Name *</Label>
                    <Input
                      value={formData.femaleName}
                      onChange={(e) => setFormData({ ...formData, femaleName: e.target.value })}
                      placeholder="Female name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Female ID (Optional)</Label>
                    <Input
                      value={formData.femaleId}
                      onChange={(e) => setFormData({ ...formData, femaleId: e.target.value })}
                      placeholder="Ring/ID number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ring Number</Label>
                    <Input
                      value={formData.ringNumber}
                      onChange={(e) => setFormData({ ...formData, ringNumber: e.target.value })}
                      placeholder="Ring number"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="White, Black, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="2 years, 6 months"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => {
                        if (value === 'active' || value === 'breeding' || value === 'sold') {
                          setFormData({ ...formData, status: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="breeding">Breeding</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase Date *</Label>
                    <Input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Purchase Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this pair..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingPair ? 'Update Pair' : 'Add Pair')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bird className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Pairs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Heart className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.breeding}</p>
              <p className="text-xs text-gray-500">Breeding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <X className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.sold}</p>
              <p className="text-xs text-gray-500">Sold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-2xl">🐦</span>
              <p className="text-2xl font-bold">{stats.pigeons}</p>
              <p className="text-xs text-gray-500">Pigeons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <span className="text-2xl">🐔</span>
              <p className="text-2xl font-bold">{stats.chickens}</p>
              <p className="text-xs text-gray-500">Chickens</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={selectedSpecies} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedSpecies(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                <SelectItem value="Pigeon">Pigeons</SelectItem>
                <SelectItem value="Chicken">Chickens</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedStatus} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedStatus(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="breeding">Breeding</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            
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
          </div>
        </CardContent>
      </Card>

      {/* Pairs Table */}
      {filteredPairs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No pairs found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedSpecies !== 'all' || selectedStatus !== 'all' || selectedProject !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first bird pair to get started'}
            </p>
            {!searchTerm && selectedSpecies === 'all' && selectedStatus === 'all' && selectedProject === 'all' && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pair
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair #</TableHead>
                    <TableHead>Project</TableHead>
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
                  {filteredPairs.map((pair) => (
                    <TableRow key={pair._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {pair.pairNumber}
                      </TableCell>
                      <TableCell>{pair.projectId.name}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {getSpeciesIcon(pair.species)} {pair.species}
                        </span>
                      </TableCell>
                      <TableCell>{pair.breed}</TableCell>
                      <TableCell>{pair.maleName}</TableCell>
                      <TableCell>{pair.femaleName}</TableCell>
                      <TableCell>{getStatusBadge(pair.status)}</TableCell>
                      <TableCell>${pair.purchasePrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/pairs/${pair._id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pair)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pair._id)}
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
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      {filteredPairs.length > 0 && (
        <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${filteredPairs.reduce((sum, p) => sum + p.purchasePrice, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(filteredPairs.reduce((sum, p) => sum + p.purchasePrice, 0) / filteredPairs.length).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Breeds</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredPairs.map(p => p.breed)).size}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredPairs.map(p => p.projectId._id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}