"use client"

import { useState, useTransition, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  HeartHandshake,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Coins,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  charityAdminSchema,
  type CharityAdminInput,
} from "@/lib/validators/charity"
import {
  adminSaveCharityAction,
  adminToggleCharityStatusAction,
  adminToggleCharityFeaturedAction,
  adminDeleteCharityAction,
  adminUploadCharityMediaAction,
} from "@/lib/charities/actions"
import type { AdminCharityItem } from "@/lib/charities/queries"
import type { CharityStatus } from "@/types/database"

interface AdminCharitiesClientProps {
  initialCharities: AdminCharityItem[]
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function AdminCharitiesClient({
  initialCharities,
}: AdminCharitiesClientProps) {
  const [charities, setCharities] = useState<AdminCharityItem[]>(initialCharities)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()

  // Form Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCharity, setEditingCharity] = useState<AdminCharityItem | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [charityToDelete, setCharityToDelete] = useState<AdminCharityItem | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CharityAdminInput>({
    resolver: zodResolver(charityAdminSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      websiteUrl: "",
      logoUrl: "",
      coverUrl: "",
      status: "active",
      featured: false,
    },
  })

  const formLogoUrl = watch("logoUrl")
  const formCoverUrl = watch("coverUrl")
  const formStatus = watch("status")
  const formFeatured = watch("featured")

  // Auto-fill slug if adding new charity
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setValue("name", val, { shouldValidate: true })
    if (!editingCharity) {
      setValue("slug", generateSlug(val), { shouldValidate: true })
    }
  }

  const openCreateDialog = () => {
    setEditingCharity(null)
    reset({
      name: "",
      slug: "",
      description: "",
      websiteUrl: "",
      logoUrl: "",
      coverUrl: "",
      status: "active",
      featured: false,
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  const openEditDialog = (charity: AdminCharityItem) => {
    setEditingCharity(charity)
    reset({
      name: charity.name,
      slug: charity.slug,
      description: charity.description || "",
      websiteUrl: charity.website_url || "",
      logoUrl: charity.logo_url || "",
      coverUrl: charity.cover_url || "",
      status: charity.status,
      featured: charity.featured,
    })
    setFeedback(null)
    setDialogOpen(true)
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "cover"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const setter = type === "logo" ? setUploadingLogo : setUploadingCover
    setter(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const res = await adminUploadCharityMediaAction(formData)
      if (res.success && res.data?.url) {
        if (type === "logo") {
          setValue("logoUrl", res.data.url, { shouldValidate: true })
        } else {
          setValue("coverUrl", res.data.url, { shouldValidate: true })
        }
      } else {
        alert(res.error || "Media upload failed.")
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Media upload error.")
    } finally {
      setter(false)
    }
  }

  const onSaveCharity = (data: CharityAdminInput) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await adminSaveCharityAction({
        ...data,
        id: editingCharity?.id,
      })

      if (res.success) {
        setDialogOpen(false)
        // Refresh local state
        setCharities((prev) => {
          if (editingCharity) {
            return prev.map((c) =>
              c.id === editingCharity.id
                ? {
                    ...c,
                    name: data.name,
                    slug: data.slug,
                    description: data.description || null,
                    website_url: data.websiteUrl || null,
                    logo_url: data.logoUrl || null,
                    cover_url: data.coverUrl || null,
                    status: data.status as CharityStatus,
                    featured: data.featured,
                  }
                : c
            )
          } else {
            const newCharity: AdminCharityItem = {
              id: res.data?.id || crypto.randomUUID(),
              name: data.name,
              slug: data.slug,
              description: data.description || null,
              website_url: data.websiteUrl || null,
              logo_url: data.logoUrl || null,
              cover_url: data.coverUrl || null,
              status: data.status as CharityStatus,
              featured: data.featured,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              totalAllocationsCount: 0,
              totalAllocatedAmount: 0,
              activeSubscribersCount: 0,
            }
            return [newCharity, ...prev]
          }
        })
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save charity.",
        })
      }
    })
  }

  const handleToggleStatus = (charity: AdminCharityItem, newStatus: CharityStatus) => {
    startTransition(async () => {
      const res = await adminToggleCharityStatusAction(charity.id, newStatus)
      if (res.success) {
        setCharities((prev) =>
          prev.map((c) => (c.id === charity.id ? { ...c, status: newStatus } : c))
        )
      } else {
        alert(res.error || "Failed to update status.")
      }
    })
  }

  const handleToggleFeatured = (charity: AdminCharityItem) => {
    const nextFeatured = !charity.featured
    startTransition(async () => {
      const res = await adminToggleCharityFeaturedAction(charity.id, nextFeatured)
      if (res.success) {
        setCharities((prev) =>
          prev.map((c) => (c.id === charity.id ? { ...c, featured: nextFeatured } : c))
        )
      } else {
        alert(res.error || "Failed to update featured flag.")
      }
    })
  }

  const confirmDelete = () => {
    if (!charityToDelete) return
    startTransition(async () => {
      const res = await adminDeleteCharityAction(charityToDelete.id)
      if (res.success) {
        setCharities((prev) => prev.filter((c) => c.id !== charityToDelete.id))
        setDeleteDialogOpen(false)
        setCharityToDelete(null)
      } else {
        alert(res.error || "Cannot delete charity.")
      }
    })
  }

  // Filtered Charities
  const filteredCharities = useMemo(() => {
    return charities.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [charities, searchQuery, statusFilter])

  // Stats
  const stats = useMemo(() => {
    const total = charities.length
    const active = charities.filter((c) => c.status === "active").length
    const featured = charities.filter((c) => c.featured).length
    const totalAllocated = charities.reduce((sum, c) => sum + c.totalAllocatedAmount, 0)
    return { total, active, featured, totalAllocated }
  }, [charities])

  return (
    <div className="space-y-8">
      {/* Top Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Charities</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <HeartHandshake className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Causes</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.active}
              </h3>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Featured Causes</p>
              <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                {stats.featured}
              </h3>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Sparkles className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Allocations</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">
                ₹{stats.totalAllocated.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Coins className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar: Search, Status Filter, Create Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search charities by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-36 h-10 rounded-xl text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={openCreateDialog}
          className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-medium text-xs h-10 shadow-xs"
        >
          <Plus className="mr-1.5 size-4" />
          <span>Add New Charity</span>
        </Button>
      </div>

      {/* Charities Roster Table */}
      <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">Partner</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Featured</TableHead>
              <TableHead className="text-xs font-semibold">Subscribers</TableHead>
              <TableHead className="text-xs font-semibold">Allocated</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCharities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  No charities found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredCharities.map((charity) => (
                <TableRow key={charity.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background overflow-hidden text-muted-foreground">
                        {charity.logo_url ? (
                          <Image
                            src={charity.logo_url}
                            alt={charity.name}
                            width={40}
                            height={40}
                            className="size-full object-cover"
                          />
                        ) : (
                          <Building2 className="size-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-foreground">
                          {charity.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          /{charity.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Select
                      value={charity.status}
                      onValueChange={(val) =>
                        handleToggleStatus(charity, val as CharityStatus)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-28 h-7 text-[11px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(charity)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        charity.featured
                          ? "bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Sparkles className="size-3" />
                      <span>{charity.featured ? "Featured" : "Regular"}</span>
                    </button>
                  </TableCell>

                  <TableCell className="text-xs font-medium">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{charity.activeSubscribersCount}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-bold text-foreground">
                    ₹{charity.totalAllocatedAmount.toLocaleString("en-IN")}
                    <span className="text-[10px] font-normal text-muted-foreground block">
                      {charity.totalAllocationsCount} invoices
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/charities/${charity.slug}`} target="_blank" />}
                        title="View Public Profile"
                        className="size-7 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="size-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(charity)}
                        title="Edit Charity"
                        className="size-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="size-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setCharityToDelete(charity)
                          setDeleteDialogOpen(true)
                        }}
                        title="Delete or Deactivate"
                        className="size-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Charity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCharity ? `Edit ${editingCharity.name}` : "Add Partner Charity"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure partner charity details, status, and media assets.
            </DialogDescription>
          </DialogHeader>

          {feedback && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSaveCharity)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Charity Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Charity Name *
                </label>
                <Input
                  {...register("name")}
                  onChange={handleNameChange}
                  placeholder="e.g. First Tee Youth Athletics"
                  className="text-xs h-9"
                />
                {errors.name && (
                  <p className="text-[11px] text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Unique Slug *
                </label>
                <Input
                  {...register("slug")}
                  placeholder="e.g. first-tee-youth-athletics"
                  className="text-xs h-9 font-mono"
                />
                {errors.slug && (
                  <p className="text-[11px] text-destructive">{errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Mission Description
              </label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Describe the organization's mission, community reach, and core programs..."
                className="text-xs resize-none"
              />
              {errors.description && (
                <p className="text-[11px] text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Website URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Website URL
              </label>
              <Input
                {...register("websiteUrl")}
                placeholder="https://examplecharity.org"
                className="text-xs h-9"
              />
              {errors.websiteUrl && (
                <p className="text-[11px] text-destructive">{errors.websiteUrl.message}</p>
              )}
            </div>

            {/* Media Uploads */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Logo Asset</label>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background overflow-hidden text-muted-foreground">
                    {formLogoUrl ? (
                      <Image
                        src={formLogoUrl}
                        alt="Logo Preview"
                        width={48}
                        height={48}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Building2 className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium hover:bg-muted">
                      <Upload className="size-3" />
                      <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "logo")}
                        disabled={uploadingLogo}
                      />
                    </label>
                    <Input
                      {...register("logoUrl")}
                      placeholder="Or enter image URL"
                      className="text-[11px] h-7"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Cover Banner</label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background overflow-hidden text-muted-foreground">
                    {formCoverUrl ? (
                      <Image
                        src={formCoverUrl}
                        alt="Cover Preview"
                        width={64}
                        height={48}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Building2 className="size-5" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium hover:bg-muted">
                      <Upload className="size-3" />
                      <span>{uploadingCover ? "Uploading..." : "Upload Banner"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "cover")}
                        disabled={uploadingCover}
                      />
                    </label>
                    <Input
                      {...register("coverUrl")}
                      placeholder="Or enter image URL"
                      className="text-[11px] h-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Featured */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Listing Status</label>
                <Select
                  value={formStatus}
                  onValueChange={(val) => setValue("status", val as CharityStatus)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Eligible for giving)</SelectItem>
                    <SelectItem value="draft">Draft (Admin preview only)</SelectItem>
                    <SelectItem value="inactive">Inactive (Archived)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={formFeatured}
                  onChange={(e) => setValue("featured", e.target.checked)}
                  className="size-4 rounded-sm border-border text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="featured-check" className="text-xs font-semibold cursor-pointer">
                  Feature on Directory & Landing Highlights
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              >
                {isPending ? "Saving..." : editingCharity ? "Update Charity" : "Create Charity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete / Deactivate Confirmation Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Remove or Deactivate Charity?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              Are you sure you want to remove &quot;{charityToDelete?.name}&quot;?
              <br />
              <br />
              <strong>Note:</strong> If members have saved preferences or historical contribution
              allocations linked to this charity, PostgreSQL foreign-key constraints will prevent
              permanent deletion to preserve financial audit history. In that case, switch the
              status to <strong>Inactive</strong> instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
