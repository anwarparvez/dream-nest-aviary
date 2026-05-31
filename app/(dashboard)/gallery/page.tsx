'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Search,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GalleryImage {
  _id: string;
  title: string;
  species: 'Pigeon' | 'Chicken';
  breed: string;
  tags: string[];
  description?: string;
  imageUrl: string;
  visibility: 'public' | 'private';
  projectId?: {
    _id: string;
    name: string;
  };
  uploadedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function GalleryPage() {
  const { data: session } = useSession();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    species: 'Pigeon' as const,
    breed: '',
    tags: '',
    description: '',
    imageUrl: '',
    visibility: 'public' as const,
  });

  // Check if user is admin - safely access role
  const isAdmin = (session?.user as any)?.role === 'admin';

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gallery');
      const data = await response.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setImages([]);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadForm(prev => ({ ...prev, imageUrl: data.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.imageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    try {
      const tagsArray = uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uploadForm,
          tags: tagsArray,
        }),
      });

      if (response.ok) {
        toast.success('Image saved to gallery');
        setUploadDialogOpen(false);
        resetForm();
        fetchImages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save image');
      }
    } catch (error) {
      console.error('Failed to save image:', error);
      toast.error('Failed to save image');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        const response = await fetch(`/api/gallery/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Image deleted successfully');
          fetchImages();
        } else {
          toast.error('Failed to delete image');
        }
      } catch (error) {
        console.error('Failed to delete image:', error);
        toast.error('Failed to delete image');
      }
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        toast.success(`Image visibility changed to ${newVisibility}`);
        fetchImages();
      } else {
        toast.error('Failed to update visibility');
      }
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const resetForm = () => {
    setUploadForm({
      title: '',
      species: 'Pigeon',
      breed: '',
      tags: '',
      description: '',
      imageUrl: '',
      visibility: 'public',
    });
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = searchTerm === '' || 
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = selectedSpecies === 'all' || image.species === selectedSpecies;
    
    return matchesSearch && matchesSpecies;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photo Gallery</h1>
          <p className="text-gray-600 mt-2">
            Browse and manage bird photos
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Photo</DialogTitle>
                <DialogDescription>
                  Add a new bird photo to the gallery
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  {/* Image Upload */}
                  <div>
                    <Label>Upload Image *</Label>
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      {uploading && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Uploading...</span>
                        </div>
                      )}
                      {uploadForm.imageUrl && (
                        <div className="mt-2 relative">
                          <img
                            src={uploadForm.imageUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadForm(prev => ({ ...prev, imageUrl: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="Beautiful pigeon photo"
                      required
                    />
                  </div>

                  <div>
                    <Label>Species *</Label>
                    <Select
                      value={uploadForm.species}
                      onValueChange={(value: any) => setUploadForm({ ...uploadForm, species: value })}
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
                      value={uploadForm.breed}
                      onChange={(e) => setUploadForm({ ...uploadForm, breed: e.target.value })}
                      placeholder="Fancy Pigeon, Silkie Chicken, etc."
                      required
                    />
                  </div>

                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                      placeholder="fancy, show, champion"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      placeholder="Additional details about this bird..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Visibility</Label>
                    <Select
                      value={uploadForm.visibility}
                      onValueChange={(value: any) => setUploadForm({ ...uploadForm, visibility: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (visible to everyone)</SelectItem>
                        <SelectItem value="private">Private (only admins)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!uploadForm.imageUrl || uploading}>
                    {uploading ? 'Uploading...' : 'Save to Gallery'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Fixed Select - Handle null value */}
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
                <SelectItem value="Pigeon">🐦 Pigeons</SelectItem>
                <SelectItem value="Chicken">🐔 Chickens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No photos found</p>
            <p className="text-gray-400 mt-2">
              {searchTerm || selectedSpecies !== 'all'
                ? 'Try adjusting your filters'
                : isAdmin
                ? 'Upload your first bird photo to get started'
                : 'Check back later for new photos'}
            </p>
            {isAdmin && !searchTerm && selectedSpecies === 'all' && (
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload First Photo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Card key={image._id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative h-64 bg-gray-100">
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                  }}
                />
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggleVisibility(image._id, image.visibility)}
                      className="bg-white/90 hover:bg-white"
                    >
                      {image.visibility === 'public' ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image._id)}
                      className="bg-red-500/90 hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <Badge className={image.visibility === 'public' ? 'bg-green-500' : 'bg-gray-500'}>
                    {image.visibility}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                  {image.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {image.species === 'Pigeon' ? '🐦' : '🐔'} {image.breed}
                </p>
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {image.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Uploaded by {image.uploadedBy.name} • {format(new Date(image.createdAt), 'MMM dd, yyyy')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}