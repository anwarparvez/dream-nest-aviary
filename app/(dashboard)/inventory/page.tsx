'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Bird,
  Egg,
  Package,
  TrendingUp,
  Search,
  Filter,
  Loader2,
  Eye,
  DollarSign,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Bird {
  _id: string;
  birdNumber: string;
  projectId: {
    _id: string;
    name: string;
    incomeModel: string;
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
  status: 'active' | 'sold';
  notes?: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Pair {
  _id: string;
  pairNumber: string;
  projectId: {
    _id: string;
    name: string;
    incomeModel: string;
  };
  species: 'Pigeon' | 'Chicken';
  breed: string;
  maleName: string;
  femaleName: string;
  status: string;
  purchasePrice: number;
  purchaseDate: string;
  images: string[];
  notes?: string;
}

interface EggBatch {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  batchNumber: string;
  quantity: number;
  eggDate: string;
  hatchDate?: string;
  chickCount?: number;
  status: 'incubating' | 'hatched' | 'sold';
  notes?: string;
}

interface Project {
  _id: string;
  name: string;
  type: string;
  incomeModel: string;
  status: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [birds, setBirds] = useState<Bird[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [eggBatches, setEggBatches] = useState<EggBatch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('birds');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Dialog states
  const [sellBirdDialogOpen, setSellBirdDialogOpen] = useState(false);
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [sellFormData, setSellFormData] = useState({
    sellDate: '',
    sellPrice: 0,
    notes: '',
  });
  
  const [addEggBatchDialogOpen, setAddEggBatchDialogOpen] = useState(false);
  const [eggBatchFormData, setEggBatchFormData] = useState({
    projectId: '',
    batchNumber: '',
    quantity: 1,
    eggDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [birdsRes, pairsRes, projectsRes] = await Promise.all([
        fetch('/api/birds'),
        fetch('/api/pairs'),
        fetch('/api/projects'),
      ]);

      const birdsData = await birdsRes.json();
      const pairsData = await pairsRes.json();
      const projectsData = await projectsRes.json();

      setBirds(Array.isArray(birdsData) ? birdsData : []);
      setPairs(Array.isArray(pairsData) ? pairsData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSellBird = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBird) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/birds/${selectedBird._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sold',
          sellDate: sellFormData.sellDate,
          sellPrice: sellFormData.sellPrice,
          notes: sellFormData.notes || selectedBird.notes,
        }),
      });

      if (response.ok) {
        toast.success('Bird marked as sold');
        setSellBirdDialogOpen(false);
        setSelectedBird(null);
        setSellFormData({ sellDate: '', sellPrice: 0, notes: '' });
        fetchInventoryData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to sell bird');
      }
    } catch (error) {
      console.error('Failed to sell bird:', error);
      toast.error('Failed to sell bird');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEggBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eggBatchFormData),
      });

      if (response.ok) {
        toast.success('Egg batch added successfully');
        setAddEggBatchDialogOpen(false);
        setEggBatchFormData({
          projectId: '',
          batchNumber: '',
          quantity: 1,
          eggDate: '',
          notes: '',
        });
        fetchInventoryData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add egg batch');
      }
    } catch (error) {
      console.error('Failed to add egg batch:', error);
      toast.error('Failed to add egg batch');
    } finally {
      setLoading(false);
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
          fetchInventoryData();
        } else {
          toast.error('Failed to delete bird');
        }
      } catch (error) {
        console.error('Failed to delete bird:', error);
        toast.error('Failed to delete bird');
      }
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
          fetchInventoryData();
        } else {
          toast.error('Failed to delete pair');
        }
      } catch (error) {
        console.error('Failed to delete pair:', error);
        toast.error('Failed to delete pair');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'sold':
        return <Badge variant="secondary">Sold</Badge>;
      case 'breeding':
        return <Badge className="bg-blue-500">Breeding</Badge>;
      case 'incubating':
        return <Badge className="bg-yellow-500">Incubating</Badge>;
      case 'hatched':
        return <Badge className="bg-purple-500">Hatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBirds = birds.filter(bird => {
    const matchesSearch = searchTerm === '' || 
      bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.birdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bird.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || bird.species === selectedSpecies;
    const matchesStatus = selectedStatus === 'all' || bird.status === selectedStatus;
    const matchesProject = selectedProject === 'all' || bird.projectId._id === selectedProject;
    
    return matchesSearch && matchesSpecies && matchesStatus && matchesProject;
  });

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

  const totalInventoryValue = birds.reduce((sum, bird) => sum + bird.purchasePrice, 0) +
                              pairs.reduce((sum, pair) => sum + pair.purchasePrice, 0);
  
  const activeBirds = birds.filter(b => b.status === 'active').length;
  const soldBirds = birds.filter(b => b.status === 'sold').length;
  const activePairs = pairs.filter(p => p.status === 'active').length;
  const breedingPairs = pairs.filter(p => p.status === 'breeding').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Track all birds, pairs, and egg batches across your farm
          </p>
        </div>
        
        {activeTab === 'eggs' && (
          <Dialog open={addEggBatchDialogOpen} onOpenChange={setAddEggBatchDialogOpen}>
            <DialogTrigger asChild>
              <span>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Egg Batch
                </Button>
              </span>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Egg Batch</DialogTitle>
                <DialogDescription>
                  Record a new batch of eggs for incubation or sale
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEggBatch}>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Project *</Label>
                    <Select
                      value={eggBatchFormData.projectId}
                      onValueChange={(value) => setEggBatchFormData({ ...eggBatchFormData, projectId: value })}
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
                    <Label>Batch Number *</Label>
                    <Input
                      value={eggBatchFormData.batchNumber}
                      onChange={(e) => setEggBatchFormData({ ...eggBatchFormData, batchNumber: e.target.value })}
                      placeholder="B-001"
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={eggBatchFormData.quantity}
                      onChange={(e) => setEggBatchFormData({ ...eggBatchFormData, quantity: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Egg Date *</Label>
                    <Input
                      type="date"
                      value={eggBatchFormData.eggDate}
                      onChange={(e) => setEggBatchFormData({ ...eggBatchFormData, eggDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={eggBatchFormData.notes}
                      onChange={(e) => setEggBatchFormData({ ...eggBatchFormData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddEggBatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                    Add Batch
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bird className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{birds.length}</p>
              <p className="text-xs text-gray-500">Total Birds</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Bird className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{activeBirds}</p>
              <p className="text-xs text-gray-500">Active Birds</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pairs.length}</p>
              <p className="text-xs text-gray-500">Total Pairs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{breedingPairs}</p>
              <p className="text-xs text-gray-500">Breeding Pairs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Value</p>
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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
              <SelectTrigger>
                <SelectValue placeholder="Species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Species</SelectItem>
                <SelectItem value="Pigeon">Pigeons</SelectItem>
                <SelectItem value="Chicken">Chickens</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="breeding">Breeding</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="birds" className="flex items-center gap-2">
            <Bird className="h-4 w-4" />
            Birds ({birds.length})
          </TabsTrigger>
          <TabsTrigger value="pairs" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pairs ({pairs.length})
          </TabsTrigger>
          <TabsTrigger value="eggs" className="flex items-center gap-2">
            <Egg className="h-4 w-4" />
            Egg Batches
          </TabsTrigger>
        </TabsList>

        {/* Birds Tab */}
        <TabsContent value="birds">
          <Card>
            <CardContent className="p-0">
              {filteredBirds.length === 0 ? (
                <div className="text-center py-12">
                  <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No birds found</p>
                  <p className="text-gray-400 mt-2">
                    {searchTerm || selectedSpecies !== 'all' || selectedStatus !== 'all' || selectedProject !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add birds to your inventory to get started'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bird #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Species</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Sell Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBirds.map((bird) => (
                        <TableRow key={bird._id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{bird.birdNumber}</TableCell>
                          <TableCell>{bird.name}</TableCell>
                          <TableCell>{bird.projectId.name}</TableCell>
                          <TableCell>{bird.species}</TableCell>
                          <TableCell>{bird.breed}</TableCell>
                          <TableCell>{bird.age || '-'}</TableCell>
                          <TableCell>{bird.color || '-'}</TableCell>
                          <TableCell>{getStatusBadge(bird.status)}</TableCell>
                          <TableCell>${bird.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell>
                            {bird.sellPrice ? `$${bird.sellPrice.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {bird.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBird(bird);
                                    setSellBirdDialogOpen(true);
                                  }}
                                  className="text-blue-600"
                                >
                                  Sell
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBird(bird._id)}
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

        {/* Pairs Tab */}
        <TabsContent value="pairs">
          <Card>
            <CardContent className="p-0">
              {filteredPairs.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No pairs found</p>
                  <p className="text-gray-400 mt-2">
                    {searchTerm || selectedSpecies !== 'all' || selectedStatus !== 'all' || selectedProject !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add breeding pairs to get started'}
                  </p>
                </div>
              ) : (
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
                          <TableCell className="font-medium">{pair.pairNumber}</TableCell>
                          <TableCell>{pair.projectId.name}</TableCell>
                          <TableCell>{pair.species}</TableCell>
                          <TableCell>{pair.breed}</TableCell>
                          <TableCell>{pair.maleName}</TableCell>
                          <TableCell>{pair.femaleName}</TableCell>
                          <TableCell>{getStatusBadge(pair.status)}</TableCell>
                          <TableCell>${pair.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/pairs/${pair._id}`)}
                              >
                                <Eye className="h-4 w-4" />
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

        {/* Eggs Tab */}
        <TabsContent value="eggs">
          <Card>
            <CardContent className="p-0">
              <div className="text-center py-12">
                <Egg className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Egg tracking coming soon</p>
                <p className="text-gray-400 mt-2">
                  Track egg batches, incubation, and sales
                </p>
                <Button
                  onClick={() => setAddEggBatchDialogOpen(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Egg Batch
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sell Bird Dialog */}
      <Dialog open={sellBirdDialogOpen} onOpenChange={setSellBirdDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Bird</DialogTitle>
            <DialogDescription>
              Record the sale of {selectedBird?.name} ({selectedBird?.birdNumber})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSellBird}>
            <div className="space-y-4 py-4">
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
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={sellFormData.notes}
                  onChange={(e) => setSellFormData({ ...sellFormData, notes: e.target.value })}
                  rows={3}
                  placeholder="Buyer information, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSellBirdDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Record Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}