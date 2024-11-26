import useSWR from "swr";
import { PotentialDuplicates } from "../queries/transactions";
import defaultFetcher from "@/app/lib/fetcher";

export default function useCheckDuplicates() {

  const url = "/api/check-data"


  const { data, error, isLoading } = useSWR<PotentialDuplicates[], Error>(
    url,
    defaultFetcher
  )

  return {
    data,
    error,
    isLoading
  }
}
