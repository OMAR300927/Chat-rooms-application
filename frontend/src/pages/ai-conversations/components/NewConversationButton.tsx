import { Plus } from 'lucide-react'
import Button from '../../../components/ui/Button'

type NewConversationButtonProps = {
  onClick: () => void
  className?: string
}

function NewConversationButton({
  onClick,
  className = '',
}: NewConversationButtonProps) {
  return (
    <Button
      className={`w-full justify-center transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${className}`}
      onClick={onClick}
      variant="secondary"
    >
      <Plus aria-hidden="true" size={17} />
      <span>New conversation</span>
    </Button>
  )
}

export default NewConversationButton
