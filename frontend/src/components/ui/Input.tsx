import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

function Input({ className = '', ...props }: InputProps) {
  const classes = `field-base ${className}`.trim()

  return <input className={classes} {...props} />
}

export default Input
