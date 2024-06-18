import { Category } from "../interfaces/categories";
import useData from "./useData";

export default function useCategories() {

  const fns = useData<Category>({
    endpoint: {
      listRecords: '/api/categories',
      upsertRecord: '/api/category',
      deleteRecord: '/api/category'
    }
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
