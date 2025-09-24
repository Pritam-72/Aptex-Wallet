import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  uniColor?: boolean
  className?: string
}

export const Logo = ({ uniColor = false, className }: LogoProps) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="relative">
        <TrendingUp className={cn(
          "w-6 h-6",
          uniColor ? "text-white" : "text-primary"
        )} />
      </div>
      <span className={cn(
        "text-xl font-bold",
        uniColor ? "text-white" : "text-foreground"
      )}>
        CrypPal
      </span>
    </div>
  )
}
