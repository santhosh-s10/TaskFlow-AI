import Link from "next/link"
import { CheckCheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-foreground text-background shadow-sm",
        className
      )}
    >
      <CheckCheckIcon className="size-4" />
    </div>
  )
}

export function BrandLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 self-center font-semibold">
      <BrandMark />
      <span>TaskFlow AI</span>
    </Link>
  )
}
