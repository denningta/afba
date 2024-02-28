'use client'

import { ReactNode } from "react"
import { ConfirmationDialogProvider } from "./Dialog"

interface DialogProviderProps {
  children: ReactNode
}

export default function DialogProvider({ children }: DialogProviderProps) {
  return (
    <ConfirmationDialogProvider>
      {children}
    </ConfirmationDialogProvider>
  )
}
