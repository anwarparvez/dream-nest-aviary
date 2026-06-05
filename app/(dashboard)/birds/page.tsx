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
  Checkbox,
} from '@/components/ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Bird,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  Loader2,
  Upload,
  AlertCircle,
  Skull,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

type BirdStatus = 'active' | 'sold' | 'deceased';

interface Bird {
  _id: string;
  birdNumber: string;
  projectId: {
    _id: string;
    name: string;
    type: string;
  };
  species: 'Pigeon' | 'Chicken';
  breed: string;
  name: string;
  age?: string;
  color?: string;
  purchaseDate: string;
  purchasePrice: number;
  sellDate?: string;
  sellPrice?: number;
  deathDate?: string;
  deathReason?: string;
  status: BirdStatus;
  notes?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  type: string;
  incomeModel: string;
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

export default function BirdsPage() {
  const router = useRouter();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedBirds, setSelectedBirds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [deathDialogOpen, setDeathDialogOpen] = useState(false);
  const [bulkDeathDialogOpen, setBulkDeathDialogOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [selectedBirdForSale, setSelectedBirdForSale] = useState<Bird | null>(null);
  const [selectedBirdForDeath, setSelectedBirdForDeath] = useState<Bird | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [selectMode, setSelectMode] = useState(false);
  const [formData, setFormData] = useState({
    birdNumber: '',
    projectId: '',
    species: 'Pigeon' as const,
    breed: '',
    name: '',
    age: '',
    color: '',
    purchaseDate: '',
    purchasePrice: 0,
    status: 'active' as BirdStatus,
    notes: '',
  });
  const [bulkFormData, setBulkFormData] = useState({
    projectId: '',
    species: 'Pigeon' as const,
    breed: '',
    age: '',
    color: '',
    purchaseDate: '',
    purchasePrice: 0,
    quantity: 1,
    startNumber: 1,
    notes: '',
  });
  const [sellFormData, setSellFormData] = useState({
    sellDate: '',
    sellPrice: 0,
  });
  const [deathFormData, setDeathFormData] = useState({
    deathDate: '',
    deathReason: '',
    notes: '',
  });
  const [bulkDeathFormData, setBulkDeathFormData] = useState({
    deathDate: '',
    deathReason: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [birdsRes, projectsRes] = await Promise.all([
        fetch('/api/birds'),
        fetch('/api/projects'),
      ]);

      const birdsData = await birdsRes.json();
      const projectsData = await projectsRes.json();

      setBirds(Array.isArray(birdsData) ? birdsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load birds');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = editingBird ? `/api/birds/${editingBird._id}` : '/api/birds';
      const method = editingBird ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingBird ? 'Bird updated successfully' : 'Bird added successfully');
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save bird');
      }
    } catch (error) {
      console.error('Failed to save bird:', error);
      toast.error('Failed to save bird');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFormData.projectId) {
      toast.error('Please select a project');
      return;
    }
    if (bulkFormData.quantity < 1 || bulkFormData.quantity > 500) {
      toast.error('Quantity must be between 1 and 500');
      return;
    }

    setBulkSubmitting(true);
    setBulkProgress(0);

    try {
      const birdsToAdd = [];
      const endNumber = bulkFormData.startNumber + bulkFormData.quantity - 1;
      
      for (let i = bulkFormData.startNumber; i <= endNumber; i++) {
        const paddedNumber = i.toString().padStart(3, '0');
        birdsToAdd.push({
          birdNumber: `${bulkFormData.species === 'Pigeon' ? 'P' : 'C'}-${paddedNumber}`,
          projectId: bulkFormData.projectId,
          species: bulkFormData.species,
          breed: bulkFormData.breed,
          name: `${bulkFormData.breed} ${i}`,
          age: bulkFormData.age,
          color: bulkFormData.color,
          purchaseDate: bulkFormData.purchaseDate,
          purchasePrice: bulkFormData.purchasePrice,
          status: 'active',
          notes: bulkFormData.notes,
        });
      }

      let successCount = 0;
      let failCount = 0;

      const batchSize = 10;
      for (let i = 0; i < birdsToAdd.length; i += batchSize) {
        const batch = birdsToAdd.slice(i, i + batchSize);
        const promises = batch.map(bird =>
          fetch('/api/birds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bird),
          }).then(async res => {
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          })
        );
        
        await Promise.all(promises);
        setBulkProgress(Math.round(((i + batch.length) / birdsToAdd.length) * 100));
      }

      toast.success(`Added ${successCount} birds successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
      
      if (successCount > 0) {
        setBulkDialogOpen(false);
        resetBulkForm();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add birds in bulk:', error);
      toast.error('Failed to add birds in bulk');
    } finally {
      setBulkSubmitting(false);
      setBulkProgress(0);
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBirdForSale) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/birds/${selectedBirdForSale._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sold',
          sellDate: sellFormData.sellDate,
          sellPrice: sellFormData.sellPrice,
        }),
      });

      if (response.ok) {
        toast.success('Bird marked as sold');
        setSellDialogOpen(false);
        setSelectedBirdForSale(null);
        setSellFormData({ sellDate: '', sellPrice: 0 });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark as sold');
      }
    } catch (error) {
      console.error('Failed to sell bird:', error);
      toast.error('Failed to mark as sold');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsDeceased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBirdForDeath) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/birds/${selectedBirdForDeath._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'deceased',
          deathDate: deathFormData.deathDate,
          deathReason: deathFormData.deathReason,
          notes: deathFormData.notes,
        }),
      });

      if (response.ok) {
        toast.warning('Bird marked as deceased', {
          description: `${selectedBirdForDeath.name} (${selectedBirdForDeath.birdNumber}) has been recorded as deceased.`,
        });
        setDeathDialogOpen(false);
        setSelectedBirdForDeath(null);
        setDeathFormData({ deathDate: '', deathReason: '', notes: '' });
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark as deceased');
      }
    } catch (error) {
      console.error('Failed to mark bird as deceased:', error);
      toast.error('Failed to mark as deceased');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkMarkAsDeceased = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBirds.length === 0) {
      toast.error('No birds selected');
      return;
    }

    setBulkSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const birdId of selectedBirds) {
        const response = await fetch(`/api/birds/${birdId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'deceased',
            deathDate: bulkDeathFormData.deathDate,
            deathReason: bulkDeathFormData.deathReason,
            notes: bulkDeathFormData.notes,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.warning(`${successCount} bird(s) marked as deceased`, {
          description: failCount > 0 ? `${failCount} failed to update` : undefined,
        });
        setBulkDeathDialogOpen(false);
        setSelectedBirds([]);
        setSelectMode(false);
        setBulkDeathFormData({ deathDate: '', deathReason: '', notes: '' });
        fetchData();
      } else {
        toast.error('Failed to mark birds as deceased');
      }
    } catch (error) {
      console.error('Failed to mark birds as deceased:', error);
      toast.error('Failed to mark birds as deceased');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bird?')) {
      try {
        const response = await fetch(`/api/birds/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Bird deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete bird');
        }
      } catch (error) {
        console.error('Failed to delete bird:', error);
        toast.error('Failed to delete bird');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBirds.length === 0) {
      toast.error('No birds selected');
      return;
    }

    if (confirm(`Are you sure you want to delete ${selectedBirds.length} bird(s)? This action cannot be undone.`)) {
      let successCount = 0;
      let failCount = 0;

      for (const birdId of selectedBirds) {
        try {
          const response = await fetch(`/api/birds/${birdId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} bird(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
        setSelectedBirds([]);
        setSelectMode(false);
        fetchData();
      } else {
        toast.error('Failed to delete birds');
      }
    }
  };

  const handleEdit = (bird: Bird) => {
    setEditingBird(bird);
    setFormData({
      birdNumber: bird.birdNumber,
      projectId: bird.projectId._id,
      species: bird.species,
      breed: bird.breed,
      name: bird.name,
      age: bird.age || '',
      color: bird.color || '',
      purchaseDate: formatDateForInput(bird.purchaseDate),
      purchasePrice: bird.purchasePrice,
      status: bird.status,
      notes: bird.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSellBird = (bird: Bird) => {
    setSelectedBirdForSale(bird);
    setSellFormData({
      sellDate: formatDateForInput(new Date().toISOString()),
      sellPrice: bird.purchasePrice * 1.5,
    });
    setSellDialogOpen(true);
  };

  const handleMarkDeceased = (bird: Bird) => {
    setSelectedBirdForDeath(bird);
    setDeathFormData({
      deathDate: formatDateForInput(new Date().toISOString()),
      deathReason: '',
      notes: '',
    });
    setDeathDialogOpen(true);
  };

  const toggleBirdSelection = (birdId: string) => {
    setSelectedBirds(prev =>
      prev.includes(birdId)
        ? prev.filter(id => id !== birdId)
        : [...prev, birdId]
    );
  };

  const toggleAllBirds = () => {
    if (selectedBirds.length === filteredBirds.length) {
      setSelectedBirds([]);
    } else {
      setSelectedBirds(filteredBirds.map(bird => bird._id));
    }
  };

  const resetForm = () => {
    setEditingBird(null);
    setFormData({
      birdNumber: '',
      projectId: '',
      species: 'Pigeon',
      breed: '',
      name: '',
      age: '',
      color: '',
      purchaseDate: '',
      purchasePrice: 0,
      status: 'active',
      notes: '',
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      projectId: '',
      species: 'Pigeon',
      breed: '',
      age: '',
      color: '',
      purchaseDate: '',
      purchasePrice: 0,
      quantity: 1,
      startNumber: 1,
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'sold':
        return <Badge className="bg-blue-500">Sold</Badge>;
      case 'deceased':
        return <Badge className="bg-gray-500">Deceased</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSpeciesIcon = (species: string) => {
    return species === 'Pigeon' ? '🐦' : '🐔';
  };

  // Filter birds
  const filteredBirds = birds.filter(bird => {
    const matchesSearch = searchTerm === '' || 
      bird.birdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || bird.species === selectedSpecies;
    const matchesStatus = selectedStatus === 'all' || bird.status === selectedStatus;
    const matchesProject = selectedProject === 'all' || bird.projectId._id === selectedProject;
    
    return matchesSearch && matchesSpecies && matchesStatus && matchesProject;
  });

  const stats = {
    total: birds.length,
    active: birds.filter(b => b.status === 'active').length,
    sold: birds.filter(b => b.status === 'sold').length,
    deceased: birds.filter(b => b.status === 'deceased').length,
    pigeons: birds.filter(b => b.species === 'Pigeon').length,
    chickens: birds.filter(b => b.species === 'Chicken').length,
    totalValue: birds.reduce((sum, b) => sum + b.purchasePrice, 0),
    totalProfit: birds.filter(b => b.sellPrice).reduce((sum, b) => sum + (b.sellPrice || 0) - b.purchasePrice, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading birds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Birds Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all individual birds (for growing projects)
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectMode && (
            <>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedBirds.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedBirds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setBulkDeathDialogOpen(true)}
                disabled={selectedBirds.length === 0}
                className="border-gray-500 text-gray-700 hover:bg-gray-100"
              >
                <Skull className="mr-2 h-4 w-4" />
                Mark as Deceased ({selectedBirds.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectMode(false)}
              >
                Cancel
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            onClick={() => setSelectMode(!selectMode)}
            className={selectMode ? 'bg-emerald-50 border-emerald-500' : ''}
          >
            <Checkbox className="mr-2 h-4 w-4" checked={selectMode} />
            Select Mode
          </Button>

          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <span>
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Bulk Import Birds</DialogTitle>
                <DialogDescription>
                  Add multiple birds at once. Perfect for adding a whole batch.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit}>
                <div className="space-y-4 py-4">
                  {/* Bulk form fields */}
                  <div>
                    <Label>Project *</Label>
                    <Select
                      value={bulkFormData.projectId}
                      onValueChange={(value) => {
                        if (value) setBulkFormData({ ...bulkFormData, projectId: value });
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
                      value={bulkFormData.species}
                      onValueChange={(value: any) => setBulkFormData({ ...bulkFormData, species: value })}
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
                      value={bulkFormData.breed}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, breed: e.target.value })}
                      placeholder="Fancy Pigeon, Silkie, etc."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input
                        value={bulkFormData.age}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, age: e.target.value })}
                        placeholder="6 months"
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        value={bulkFormData.color}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, color: e.target.value })}
                        placeholder="White, Black, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Purchase Date *</Label>
                    <Input
                      type="date"
                      value={bulkFormData.purchaseDate}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Purchase Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bulkFormData.purchasePrice}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, purchasePrice: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity (1-500) *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="500"
                        value={bulkFormData.quantity}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, quantity: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Start Number *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={bulkFormData.startNumber}
                        onChange={(e) => setBulkFormData({ ...bulkFormData, startNumber: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-semibold">Preview:</p>
                        <p>Will create birds with numbers:</p>
                        <p className="font-mono text-xs mt-1">
                          {bulkFormData.species === 'Pigeon' ? 'P' : 'C'}-{bulkFormData.startNumber.toString().padStart(3, '0')} 
                          {' → '}
                          {bulkFormData.species === 'Pigeon' ? 'P' : 'C'}-{(bulkFormData.startNumber + bulkFormData.quantity - 1).toString().padStart(3, '0')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {bulkSubmitting && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span>{bulkProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${bulkProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={bulkFormData.notes}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, notes: e.target.value })}
                      placeholder="Batch notes..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={bulkSubmitting}>
                    {bulkSubmitting ? `Adding ${bulkFormData.quantity} birds...` : `Add ${bulkFormData.quantity} Birds`}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <span>
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bird
                </Button>
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              {/* Single bird form - same as before */}
              <DialogHeader>
                <DialogTitle>{editingBird ? 'Edit Bird' : 'Add New Bird'}</DialogTitle>
                <DialogDescription>
                  {editingBird ? 'Update the bird details below.' : 'Fill in the details to add a new bird.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Bird Number *</Label>
                    <Input
                      value={formData.birdNumber}
                      onChange={(e) => setFormData({ ...formData, birdNumber: e.target.value })}
                      placeholder="B-001"
                      required
                    />
                  </div>

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
                    <Label>Species *</Label>
                    <Select
                      value={formData.species}
                      onValueChange={(value: any) => setFormData({ ...formData, species: value })}
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

                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Bird name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Age</Label>
                      <Input
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="6 months"
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
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="deceased">Deceased</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes about this bird..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingBird ? 'Update Bird' : 'Add Bird')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bird className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Birds</p>
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
              <ShoppingCart className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.sold}</p>
              <p className="text-xs text-gray-500">Sold</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Skull className="h-6 w-6 text-gray-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.deceased}</p>
              <p className="text-xs text-gray-500">Deceased</p>
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
              <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">${stats.totalProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Profit</p>
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
                placeholder="Search birds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={selectedSpecies} 
              onValueChange={(value) => {
                if (value) setSelectedSpecies(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                <SelectItem value="Pigeon">🐦 Pigeons</SelectItem>
                <SelectItem value="Chicken">🐔 Chickens</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedStatus} 
              onValueChange={(value) => {
                if (value) setSelectedStatus(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedProject} 
              onValueChange={(value) => {
                if (value) setSelectedProject(value);
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

      {/* Birds Table */}
      {filteredBirds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No birds found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedSpecies !== 'all' || selectedStatus !== 'all' || selectedProject !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first bird to get started'}
            </p>
            {!searchTerm && selectedSpecies === 'all' && selectedStatus === 'all' && selectedProject === 'all' && (
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Single Bird
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBulkDialogOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
              </div>
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
                    {selectMode && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedBirds.length === filteredBirds.length && filteredBirds.length > 0}
                          onCheckedChange={toggleAllBirds}
                        />
                      </TableHead>
                    )}
                    <TableHead>Bird #</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sell Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBirds.map((bird) => {
                    const profit = bird.sellPrice ? bird.sellPrice - bird.purchasePrice : 0;
                    return (
                      <TableRow key={bird._id} className="hover:bg-gray-50">
                        {selectMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedBirds.includes(bird._id)}
                              onCheckedChange={() => toggleBirdSelection(bird._id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{bird.birdNumber}</TableCell>
                        <TableCell>{bird.projectId.name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {getSpeciesIcon(bird.species)} {bird.species}
                          </span>
                        </TableCell>
                        <TableCell>{bird.name}</TableCell>
                        <TableCell>{bird.breed}</TableCell>
                        <TableCell>{bird.age || '-'}</TableCell>
                        <TableCell>{getStatusBadge(bird.status)}</TableCell>
                        <TableCell>${bird.purchasePrice.toLocaleString()}</TableCell>
                        <TableCell>
                          {bird.sellPrice ? `$${bird.sellPrice.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className={profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''}>
                          {bird.sellPrice ? `$${profit.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {bird.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSellBird(bird)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Sell
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkDeceased(bird)}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  <Skull className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(bird)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(bird._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sell Dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Bird as Sold</DialogTitle>
            <DialogDescription>
              Enter the sale details for {selectedBirdForSale?.name} ({selectedBirdForSale?.birdNumber})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSell}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Purchase Price</Label>
                <Input value={`$${selectedBirdForSale?.purchasePrice.toLocaleString()}`} disabled />
              </div>
              <div>
                <Label>Sell Date *</Label>
                <Input
                  type="date"
                  value={sellFormData.sellDate}
                  onChange={(e) => setSellFormData({ ...sellFormData, sellDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Sell Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={sellFormData.sellPrice}
                  onChange={(e) => setSellFormData({ ...sellFormData, sellPrice: parseFloat(e.target.value) })}
                  required
                />
              </div>
              {selectedBirdForSale && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Expected Profit</p>
                  <p className={`text-lg font-bold ${sellFormData.sellPrice - selectedBirdForSale.purchasePrice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${(sellFormData.sellPrice - selectedBirdForSale.purchasePrice).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSellDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting ? 'Processing...' : 'Mark as Sold'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Death Dialog */}
      <Dialog open={deathDialogOpen} onOpenChange={setDeathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Bird Death</DialogTitle>
            <DialogDescription>
              Record the death details for {selectedBirdForDeath?.name} ({selectedBirdForDeath?.birdNumber})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkAsDeceased}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Date of Death *</Label>
                <Input
                  type="date"
                  value={deathFormData.deathDate}
                  onChange={(e) => setDeathFormData({ ...deathFormData, deathDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cause of Death (Optional)</Label>
                <Input
                  value={deathFormData.deathReason}
                  onChange={(e) => setDeathFormData({ ...deathFormData, deathReason: e.target.value })}
                  placeholder="Illness, accident, old age, etc."
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={deathFormData.notes}
                  onChange={(e) => setDeathFormData({ ...deathFormData, notes: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-semibold">Note:</p>
                    <p>This action will mark the bird as deceased. This cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeathDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? 'Processing...' : 'Mark as Deceased'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Death Dialog */}
      <Dialog open={bulkDeathDialogOpen} onOpenChange={setBulkDeathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Mark as Deceased</DialogTitle>
            <DialogDescription>
              Mark {selectedBirds.length} bird(s) as deceased
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkMarkAsDeceased}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Date of Death *</Label>
                <Input
                  type="date"
                  value={bulkDeathFormData.deathDate}
                  onChange={(e) => setBulkDeathFormData({ ...bulkDeathFormData, deathDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cause of Death (Optional)</Label>
                <Input
                  value={bulkDeathFormData.deathReason}
                  onChange={(e) => setBulkDeathFormData({ ...bulkDeathFormData, deathReason: e.target.value })}
                  placeholder="Illness, accident, old age, etc."
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={bulkDeathFormData.notes}
                  onChange={(e) => setBulkDeathFormData({ ...bulkDeathFormData, notes: e.target.value })}
                  placeholder="Additional details about this incident..."
                  rows={3}
                />
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-semibold">Warning:</p>
                    <p>This will mark {selectedBirds.length} bird(s) as deceased. This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              {bulkSubmitting && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing {selectedBirds.length} bird(s)...</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBulkDeathDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Processing...' : `Mark ${selectedBirds.length} Bird(s) as Deceased`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}