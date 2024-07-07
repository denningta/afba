import axios from "axios";
import { Category } from "../interfaces/categories";
import useData from "./useData";
import { CategoriesQuery } from "../queries/categories";


export default function useCategories(query?: CategoriesQuery) {
  const { date } = query ?? {}

  const fns = useData<Category>({
    endpoint: {
      listRecords: `/api/categories${'?' + 'date=' + date}`,
      upsertRecord: '/api/category',
      deleteRecord: '/api/category'
    },
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
