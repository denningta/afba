import Transaction from "@/app/interfaces/transaction"
import { useForm } from "react-hook-form"

export default function TransactionForm() {
  const {
    register
  } = useForm<Transaction>()

  return (
    <div>
    </div>
  )
}
