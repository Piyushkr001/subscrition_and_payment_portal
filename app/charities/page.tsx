import Link from "next/link"
import { HeartHandshake, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CharitiesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <div className="mx-auto max-w-3xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
          <HeartHandshake className="size-4 text-teal-600 dark:text-teal-400" />
          <span>Guaranteed 10%+ Impact</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Partner Charities
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          With ScoreKind, playing golf creates lasting impact. A minimum of 10%
          of every monthly subscription is directly donated to your chosen
          charity partner.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-lg">
            <ShieldCheck className="size-5 text-teal-600 dark:text-teal-400" />
            <span>Verified Cause Directory Coming Soon</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Our team is actively onboarding accredited charitable organizations
            dedicated to youth athletics, cancer research, mental health, and
            veteran support.
          </p>
        </div>

        <Button
          render={<Link href="/signup" />}
          className="shrink-0 rounded-full px-6 shadow-sm"
        >
          <span>Join ScoreKind</span>
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Youth Golf & Athletics",
            desc: "Providing access, equipment, and coaching for underprivileged juniors discovering the game of golf.",
          },
          {
            title: "Cancer Research & Support",
            desc: "Funding pioneering medical research and compassionate patient care programs.",
          },
          {
            title: "Veteran Well-Being",
            desc: "Supporting physical therapy, mental health, and community reintegration for military veterans through golf.",
          },
        ].map((item, idx) => (
          <Card key={idx} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="text-xs">
                Verified Cause Category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
