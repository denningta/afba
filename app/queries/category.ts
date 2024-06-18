import { Category } from "@/app/interfaces/categories";
import { categories } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

export async function listCategory(filter: Category) {
  const res = await categories
    .findOne(filter)

  return res
}

export async function replaceCategory(filter: Category, replacement: Category) {
  filter._id = new ObjectId(filter._id)

  const {
    _id,
    ...rest
  } = replacement

  const res = await categories
    .replaceOne(
      filter,
      rest,
    )

  return res
}

export async function insertCategory(category: Category) {
  const res = await categories
    .insertOne(category)

  return res
}

export async function deleteCategory(query: Category) {
  if (query._id) {
    query._id = new ObjectId(query._id)
  }
  const res = await categories
    .deleteOne(query)

  return res
}

