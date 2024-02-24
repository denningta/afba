import { categories } from "@/app/lib/mongodb"

export async function listCategories() {
  const res = await categories
    .find()
    .toArray()

  return res
}
