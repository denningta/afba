import { Category } from "../interfaces/categories";
import useData from "./useData";

export default function useCategories() {
  return useData<Category>({
    endpoint: {
      listRecords: '/api/categories',
      upsertRecord: '/api/category',
      deleteRecord: '/api.category'
    }
  })
}
