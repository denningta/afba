"use client"

import React from "react";
import { Category } from "@/app/interfaces/categories";
import CategoryForm from "./CategoryForm";
import useCategories from "@/app/hooks/useCategories";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Ellipsis, Loader2Icon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogContent, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import { categoryTransactionsHref } from "@/app/helpers/helperFunctions";

interface EditCategoryProps {
  category: Category
}

export default function CategoryActions({
  category
}: EditCategoryProps) {
  const pathname = usePathname()
  const currentDate = pathname.split('/').pop()
  const [dialogMenu, setDialogMenu] = useState<string>('none')

  const { deleteRecord } = useCategories({ date: currentDate })

  const handleDialogMenu = (): React.JSX.Element | null => {
    switch (dialogMenu) {
      case "edit":
        return <EditDialog
          category={category}
          onClose={() => setDialogMenu('none')}
        />
      case "delete":
        return <DeleteDialog
          name={category.name}
          onSubmit={async () => {
            await deleteRecord(category)
            setDialogMenu('none')
          }}
          onClose={() => setDialogMenu('none')}
        />
      default:
        return null
    }
  }

  return (
    <Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label="Category actions"
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>

            {category._id && category.date &&
              <DropdownMenuItem asChild>
                <Link href={categoryTransactionsHref(category)}>
                  <SearchIcon /> View Transactions
                </Link>
              </DropdownMenuItem>
            }
            <DropdownMenuSeparator />

            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={() => setDialogMenu("edit")}>
                <PencilIcon /> Edit
              </DropdownMenuItem>
            </DialogTrigger>

            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={() => setDialogMenu("delete")}>
                <Trash2Icon /> Delete
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuGroup>

        </DropdownMenuContent>
      </DropdownMenu>
      {handleDialogMenu()}
    </Dialog>

  )
}

interface DeleteDialogProps {
  name?: string
  onSubmit: () => Promise<void>
  onClose: () => void
}

function DeleteDialog({ name, onSubmit, onClose }: DeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Delete {name ?? 'this category'}?</DialogTitle>
        <DialogDescription>
          This removes the category from this month&apos;s budget. Its transactions stay, but they&apos;ll no longer count toward it.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose()} disabled={deleting}>Cancel</Button>
        <Button
          variant="destructive"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true)
            try {
              await onSubmit()
            } finally {
              setDeleting(false)
            }
          }}
        >
          {deleting && <Loader2Icon className="animate-spin" />}
          Delete category
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}


interface EditDialogProps {
  category: Category
  onClose: () => void
}

function EditDialog({ category, onClose }: EditDialogProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit category</DialogTitle>
        <DialogDescription>
          Change the name, budgeted amount or type.
        </DialogDescription>
      </DialogHeader>
      <CategoryForm category={category} onSubmitted={() => onClose()} onCancel={() => onClose()} />
    </DialogContent>
  )
}
