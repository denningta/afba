// Thrown for non-2xx responses so SWR reports an error instead of treating
// an error body (or a failed JSON parse) as data.
export class FetchError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'FetchError'
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      // Empty or non-JSON error body - keep the status message.
    }
    throw new FetchError(message, res.status)
  }
  return res.json()
}

export default fetcher
