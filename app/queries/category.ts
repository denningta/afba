import { Category } from "@/app/interfaces/categories";
import { categories } from "@/app/lib/mongodb";

export async function listCategory(filter: Category) {
  const res = await categories
    .findOne(filter)

  return res
}

export async function upsertCategory(filter: Category, replacement: Category) {
  const res = await categories
    .findOneAndReplace(filter, replacement, { upsert: true })

  return res
}

export async function deleteCategory(query: Category) {
  const res = await categories
    .deleteOne(query)

  return res
}
