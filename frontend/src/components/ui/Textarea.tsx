import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

function Textarea({ className = '', rows = 4, ...props }: TextareaProps) {
  const classes = `field-base resize-y ${className}`.trim()

  return <textarea className={classes} rows={rows} {...props} />
}

export default Textarea
