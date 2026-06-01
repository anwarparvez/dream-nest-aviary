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
  Egg,
  Baby,
  Camera,
  FileText,
  Activity,
  Loader2,
} from 'lucide-react';
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
    type: string;
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
  breedingStats?: {
    totalBreedings: number;
    totalEggs: number;
    totalChicks: number;
    hatchRate: string;
  };
  breedingRecords?: BreedingRecord[];
}

interface BreedingRecord {
  _id: string;
  eggDate: string;
  eggCount: number;
  hatchDate?: string;
  chickCount?: number;
  chickStatus?: string;
  notes?: string;
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

export default function PairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pair, setPair] = useState<Pair | null>(null);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addBreedingDialogOpen, setAddBreedingDialogOpen] = useState(false);
  const [editBreedingDialogOpen, setEditBreedingDialogOpen] = useState(false);
  const [editingBreedingRecord, setEditingBreedingRecord] = useState<BreedingRecord | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
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
  const [breedingFormData, setBreedingFormData] = useState({
    eggDate: '',
    eggCount: 1,
    hatchDate: '',
    chickCount: 0,
    chickStatus: '',
    notes: '',
  });

  useEffect(() => {
    fetchPairData();
  }, [params.id]);

  const fetchPairData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pairs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPair(data);
        setBreedingRecords(data.breedingRecords || []);
      } else {
        toast.error('Failed to load pair data');
        router.push('/pairs');
      }
    } catch (error) {
      console.error('Failed to fetch pair:', error);
      toast.error('Failed to load pair data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/pairs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        toast.success('Pair updated successfully');
        setEditDialogOpen(false);
        fetchPairData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update pair');
      }
    } catch (error) {
      console.error('Failed to update pair:', error);
      toast.error('Failed to update pair');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePair = async () => {
    if (confirm('Are you sure you want to delete this pair? This will also delete all breeding records.')) {
      try {
        const response = await fetch(`/api/pairs/${params.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Pair deleted successfully');
          router.push('/pairs');
        } else {
          toast.error('Failed to delete pair');
        }
      } catch (error) {
        console.error('Failed to delete pair:', error);
        toast.error('Failed to delete pair');
      }
    }
  };

  const handleAddBreedingRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/breeding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...breedingFormData,
          pairId: params.id,
        }),
      });

      if (response.ok) {
        toast.success('Breeding record added successfully');
        setAddBreedingDialogOpen(false);
        resetBreedingForm();
        fetchPairData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add breeding record');
      }
    } catch (error) {
      console.error('Failed to add breeding record:', error);
      toast.error('Failed to add breeding record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBreedingRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBreedingRecord) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/breeding/${editingBreedingRecord._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(breedingFormData),
      });

      if (response.ok) {
        toast.success('Breeding record updated successfully');
        setEditBreedingDialogOpen(false);
        setEditingBreedingRecord(null);
        resetBreedingForm();
        fetchPairData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update breeding record');
      }
    } catch (error) {
      console.error('Failed to update breeding record:', error);
      toast.error('Failed to update breeding record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBreedingRecord = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this breeding record?')) {
      try {
        const response = await fetch(`/api/breeding/${recordId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Breeding record deleted successfully');
          fetchPairData();
        } else {
          toast.error('Failed to delete breeding record');
        }
      } catch (error) {
        console.error('Failed to delete breeding record:', error);
        toast.error('Failed to delete breeding record');
      }
    }
  };

  const handleEditBreedingRecord = (record: BreedingRecord) => {
    setEditingBreedingRecord(record);
    setBreedingFormData({
      eggDate: formatDateForInput(record.eggDate),
      eggCount: record.eggCount,
      hatchDate: record.hatchDate ? formatDateForInput(record.hatchDate) : '',
      chickCount: record.chickCount || 0,
      chickStatus: record.chickStatus || '',
      notes: record.notes || '',
    });
    setEditBreedingDialogOpen(true);
  };

  const resetEditForm = () => {
    if (pair) {
      setEditFormData({
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
    }
  };

  const resetBreedingForm = () => {
    setBreedingFormData({
      eggDate: '',
      eggCount: 1,
      hatchDate: '',
      chickCount: 0,
      chickStatus: '',
      notes: '',
    });
  };

  const openEditDialog = () => {
    resetEditForm();
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
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

  const getSpeciesIcon = () => {
    return pair?.species === 'Pigeon' ? '🐦' : '🐔';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading pair details...</p>
        </div>
      </div>
    );
  }

  if (!pair) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <Bird className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Pair not found</p>
            <button
              onClick={() => router.push('/pairs')}
              className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Back to Pairs
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
          onClick={() => router.push('/pairs')}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pairs
        </button>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {pair.pairNumber} - {pair.maleName} & {pair.femaleName}
              </h1>
              {getStatusBadge(pair.status)}
            </div>
            <p className="text-gray-600">
              {getSpeciesIcon()} {pair.species} • {pair.breed}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Project: {pair.projectId.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeletePair}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${pair.purchasePrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Purchased: {format(new Date(pair.purchaseDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Breedings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pair.breedingStats?.totalBreedings || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Eggs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {pair.breedingStats?.totalEggs || 0}
                </p>
              </div>
              <Egg className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hatch Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {pair.breedingStats?.hatchRate || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {pair.breedingStats?.totalChicks || 0} chicks hatched
                </p>
              </div>
              <Baby className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="breeding" className="flex items-center gap-2">
            <Egg className="h-4 w-4" />
            <span className="hidden sm:inline">Breeding Records</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Gallery</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pair Information</CardTitle>
              <CardDescription>Detailed information about this breeding pair</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Male Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{pair.maleName}</span>
                    </div>
                    {pair.maleId && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">ID/Ring:</span>
                        <span className="font-medium">{pair.maleId}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Female Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{pair.femaleName}</span>
                    </div>
                    {pair.femaleId && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">ID/Ring:</span>
                        <span className="font-medium">{pair.femaleId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Breed:</p>
                    <p className="font-medium">{pair.breed}</p>
                  </div>
                  {pair.ringNumber && (
                    <div>
                      <p className="text-sm text-gray-600">Ring Number:</p>
                      <p className="font-medium">{pair.ringNumber}</p>
                    </div>
                  )}
                  {pair.color && (
                    <div>
                      <p className="text-sm text-gray-600">Color:</p>
                      <p className="font-medium">{pair.color}</p>
                    </div>
                  )}
                  {pair.age && (
                    <div>
                      <p className="text-sm text-gray-600">Age:</p>
                      <p className="font-medium">{pair.age}</p>
                    </div>
                  )}
                </div>
              </div>

              {pair.notes && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{pair.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breeding Records Tab */}
        <TabsContent value="breeding" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Breeding Records</CardTitle>
                  <CardDescription>
                    Track breeding history and success rates
                  </CardDescription>
                </div>
                <Dialog open={addBreedingDialogOpen} onOpenChange={setAddBreedingDialogOpen}>
                  <DialogTrigger>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Breeding Record</DialogTitle>
                      <DialogDescription>
                        Record new breeding activity for this pair
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBreedingRecord}>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Egg Date *</Label>
                          <Input
                            type="date"
                            value={breedingFormData.eggDate}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, eggDate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Egg Count *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={breedingFormData.eggCount}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, eggCount: parseInt(e.target.value) })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Hatch Date</Label>
                          <Input
                            type="date"
                            value={breedingFormData.hatchDate}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, hatchDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Chick Count</Label>
                          <Input
                            type="number"
                            min="0"
                            value={breedingFormData.chickCount}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, chickCount: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label>Chick Status</Label>
                          <Input
                            value={breedingFormData.chickStatus}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, chickStatus: e.target.value })}
                            placeholder="Healthy, Weak, etc."
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Textarea
                            value={breedingFormData.notes}
                            onChange={(e) => setBreedingFormData({ ...breedingFormData, notes: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddBreedingDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                          {submitting ? 'Adding...' : 'Add Record'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {breedingRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Egg className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No breeding records yet</p>
                  <Button
                    variant="outline"
                    onClick={() => setAddBreedingDialogOpen(true)}
                    className="mt-4"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Record
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Egg Date</TableHead>
                        <TableHead>Egg Count</TableHead>
                        <TableHead>Hatch Date</TableHead>
                        <TableHead>Chick Count</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breedingRecords.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{format(new Date(record.eggDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.eggCount}</TableCell>
                          <TableCell>
                            {record.hatchDate ? format(new Date(record.hatchDate), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>{record.chickCount || 0}</TableCell>
                          <TableCell>
                            {record.chickStatus ? (
                              <Badge variant="outline">{record.chickStatus}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBreedingRecord(record)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBreedingRecord(record._id)}
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

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
              <CardDescription>Images of this breeding pair</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Gallery Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">
                  Upload and manage photos of this pair
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Breeding Record Dialog */}
      <Dialog open={editBreedingDialogOpen} onOpenChange={setEditBreedingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Breeding Record</DialogTitle>
            <DialogDescription>
              Update the breeding record details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBreedingRecord}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Egg Date *</Label>
                <Input
                  type="date"
                  value={breedingFormData.eggDate}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, eggDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Egg Count *</Label>
                <Input
                  type="number"
                  min="1"
                  value={breedingFormData.eggCount}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, eggCount: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Hatch Date</Label>
                <Input
                  type="date"
                  value={breedingFormData.hatchDate}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, hatchDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Chick Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={breedingFormData.chickCount}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, chickCount: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Chick Status</Label>
                <Input
                  value={breedingFormData.chickStatus}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, chickStatus: e.target.value })}
                  placeholder="Healthy, Weak, etc."
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={breedingFormData.notes}
                  onChange={(e) => setBreedingFormData({ ...breedingFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditBreedingDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Pair Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pair</DialogTitle>
            <DialogDescription>Update the pair details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePair}>
            <div className="space-y-4 py-4">
              <div>
                <Label>Pair Number *</Label>
                <Input
                  value={editFormData.pairNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, pairNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Species *</Label>
                <Select
                  value={editFormData.species}
                  onValueChange={(value) => {
                    if (value === 'Pigeon' || value === 'Chicken') {
                      setEditFormData({ ...editFormData, species: value });
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
                  value={editFormData.breed}
                  onChange={(e) => setEditFormData({ ...editFormData, breed: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Male Name *</Label>
                  <Input
                    value={editFormData.maleName}
                    onChange={(e) => setEditFormData({ ...editFormData, maleName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Female Name *</Label>
                  <Input
                    value={editFormData.femaleName}
                    onChange={(e) => setEditFormData({ ...editFormData, femaleName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) => {
                    if (value === 'active' || value === 'breeding' || value === 'sold') {
                      setEditFormData({ ...editFormData, status: value });
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
              <div>
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={editFormData.purchaseDate}
                  onChange={(e) => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Purchase Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.purchasePrice}
                  onChange={(e) => setEditFormData({ ...editFormData, purchasePrice: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting ? 'Saving...' : 'Update Pair'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}