import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

function Card({ className = '', ...props }: CardProps) {
  const classes =
    `rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()

  return <div className={classes} {...props} />
}

export default Card
