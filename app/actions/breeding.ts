'use server'

import { connectDB } from '@/lib/db/mongodb'
import BreedingRecord from '@/lib/db/models/BreedingRecord'
import Pair from '@/lib/db/models/Pair'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const breedingSchema = z.object({
  pairId: z.string(),
  eggDate: z.string(),
  eggCount: z.number().min(1, 'At least 1 egg'),
  hatchDate: z.string().optional(),
  chickCount: z.number().optional(),
  chickStatus: z.string().optional(),
  notes: z.string().optional(),
})

export async function createBreedingRecord(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  // Check if session exists and user has admin role
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    pairId: formData.get('pairId'),
    eggDate: formData.get('eggDate'),
    eggCount: Number(formData.get('eggCount')),
    hatchDate: formData.get('hatchDate') || undefined,
    chickCount: formData.get('chickCount') ? Number(formData.get('chickCount')) : undefined,
    chickStatus: formData.get('chickStatus') || undefined,
    notes: formData.get('notes') || undefined,
  }

  const result = breedingSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const record = await BreedingRecord.create({
      ...result.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await Pair.findByIdAndUpdate(rawData.pairId, { status: 'breeding' })

    revalidatePath('/pairs')
    revalidatePath(`/pairs/${rawData.pairId}`)
    revalidatePath('/dashboard')
    redirect(`/pairs/${rawData.pairId}`)
  } catch (error) {
    console.error('Error creating breeding record:', error)
    return { success: false, errors: { _form: ['Failed to create breeding record'] } }
  }
}

export async function updateBreedingRecord(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  
  // Check if session exists and user has admin role
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    eggDate: formData.get('eggDate'),
    eggCount: Number(formData.get('eggCount')),
    hatchDate: formData.get('hatchDate') || undefined,
    chickCount: formData.get('chickCount') ? Number(formData.get('chickCount')) : undefined,
    chickStatus: formData.get('chickStatus') || undefined,
    notes: formData.get('notes') || undefined,
  }

  const result = breedingSchema.partial().safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const record = await BreedingRecord.findByIdAndUpdate(
      id,
      { ...result.data, updatedAt: new Date() },
      { new: true }
    )

    if (!record) {
      return { success: false, errors: { _form: ['Record not found'] } }
    }

    revalidatePath('/pairs')
    revalidatePath(`/pairs/${record.pairId}`)
    redirect(`/pairs/${record.pairId}`)
  } catch (error) {
    console.error('Error updating breeding record:', error)
    return { success: false, errors: { _form: ['Failed to update breeding record'] } }
  }
}

export async function deleteBreedingRecord(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  // Check if session exists and user has admin role
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const pairId = formData.get('pairId') as string

  try {
    await connectDB()
    await BreedingRecord.findByIdAndDelete(id)
    
    const remainingRecords = await BreedingRecord.countDocuments({ pairId })
    if (remainingRecords === 0) {
      await Pair.findByIdAndUpdate(pairId, { status: 'active' })
    }

    revalidatePath('/pairs')
    revalidatePath(`/pairs/${pairId}`)
    redirect(`/pairs/${pairId}`)
  } catch (error) {
    console.error('Error deleting breeding record:', error)
    return { success: false, error: 'Failed to delete breeding record' }
  }
}