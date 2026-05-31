'use server'

import { connectDB } from '@/lib/db/mongodb'
import Project from '@/lib/db/models/Project'
import Pair from '@/lib/db/models/Pair'
import Expense from '@/lib/db/models/Expense'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['Pigeon', 'Chicken', 'Mixed']),
  startDate: z.string(),
  targetPairCount: z.number().min(1, 'Target must be at least 1'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  notes: z.string().optional(),
})

export async function createProject(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
    startDate: formData.get('startDate'),
    targetPairCount: Number(formData.get('targetPairCount')),
    status: formData.get('status') || 'active',
    notes: formData.get('notes'),
  }

  const result = projectSchema.safeParse(rawData)
  
  if (!result.success) {
    return { 
      success: false, 
      errors: result.error.flatten().fieldErrors 
    }
  }

  try {
    await connectDB()
    
    const project = await Project.create({
      ...result.data,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath('/projects')
    revalidatePath('/dashboard')
    redirect('/projects')
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, errors: { _form: ['Failed to create project'] } }
  }
}

export async function updateProject(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
    startDate: formData.get('startDate'),
    targetPairCount: Number(formData.get('targetPairCount')),
    status: formData.get('status'),
    notes: formData.get('notes'),
  }

  const result = projectSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const project = await Project.findByIdAndUpdate(
      id,
      { ...result.data, updatedAt: new Date() },
      { new: true }
    )

    if (!project) {
      return { success: false, errors: { _form: ['Project not found'] } }
    }

    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    revalidatePath('/dashboard')
    redirect('/projects')
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, errors: { _form: ['Failed to update project'] } }
  }
}

export async function deleteProject(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string

  try {
    await connectDB()
    
    await Pair.deleteMany({ projectId: id })
    await Expense.deleteMany({ projectId: id })
    await Project.findByIdAndDelete(id)
    
    revalidatePath('/projects')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: 'Failed to delete project' }
  }
}

export async function archiveProject(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string

  try {
    await connectDB()
    await Project.findByIdAndUpdate(id, { status: 'archived', updatedAt: new Date() })
    
    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error archiving project:', error)
    return { success: false, error: 'Failed to archive project' }
  }
}