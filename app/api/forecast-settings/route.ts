export const dynamic = 'force-dynamic'

import { getForecastSettings, saveForecastSettings } from "@/app/queries/forecast"
import { ForecastSettings } from "@/app/interfaces/forecast"

export async function GET(request: Request) {
  const account_id = new URL(request.url).searchParams.get('account_id')
  if (!account_id) return Response.json({ message: 'account_id is required' }, { status: 400 })
  return Response.json(await getForecastSettings(account_id))
}

export async function POST(request: Request) {
  try {
    const { account_id, cushion } = await request.json() as ForecastSettings
    if (!account_id) return Response.json({ message: 'account_id is required' }, { status: 400 })
    if (typeof cushion !== 'number' || !isFinite(cushion) || cushion < 0) {
      return Response.json({ message: 'cushion must be zero or more' }, { status: 400 })
    }
    await saveForecastSettings({ account_id, cushion: Math.round(cushion * 100) / 100 })
    return Response.json({ ok: true })
  } catch (error: any) {
    return Response.json({ message: error?.message ?? 'Failed to save settings' }, { status: 500 })
  }
}
