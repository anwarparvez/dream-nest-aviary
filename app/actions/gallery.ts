'use server'

import { connectDB } from '@/lib/db/mongodb'
import BirdImage from '@/lib/db/models/BirdImage'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const imageSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  species: z.enum(['Pigeon', 'Chicken']),
  breed: z.string().min(1, 'Breed is required'),
  tags: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url(),
  projectId: z.string().optional(),
  pairId: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
})

export async function uploadBirdImage(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const tagsString = formData.get('tags') as string
  const tags = tagsString ? tagsString.split(',').map(t => t.trim()) : []

  const rawData = {
    title: formData.get('title'),
    species: formData.get('species'),
    breed: formData.get('breed'),
    tags: tagsString,
    description: formData.get('description'),
    imageUrl: formData.get('imageUrl'),
    projectId: formData.get('projectId') || undefined,
    pairId: formData.get('pairId') || undefined,
    visibility: formData.get('visibility') || 'public',
  }

  const result = imageSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const image = await BirdImage.create({
      ...result.data,
      tags,
      uploadedBy: (session.user as any).id,
      createdAt: new Date(),
    })

    revalidatePath('/gallery')
    revalidatePath('/explore')
    if (result.data.projectId) {
      revalidatePath(`/projects/${result.data.projectId}`)
    }
    if (result.data.pairId) {
      revalidatePath(`/pairs/${result.data.pairId}`)
    }
    
    redirect('/gallery')
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, errors: { _form: ['Failed to upload image'] } }
  }
}

export async function deleteImage(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string

  try {
    await connectDB()
    await BirdImage.findByIdAndDelete(id)
    
    revalidatePath('/gallery')
    revalidatePath('/explore')
    redirect('/gallery')
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: 'Failed to delete image' }
  }
}

export async function updateImageVisibility(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const visibility = formData.get('visibility') as string

  try {
    await connectDB()
    await BirdImage.findByIdAndUpdate(id, { visibility, updatedAt: new Date() })
    
    revalidatePath('/gallery')
    revalidatePath('/explore')
    return { success: true }
  } catch (error) {
    console.error('Error updating image visibility:', error)
    return { success: false, error: 'Failed to update visibility' }
  }
}