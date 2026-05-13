import type { ReactNode } from "react"

interface SectionHeadingProps {
  title: string
  description: string
  action?: ReactNode
}

export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && <div className="sm:ml-auto">{action}</div>}
    </div>
  )
}
