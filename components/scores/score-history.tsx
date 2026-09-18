"use client"

import * as React from "react"
import { Calendar, Edit, Trash2, Clock, Award, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatScoreDate } from "@/components/scores/score-card"
import type { Score } from "@/lib/scores/types"

interface ScoreHistoryProps {
  scores: Score[]
  canManage?: boolean
  onEdit: (score: Score) => void
  onDelete: (score: Score) => void
}

function formatRecordedAt(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return isoString
  }
}

export function ScoreHistory({ scores, canManage = true, onEdit, onDelete }: ScoreHistoryProps) {
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const totalPages = Math.ceil(scores.length / pageSize)
  const paginatedScores = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return scores.slice(start, start + pageSize)
  }, [scores, page, pageSize])

  if (scores.length === 0) {
    return null
  }

  return (
    <Card className="border-border/70 shadow-xs">
      <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-lg font-bold sm:text-xl">
              Complete Score History
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-semibold">
              {scores.length} round{scores.length > 1 ? "s" : ""} recorded
            </Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Chronological archive of all your Stableford rounds. Older rounds are preserved permanently.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6 sm:pt-0">
        {/* 1. Desktop & Tablet Table View (hidden on mobile) */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-40">Round Date</TableHead>
                <TableHead className="w-32.5">Score (Points)</TableHead>
                <TableHead className="w-35">Draw Pool Status</TableHead>
                <TableHead className="w-35">Recorded On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedScores.map((score, index) => {
                const globalIndex = (page - 1) * pageSize + index
                const isActiveFive = globalIndex < 5

                return (
                  <TableRow key={score.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>{formatScoreDate(score.score_date)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-foreground">
                          {score.score}
                        </span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isActiveFive ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-semibold"
                        >
                          <Award className="size-3 text-teal-600 dark:text-teal-400" />
                          Active 5 (#{globalIndex + 1})
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-muted-foreground text-[11px] font-normal"
                        >
                          <History className="size-3 text-muted-foreground" />
                          Historical
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span>{formatRecordedAt(score.created_at)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canManage}
                          onClick={() => canManage && onEdit(score)}
                          title={!canManage ? "Active membership required to edit scores" : undefined}
                          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Edit score of ${score.score_date}`}
                        >
                          <Edit className="size-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canManage}
                          onClick={() => canManage && onDelete(score)}
                          title={!canManage ? "Active membership required to delete scores" : undefined}
                          className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Delete score of ${score.score_date}`}
                        >
                          <Trash2 className="size-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* 2. Mobile Cards View (displayed only on < 640px) */}
        <div className="divide-y divide-border/60 sm:hidden">
          {paginatedScores.map((score, index) => {
            const globalIndex = (page - 1) * pageSize + index
            const isActiveFive = globalIndex < 5

            return (
              <div key={score.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="font-bold text-foreground">
                      {formatScoreDate(score.score_date)}
                    </span>
                  </div>
                  {isActiveFive ? (
                    <Badge
                      variant="outline"
                      className="border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[11px] font-semibold"
                    >
                      Active 5 (#{globalIndex + 1})
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                      Historical
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-foreground">
                      {score.score}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">Stableford pts</span>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    Logged: {formatRecordedAt(score.created_at)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canManage}
                    onClick={() => canManage && onEdit(score)}
                    title={!canManage ? "Active membership required to edit scores" : undefined}
                    className="h-8 gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canManage}
                    onClick={() => canManage && onDelete(score)}
                    title={!canManage ? "Active membership required to delete scores" : undefined}
                    className="h-8 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-0 sm:pt-4 border-t border-border/40 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, scores.length)} of {scores.length} rounds
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <span className="px-2 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
