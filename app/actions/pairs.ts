'use server'

import { connectDB } from '@/lib/db/mongodb'
import Pair from '@/lib/db/models/Pair'
import BreedingRecord from '@/lib/db/models/BreedingRecord'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const pairSchema = z.object({
  pairNumber: z.string().min(1, 'Pair number is required'),
  projectId: z.string(),
  species: z.enum(['Pigeon', 'Chicken']),
  breed: z.string().min(1, 'Breed is required'),
  maleName: z.string().min(1, 'Male name is required'),
  maleId: z.string().optional(),
  femaleName: z.string().min(1, 'Female name is required'),
  femaleId: z.string().optional(),
  ringNumber: z.string().optional(),
  color: z.string().optional(),
  age: z.string().optional(),
  purchaseDate: z.string(),
  purchasePrice: z.number().min(0),
  notes: z.string().optional(),
  status: z.enum(['active', 'breeding', 'sold']).default('active'),
})

export async function createPair(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    pairNumber: formData.get('pairNumber'),
    projectId: formData.get('projectId'),
    species: formData.get('species'),
    breed: formData.get('breed'),
    maleName: formData.get('maleName'),
    maleId: formData.get('maleId'),
    femaleName: formData.get('femaleName'),
    femaleId: formData.get('femaleId'),
    ringNumber: formData.get('ringNumber'),
    color: formData.get('color'),
    age: formData.get('age'),
    purchaseDate: formData.get('purchaseDate'),
    purchasePrice: Number(formData.get('purchasePrice')),
    notes: formData.get('notes'),
    status: formData.get('status'),
  }

  const result = pairSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const PairModel = Pair as any
    
    const pair = await PairModel.create({
      pairNumber: result.data.pairNumber,
      projectId: result.data.projectId,
      species: result.data.species,
      breed: result.data.breed,
      maleName: result.data.maleName,
      maleId: result.data.maleId || '',
      femaleName: result.data.femaleName,
      femaleId: result.data.femaleId || '',
      ringNumber: result.data.ringNumber || '',
      color: result.data.color || '',
      age: result.data.age || '',
      purchaseDate: new Date(result.data.purchaseDate),
      purchasePrice: result.data.purchasePrice,
      notes: result.data.notes || '',
      images: [],
      status: result.data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath('/pairs')
    revalidatePath(`/projects/${result.data.projectId}`)
    revalidatePath('/dashboard')
    redirect(`/pairs/${pair._id}`)
  } catch (error) {
    console.error('Error creating pair:', error)
    return { success: false, errors: { _form: ['Failed to create pair'] } }
  }
}

export async function updatePair(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    pairNumber: formData.get('pairNumber'),
    projectId: formData.get('projectId'),
    species: formData.get('species'),
    breed: formData.get('breed'),
    maleName: formData.get('maleName'),
    maleId: formData.get('maleId'),
    femaleName: formData.get('femaleName'),
    femaleId: formData.get('femaleId'),
    ringNumber: formData.get('ringNumber'),
    color: formData.get('color'),
    age: formData.get('age'),
    purchaseDate: formData.get('purchaseDate'),
    purchasePrice: Number(formData.get('purchasePrice')),
    notes: formData.get('notes'),
    status: formData.get('status'),
  }

  const result = pairSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const PairModel = Pair as any
    
    const pair = await PairModel.findByIdAndUpdate(
      id,
      {
        pairNumber: result.data.pairNumber,
        projectId: result.data.projectId,
        species: result.data.species,
        breed: result.data.breed,
        maleName: result.data.maleName,
        maleId: result.data.maleId || '',
        femaleName: result.data.femaleName,
        femaleId: result.data.femaleId || '',
        ringNumber: result.data.ringNumber || '',
        color: result.data.color || '',
        age: result.data.age || '',
        purchaseDate: new Date(result.data.purchaseDate),
        purchasePrice: result.data.purchasePrice,
        notes: result.data.notes || '',
        status: result.data.status,
        updatedAt: new Date(),
      },
      { new: true }
    )

    if (!pair) {
      return { success: false, errors: { _form: ['Pair not found'] } }
    }

    revalidatePath('/pairs')
    revalidatePath(`/pairs/${id}`)
    revalidatePath(`/projects/${result.data.projectId}`)
    redirect(`/pairs/${id}`)
  } catch (error) {
    console.error('Error updating pair:', error)
    return { success: false, errors: { _form: ['Failed to update pair'] } }
  }
}

export async function deletePair(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const projectId = formData.get('projectId') as string

  try {
    await connectDB()
    
    const BreedingRecordModel = BreedingRecord as any
    const PairModel = Pair as any
    
    await BreedingRecordModel.deleteMany({ pairId: id })
    await PairModel.findByIdAndDelete(id)
    
    revalidatePath('/pairs')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/dashboard')
    redirect('/pairs')
  } catch (error) {
    console.error('Error deleting pair:', error)
    return { success: false, error: 'Failed to delete pair' }
  }
}

export async function updatePairStatus(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const status = formData.get('status') as string

  try {
    await connectDB()
    
    const PairModel = Pair as any
    await PairModel.findByIdAndUpdate(id, { status, updatedAt: new Date() })
    
    revalidatePath('/pairs')
    revalidatePath(`/pairs/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating pair status:', error)
    return { success: false, error: 'Failed to update status' }
  }
}