import { type FC } from 'react'
import { Link } from 'react-router-dom'
import { Home, ShieldAlert } from 'lucide-react'
import { Button, EmptyState } from '../../components/common/index.ts'

export const NotFoundPage: FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <EmptyState
        icon={<ShieldAlert size={32} color="var(--color-danger)" />}
        title="404 - Pitch Zone Not Found"
        description="The tactical route or match scenario you are looking for does not exist."
        action={
          <Link to="/">
            <Button variant="primary" icon={<Home size={16} />}>
              Back to Dashboard
            </Button>
          </Link>
        }
      />
    </div>
  )
}
