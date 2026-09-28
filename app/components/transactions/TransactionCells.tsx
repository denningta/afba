import Image from "next/image"
import { toCurrency } from "@/app/helpers/helperFunctions"
import { cn } from "@/lib/utils"

// Plaid amounts are positive for money out. Show income as a green "+$X" and
// spending as a plain "$X".
export function Amount({ value, className }: { value: number, className?: string }) {
  const income = value < 0
  return (
    <span className={cn("font-medium tabular-nums", income && "text-positive", className)}>
      {income ? '+' : ''}{toCurrency(Math.abs(value))}
    </span>
  )
}

// 24px logo, or a letter placeholder so names line up either way.
export function MerchantLogo({ src, name }: { src?: string | null, name: string }) {
  if (src) {
    return <Image src={src} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full" />
  }
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {name.charAt(0).toUpperCase() || '?'}
    </span>
  )
}
