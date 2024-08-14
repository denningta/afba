import axios from "axios";
import { Category } from "../interfaces/categories";
import useData from "./useData";
import { CategoriesQuery } from "../queries/categories";
import _ from "lodash";


export default function useCategories(query?: CategoriesQuery) {

  const urlParams = query ? Object.keys(query).reduce((acc, curr, i) => {
    if (!query) return ''
    if (i > 0) acc.concat('&')
    return acc.concat(curr + '=' + query[curr as keyof typeof query])
  }, '?') : ''

  const fns = useData<Category, CategoriesQuery>({
    endpoint: {
      listRecords: `/api/categories${urlParams}`,
      upsertRecord: `/api/category${urlParams}`,
      deleteRecord: `/api/category${urlParams}`,
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
