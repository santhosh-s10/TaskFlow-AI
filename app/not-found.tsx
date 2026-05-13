import Link from "next/link"
import { ArrowLeftIcon, SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg shadow-sm">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-md border bg-background text-primary">
            <SearchXIcon className="size-7" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">404</p>
            <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or may have been moved.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
