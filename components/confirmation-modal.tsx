"use client"

import { AlertTriangleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ConfirmationModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-5 text-left shadow-xl">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
