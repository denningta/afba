import Transaction from "@/app/interfaces/transaction"
import useCategories from "@/app/hooks/useCategories"
import { ReactSearchAutocomplete } from 'react-search-autocomplete'
import { Category } from "@/app/interfaces/categories"

export interface SelectCategoryProps {
  transaction: Transaction
}

const categories: Category[] = [
  {
    name: 'Test1'
  },
  {
    name: 'Test2'
  }

]


const SelectCategory = ({ transaction }: SelectCategoryProps) => {
  const {
    listRecords
  } = useCategories()


  return (
    <div>test</div>

  )

}

const SelectCategoryForm = () => {

  return (
    <div>
      test
    </div>
  )

}

export default SelectCategory
