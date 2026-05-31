export function getOptimizedImageUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale';
}) {
  if (!url.includes('cloudinary.com')) return url;
  
  const transformations = [];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  
  if (transformations.length === 0) return url;
  
  // Insert transformations after 'upload/'
  const parts = url.split('/upload/');
  return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
}