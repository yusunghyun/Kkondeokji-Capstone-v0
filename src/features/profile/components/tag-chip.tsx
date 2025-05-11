import { cn } from "@/shared/utils/cn"

interface TagChipProps {
  label: string
  icon?: string
  className?: string
}

export function TagChip({ label, icon, className }: TagChipProps) {
  return (
    <div
      className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary", className)}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </div>
  )
}
