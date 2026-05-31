'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (url: string, publicId: string) => void;
  onRemove?: (publicId: string) => void;
  existingImage?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export function ImageUpload({ 
  onUpload, 
  onRemove, 
  existingImage, 
  multiple = false, 
  maxFiles = 5 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<{ url: string; publicId: string }[]>(
    existingImage ? [{ url: existingImage, publicId: '' }] : []
  );

  const handleUpload = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    if (!multiple && images.length + fileArray.length > 1) {
      alert('You can only upload one file');
      return;
    }
    
    if (images.length + fileArray.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        continue;
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
          const newImage = { url: data.url, publicId: data.publicId };
          setImages(prev => [...prev, newImage]);
          onUpload(data.url, data.publicId);
        } else {
          const error = await response.json();
          alert(error.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  }, [images.length, maxFiles, multiple, onUpload]);

  const handleRemove = async (index: number, publicId: string) => {
    if (publicId) {
      try {
        await fetch(`/api/upload?publicId=${publicId}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    
    const removedImage = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));
    
    if (onRemove && removedImage.publicId) {
      onRemove(removedImage.publicId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
        <Input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <Label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click or drag and drop to upload images
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
        </Label>
      </div>

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.url}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index, image.publicId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}