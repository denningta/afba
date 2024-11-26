import { getPotentialDuplicates } from '@/app/queries/transactions'

export async function GET() {
  try {
    const response = await getPotentialDuplicates()

    return Response.json(response)

  } catch (error: any) {
    throw new Error(error)
  }
}
