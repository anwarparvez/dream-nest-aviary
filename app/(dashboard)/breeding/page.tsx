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
  Egg,
  Search,
  Loader2,
  TrendingUp,
  Calendar,
  Bird,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BreedingRecord {
  _id: string;
  pairId: {
    _id: string;
    pairNumber: string;
    maleName: string;
    femaleName: string;
    species: string;
    breed: string;
    projectId?: {
      _id: string;
      name: string;
      type: string;
    };
  };
  eggDate: string;
  eggCount: number;
  hatchDate?: string;
  chickCount?: number;
  chickStatus?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pair {
  _id: string;
  pairNumber: string;
  maleName: string;
  femaleName: string;
  species: string;
  breed: string;
  projectId: {
    _id: string;
    name: string;
  };
  status: string;
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

export default function BreedingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPair, setSelectedPair] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BreedingRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    pairId: '',
    eggDate: '',
    eggCount: 1,
    hatchDate: '',
    chickCount: 0,
    chickStatus: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, pairsRes] = await Promise.all([
        fetch('/api/breeding'),
        fetch('/api/pairs'),
      ]);

      const recordsData = await recordsRes.json();
      const pairsData = await pairsRes.json();

      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setPairs(Array.isArray(pairsData) ? pairsData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load breeding records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = editingRecord ? `/api/breeding/${editingRecord._id}` : '/api/breeding';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingRecord ? 'Breeding record updated successfully' : 'Breeding record added successfully');
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save breeding record');
      }
    } catch (error) {
      console.error('Failed to save breeding record:', error);
      toast.error('Failed to save breeding record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this breeding record?')) {
      try {
        const response = await fetch(`/api/breeding/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Breeding record deleted successfully');
          fetchData();
        } else {
          toast.error('Failed to delete breeding record');
        }
      } catch (error) {
        console.error('Failed to delete breeding record:', error);
        toast.error('Failed to delete breeding record');
      }
    }
  };

  const handleEdit = (record: BreedingRecord) => {
    setEditingRecord(record);
    setFormData({
      pairId: record.pairId._id,
      eggDate: formatDateForInput(record.eggDate),
      eggCount: record.eggCount,
      hatchDate: record.hatchDate ? formatDateForInput(record.hatchDate) : '',
      chickCount: record.chickCount || 0,
      chickStatus: record.chickStatus || '',
      notes: record.notes || '',
    });
    setDialogOpen(true);
  };

  const handleView = (record: BreedingRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      pairId: '',
      eggDate: '',
      eggCount: 1,
      hatchDate: '',
      chickCount: 0,
      chickStatus: '',
      notes: '',
    });
  };

  const getHatchRate = (record: BreedingRecord) => {
    if (!record.hatchDate || record.chickCount === undefined) return null;
    const rate = (record.chickCount / record.eggCount) * 100;
    return rate.toFixed(1);
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.pairId.pairNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pairId.maleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.pairId.femaleName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPair = selectedPair === 'all' || record.pairId._id === selectedPair;
    
    return matchesSearch && matchesPair;
  });

  const stats = {
    total: records.length,
    totalEggs: records.reduce((sum, r) => sum + r.eggCount, 0),
    totalChicks: records.reduce((sum, r) => sum + (r.chickCount || 0), 0),
    hatchRate: records.reduce((sum, r) => sum + (r.chickCount || 0), 0) / 
                records.reduce((sum, r) => sum + r.eggCount, 0) * 100 || 0,
    successfulBreedings: records.filter(r => r.chickCount && r.chickCount > 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading breeding records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Breeding Records</h1>
          <p className="text-gray-600 mt-2">
            Track breeding success and hatch rates for all pairs
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <span>
              <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Add Breeding Record
              </Button>
            </span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Breeding Record' : 'Add Breeding Record'}</DialogTitle>
              <DialogDescription>
                {editingRecord ? 'Update the breeding record details below.' : 'Record a new breeding event for a pair.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Select Pair *</Label>
                  <Select
                    value={formData.pairId}
                    onValueChange={(value) => {
                      if (value) setFormData({ ...formData, pairId: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {pairs.map((pair) => (
                        <SelectItem key={pair._id} value={pair._id}>
                          {pair.pairNumber} - {pair.maleName} & {pair.femaleName} ({pair.breed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Egg Date *</Label>
                  <Input
                    type="date"
                    value={formData.eggDate}
                    onChange={(e) => setFormData({ ...formData, eggDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Egg Count *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.eggCount}
                    onChange={(e) => setFormData({ ...formData, eggCount: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Hatch Date</Label>
                  <Input
                    type="date"
                    value={formData.hatchDate}
                    onChange={(e) => setFormData({ ...formData, hatchDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Chick Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.chickCount}
                    onChange={(e) => setFormData({ ...formData, chickCount: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Chick Status</Label>
                  <Input
                    value={formData.chickStatus}
                    onChange={(e) => setFormData({ ...formData, chickStatus: e.target.value })}
                    placeholder="Healthy, Weak, etc."
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes about this breeding..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingRecord ? 'Update Record' : 'Add Record')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Egg className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Breedings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Egg className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalEggs}</p>
              <p className="text-xs text-gray-500">Total Eggs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalChicks}</p>
              <p className="text-xs text-gray-500">Total Chicks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.hatchRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Hatch Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by pair number or names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={selectedPair} 
              onValueChange={(value) => {
                if (value) setSelectedPair(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by pair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pairs</SelectItem>
                {pairs.map((pair) => (
                  <SelectItem key={pair._id} value={pair._id}>
                    {pair.pairNumber} - {pair.maleName} & {pair.femaleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Breeding Records Table */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Egg className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No breeding records found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedPair !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first breeding record to get started'}
            </p>
            {!searchTerm && selectedPair === 'all' && (
              <Button
                onClick={() => setDialogOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Breeding Record
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
                    <TableHead>Pair</TableHead>
                    <TableHead>Male/Female</TableHead>
                    <TableHead>Egg Date</TableHead>
                    <TableHead>Egg Count</TableHead>
                    <TableHead>Hatch Date</TableHead>
                    <TableHead>Chick Count</TableHead>
                    <TableHead>Hatch Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const hatchRate = getHatchRate(record);
                    return (
                      <TableRow key={record._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {record.pairId.pairNumber}
                        </TableCell>
                        <TableCell>
                          {record.pairId.maleName} & {record.pairId.femaleName}
                        </TableCell>
                        <TableCell>{format(new Date(record.eggDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{record.eggCount}</TableCell>
                        <TableCell>
                          {record.hatchDate ? format(new Date(record.hatchDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>{record.chickCount || 0}</TableCell>
                        <TableCell>
                          {hatchRate ? (
                            <Badge className={parseFloat(hatchRate) >= 70 ? 'bg-green-500' : parseFloat(hatchRate) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}>
                              {hatchRate}%
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.chickStatus ? (
                            <Badge variant="outline">{record.chickStatus}</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(record)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record._id)}
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>Breeding Record Details</DialogTitle>
                <DialogDescription>
                  Complete information about this breeding event
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Pair Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Pair</p>
                    <p className="font-medium">{selectedRecord.pairId.pairNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Breed</p>
                    <p className="font-medium">{selectedRecord.pairId.breed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Male</p>
                    <p className="font-medium">{selectedRecord.pairId.maleName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Female</p>
                    <p className="font-medium">{selectedRecord.pairId.femaleName}</p>
                  </div>
                  {selectedRecord.pairId.projectId && (
                    <div>
                      <p className="text-sm text-gray-600">Project</p>
                      <p className="font-medium">{selectedRecord.pairId.projectId.name}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Breeding Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Egg Date</p>
                      <p className="font-medium">{format(new Date(selectedRecord.eggDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Egg Count</p>
                      <p className="font-medium">{selectedRecord.eggCount}</p>
                    </div>
                    {selectedRecord.hatchDate && (
                      <div>
                        <p className="text-sm text-gray-600">Hatch Date</p>
                        <p className="font-medium">{format(new Date(selectedRecord.hatchDate), 'PPP')}</p>
                      </div>
                    )}
                    {selectedRecord.chickCount !== undefined && (
                      <div>
                        <p className="text-sm text-gray-600">Chick Count</p>
                        <p className="font-medium">{selectedRecord.chickCount}</p>
                      </div>
                    )}
                    {selectedRecord.chickStatus && (
                      <div>
                        <p className="text-sm text-gray-600">Chick Status</p>
                        <p className="font-medium">
                          <Badge variant="outline">{selectedRecord.chickStatus}</Badge>
                        </p>
                      </div>
                    )}
                    {selectedRecord.notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-gray-700">{selectedRecord.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {((selectedRecord.chickCount || 0) / selectedRecord.eggCount * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Hatch Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedRecord.eggCount}
                      </p>
                      <p className="text-xs text-gray-500">Total Eggs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedRecord.chickCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">Chicks Hatched</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleEdit(selectedRecord);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Edit Record
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}