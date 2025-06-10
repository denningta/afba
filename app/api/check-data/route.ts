import { getPotentialDuplicates } from '@/app/queries/transactions'

export async function GET(request: Request) {
  console.log(request.url) // force route to be dynamic and skip pre-rendering
  try {
    const response = await getPotentialDuplicates()

    return Response.json(response)

  } catch (error: any) {
    throw new Error(error)
  }
}
