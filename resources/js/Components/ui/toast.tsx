import * as React from "react"
import { useToast } from "@/hooks/use-toast"

interface ToastProps {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  onOpenChange?: (open: boolean) => void
}

const Toast = ({ id, title, description, variant = "default", onOpenChange }: ToastProps) => {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    onOpenChange?.(false)
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, 5000) // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  const baseClasses = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 transition-all duration-300"
  const variantClasses = variant === "destructive" 
    ? "border-red-200 bg-red-50" 
    : "border-gray-200 bg-white"

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <div className={`font-semibold text-sm mb-1 ${variant === "destructive" ? "text-red-800" : "text-gray-900"}`}>
              {title}
            </div>
          )}
          {description && (
            <div className={`text-sm ${variant === "destructive" ? "text-red-700" : "text-gray-600"}`}>
              {description}
            </div>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`ml-3 text-sm font-medium ${variant === "destructive" ? "text-red-500 hover:text-red-700" : "text-gray-400 hover:text-gray-600"}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export const Toaster = () => {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onOpenChange={toast.onOpenChange}
        />
      ))}
    </>
  )
}

export { Toast }
