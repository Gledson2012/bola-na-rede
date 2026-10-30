import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-[5.75rem] left-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full border px-4 py-2 text-center text-[11px] font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200",
        variant === "default"
          ? "border-foreground/10 bg-foreground text-background"
          : "border-destructive bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    />
  )
)
Toast.displayName = "Toast"

export const ToastTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  )
)
ToastTitle.displayName = "ToastTitle"
