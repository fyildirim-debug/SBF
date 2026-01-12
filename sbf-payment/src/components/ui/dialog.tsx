"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const DialogContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

export const Dialog = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <DialogContext.Provider value={{ open: isOpen, onOpenChange: setIsOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
    const { onOpenChange } = React.useContext(DialogContext)
    return (
        <div onClick={(e) => { e.stopPropagation(); onOpenChange(true); }} className="cursor-pointer inline-flex">
            {children}
        </div>
    )
}

export const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { open, onOpenChange } = React.useContext(DialogContext)

    // Basit bir body scroll lock
    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [open])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />

            {/* Content */}
            <div className={cn(
                "relative z-10 grid w-full max-w-lg gap-4 border bg-white p-6 shadow-lg duration-200 animate-in fade-in zoom-in-95 rounded-lg",
                className
            )}>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Kapat</span>
                </button>
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
)

export const DialogTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
)

export const DialogDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
)
