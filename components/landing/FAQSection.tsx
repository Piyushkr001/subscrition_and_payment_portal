"use client"

import { HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function FAQSection() {
  const faqs = [
    {
      question: "What is ScoreKind?",
      answer:
        "ScoreKind is a purpose-driven subscription platform for golfers. Members track their latest 5 Stableford scores, participate in monthly prize draws with rollover jackpots, and direct at least 10% of their subscription fee toward a charity of their choice.",
    },
    {
      question: "How do my golf scores work in ScoreKind?",
      answer:
        "You enter individual round scores using standard Stableford points (ranging from 1 to 45). The system maintains your latest 5 rounds. As you play and log new rounds, your oldest scores roll off automatically, keeping your active participation set current with your actual game.",
    },
    {
      question: "How many scores do I need to be eligible for the monthly draw?",
      answer:
        "You need a complete set of 5 active Stableford scores recorded in your member dashboard by midnight prior to the 1st of each calendar month to qualify for that month's draw.",
    },
    {
      question: "How does the monthly draw and prize pool work?",
      answer:
        "Draws take place on the 1st of every month. There are three reward tiers: 3-Number Match (25% of pool), 4-Number Match (35% of pool), and 5-Number Match (40% of pool). If multiple members match the same tier, the pool for that tier is split evenly. If the 5-match jackpot is unclaimed, it rolls over to the following month.",
    },
    {
      question: "How much of my subscription goes to charity?",
      answer:
        "A minimum of 10% of every subscription fee is guaranteed to go to your chosen charitable partner. During sign-up or anytime within your dashboard, you can voluntarily increase your pledge to 15%, 25%, or more.",
    },
    {
      question: "Can I choose which charity receives my contribution?",
      answer:
        "Yes. You can select from our verified directory of registered non-profit organizations across youth sports, environmental conservation, disability access, and community health. You can also request to add new registered charities.",
    },
    {
      question: "Can I change my charity or contribution percentage later?",
      answer:
        "Yes, at any time. You can update your selected cause or modify your pledge percentage directly in your account settings, and changes take effect on your next billing cycle.",
    },
    {
      question: "What happens if I win a prize draw?",
      answer:
        "Winners receive an immediate dashboard notification and email confirmation following the audited draw. Payouts are credited directly to your registered bank account or wallet, and member impact summaries reflect your participation.",
    },
    {
      question: "Can I cancel or pause my membership?",
      answer:
        "Yes. You have complete control over your subscription. You can cancel, pause, or switch between monthly and annual plans at any time with no penalties or hidden fees.",
    },
  ]

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-muted/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center">
          <Badge
            variant="secondary"
            className="mb-4 gap-1.5 border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300"
          >
            <HelpCircle className="size-3 text-teal-600 dark:text-teal-400" />
            FREQUENTLY ASKED QUESTIONS
          </Badge>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Everything you need{" "}
            <span className="bg-linear-to-r from-teal-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-400 dark:to-teal-300">
              to know.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Honest, straightforward answers to the most common questions about
            ScoreKind scoring, prize draws, and charity pledges.
          </p>
        </div>

        {/* Accordion Component */}
        <div className="mt-12 rounded-2xl border border-border/80 bg-card p-4 sm:p-8 shadow-sm">
          <Accordion className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border-b border-border/60 py-2 last:border-b-0"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground text-sm sm:text-base hover:text-teal-700 dark:hover:text-teal-300">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
