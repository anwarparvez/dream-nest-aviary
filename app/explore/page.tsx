'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Camera,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
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

export default function ExplorePage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedBreed, setSelectedBreeds] = useState<string>('all');
  const [breeds, setBreeds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPublicGallery();
  }, []);

  useEffect(() => {
    filterImages();
  }, [searchTerm, selectedSpecies, selectedBreed, images]);

  const fetchPublicGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gallery/public');
      const data = await response.json();
      const imagesData = data.images || data;
      const imagesArray = Array.isArray(imagesData) ? imagesData : [];
      setImages(imagesArray);
      
      // Extract unique breeds - Fixed type issue
      const uniqueBreeds: string[] = [];
      imagesArray.forEach((img: GalleryImage) => {
        if (img.breed && !uniqueBreeds.includes(img.breed)) {
          uniqueBreeds.push(img.breed);
        }
      });
      setBreeds(uniqueBreeds);
      
      setTotalPages(Math.ceil(imagesArray.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const filterImages = () => {
    let filtered = [...images];
    
    if (selectedSpecies !== 'all') {
      filtered = filtered.filter(img => img.species.toLowerCase() === selectedSpecies.toLowerCase());
    }
    
    if (selectedBreed !== 'all') {
      filtered = filtered.filter(img => img.breed === selectedBreed);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredImages(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  };

  const getPaginatedImages = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredImages.slice(start, end);
  };

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleShare = async (image: GalleryImage) => {
    const shareData = {
      title: image.title,
      text: `Check out this beautiful ${image.species} - ${image.breed}`,
      url: `${window.location.origin}/gallery/${image._id}`,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-emerald-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Dream Nest Aviary Gallery
            </h1>
            <p className="text-xl text-emerald-100 mb-8">
              Explore our beautiful collection of pigeons and chickens
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by title, breed, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white text-gray-900 border-0 h-12 rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
        
        {/* Decorative bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Species
              </label>
              <Select
                value={selectedSpecies}
                onValueChange={(value) => {
                  if (value) setSelectedSpecies(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="pigeon">🐦 Pigeons</SelectItem>
                  <SelectItem value="chicken">🐔 Chickens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Breed
              </label>
              <Select
                value={selectedBreed}
                onValueChange={(value) => {
                  if (value) setSelectedBreeds(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {breeds.map((breed) => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSpecies('all');
                  setSelectedBreeds('all');
                }}
                className="w-full"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {getPaginatedImages().length} of {filteredImages.length} images
          </p>
        </div>

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No photos found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || selectedSpecies !== 'all' || selectedBreed !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Check back later for new photos'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getPaginatedImages().map((image) => (
                <Card
                  key={image._id}
                  className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    setSelectedImage(image);
                    setModalOpen(true);
                  }}
                >
                  <div className="relative h-64 bg-gray-100 overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image.imageUrl, image.title);
                          }}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(image);
                          }}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
                      {image.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {image.species === 'Pigeon' ? '🐦' : '🐔'} {image.species}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {image.breed}
                      </Badge>
                    </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? 'bg-emerald-600' : ''}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedImage.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-auto max-h-[60vh] object-contain"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {selectedImage.species === 'Pigeon' ? '🐦' : '🐔'} {selectedImage.species}
                  </Badge>
                  <Badge variant="outline">{selectedImage.breed}</Badge>
                </div>
                
                {selectedImage.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Description</h4>
                    <p className="text-gray-600">{selectedImage.description}</p>
                  </div>
                )}
                
                {selectedImage.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedImage.projectId && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Project</h4>
                    <p className="text-gray-600">{selectedImage.projectId.name}</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <p>Uploaded by {selectedImage.uploadedBy.name}</p>
                  <p>Date: {format(new Date(selectedImage.createdAt), 'PPP')}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.title)}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedImage)}
                    className="flex-1"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Dream Nest Aviary. All rights reserved.</p>
          <p className="text-gray-400 text-sm mt-2">
            Explore our beautiful collection of pigeons and chickens
          </p>
        </div>
      </footer>
    </div>
  );
}