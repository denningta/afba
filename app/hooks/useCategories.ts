import axios from "axios";
import { Category } from "../interfaces/categories";
import useData from "./useData";
import { CategoriesQuery } from "../queries/categories";


export default function useCategories(query?: CategoriesQuery) {

  const fns = useData<Category, CategoriesQuery>({
    endpoint: {
      listRecords: '/api/categories',
      upsertRecord: '/api/category',
      deleteRecord: '/api/category'
    },
    query: query
  })


  return {
    ...fns,
    upsertRecord: ({
      spent,
      transactions,
      ...category
    }: Category) => fns.upsertRecord(category)
  }
}
