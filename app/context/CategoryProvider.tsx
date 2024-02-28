'use client'

import { ReactNode, createContext, useState } from "react";
import { Category } from "../interfaces/categories";
import axios from "axios";
import fetcher from "../lib/fetcher";
import useSWR, { KeyedMutator } from "swr";
import { enqueueSnackbar } from "notistack";

interface CategoryContextProps {
  getCategories: () => Category[] | undefined
  upsertCategory: (value: Category) => Promise<void>
  deleteCategory: (value: Category) => Promise<boolean>
  data?: Category[] | undefined
  error?: Error | undefined
  isLoading?: boolean
  mutate?: KeyedMutator<Category[]>
}

export const CategoryContext = createContext<CategoryContextProps>({
  getCategories: () => [],
  upsertCategory: () => new Promise((res) => res),
  deleteCategory: () => new Promise((res) => res)
})

interface CategoryProviderProps {
  children: ReactNode
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const { data, error, isLoading, mutate } = useSWR<Category[], Error>(
    "/api/categories",
    fetcher
  )

  const getCategories = () => {
    return data
  }

  const upsertCategory = async (value: Category) => {
    try {
      const res = await axios.post('/api/category', value)
      if (data) {
        const index = data?.findIndex((el) => el._id === value._id)
        data[index] = value
        mutate(data, { rollbackOnError: true })
      }
      return res.data

    } catch (error: any) {
      enqueueSnackbar('Something went wrong, please try again.', { variant: 'error' })
    }
  }

  const deleteCategory = async (value: Category) => {
    const _id = value._id

    try {
      const res = await axios.delete('/api/category', { data: { _id: _id } })
      if (data) mutate(
        data.filter(d => d._id !== _id),
        { rollbackOnError: true }
      )

      return true
    } catch (error: any) {
      enqueueSnackbar('Something went wrong, please try again.', { variant: 'error' })
      return false
    }
  }

  return (
    <CategoryContext.Provider
      value={{
        getCategories,
        upsertCategory,
        deleteCategory,
        data,
        error,
        isLoading,
        mutate
      }}
    >
      {children}
    </CategoryContext.Provider>
  )

}
