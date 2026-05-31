'use server'

import { connectDB } from '@/lib/db/mongodb'
import Expense from '@/lib/db/models/Expense'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'

const expenseSchema = z.object({
  projectId: z.string(),
  date: z.string(),
  category: z.enum(['Feed', 'Medicine', 'Cage', 'Transport', 'Utility', 'Other']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  note: z.string().optional(),
})

export async function createExpense(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    projectId: formData.get('projectId'),
    date: formData.get('date'),
    category: formData.get('category'),
    amount: Number(formData.get('amount')),
    note: formData.get('note'),
  }

  const result = expenseSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const expense = await Expense.create({
      ...result.data,
      createdBy: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath('/expenses')
    revalidatePath(`/projects/${result.data.projectId}`)
    revalidatePath('/dashboard')
    redirect('/expenses')
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, errors: { _form: ['Failed to create expense'] } }
  }
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const rawData = {
    projectId: formData.get('projectId'),
    date: formData.get('date'),
    category: formData.get('category'),
    amount: Number(formData.get('amount')),
    note: formData.get('note'),
  }

  const result = expenseSchema.safeParse(rawData)
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors }
  }

  try {
    await connectDB()
    
    const expense = await Expense.findByIdAndUpdate(
      id,
      { ...result.data, updatedAt: new Date() },
      { new: true }
    )

    if (!expense) {
      return { success: false, errors: { _form: ['Expense not found'] } }
    }

    revalidatePath('/expenses')
    revalidatePath(`/projects/${result.data.projectId}`)
    revalidatePath('/dashboard')
    redirect('/expenses')
  } catch (error) {
    console.error('Error updating expense:', error)
    return { success: false, errors: { _form: ['Failed to update expense'] } }
  }
}

export async function deleteExpense(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const projectId = formData.get('projectId') as string

  try {
    await connectDB()
    await Expense.findByIdAndDelete(id)
    
    revalidatePath('/expenses')
    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/dashboard')
    redirect('/expenses')
  } catch (error) {
    console.error('Error deleting expense:', error)
    return { success: false, error: 'Failed to delete expense' }
  }
}