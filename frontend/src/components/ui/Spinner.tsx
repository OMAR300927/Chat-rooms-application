import type { HTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'

type SpinnerSize = 'small' | 'medium' | 'large'

type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  label?: string
  size?: SpinnerSize
}

const iconSizes: Record<SpinnerSize, number> = {
  small: 16,
  medium: 24,
  large: 36,
}

function Spinner({
  className = '',
  label = 'Loading',
  size = 'medium',
  ...props
}: SpinnerProps) {
  return (
    <span
      aria-label={label}
      className={`inline-flex ${className}`.trim()}
      role="status"
      {...props}
    >
      <LoaderCircle
        aria-hidden="true"
        className="animate-spin"
        size={iconSizes[size]}
      />
    </span>
  )
}

export default Spinner
