import { HeartHandshake, ShieldCheck } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardCharityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Charity Preference
        </h1>
        <p className="text-sm text-muted-foreground">
          Select the verified charity that receives at least 10% of your
          ScoreKind subscription.
        </p>
      </div>

      <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs font-medium text-teal-800 dark:text-teal-300 flex items-center gap-2">
        <ShieldCheck className="size-4 shrink-0 text-teal-600 dark:text-teal-400" />
        <span>
          Enforced by PostgreSQL constraint: minimum 10% contribution up to 100%.
        </span>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Selected Cause</CardTitle>
          <CardDescription>
            Your current nominated charity partner.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <HeartHandshake className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No charity selected</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Charity partner directory and selection will be unlocked once active
            charity listings are published.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
