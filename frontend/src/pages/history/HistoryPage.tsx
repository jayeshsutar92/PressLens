import { type FC } from 'react'
import { Link } from 'react-router-dom'
import { History, Zap } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from '../../components/common/index.ts'

export const HistoryPage: FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Analysis History
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review previously generated pressing analyses and ongoing follow-up discussions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <History size={18} color="var(--color-pitch)" />
            Recent Sessions
          </CardTitle>
          <CardDescription>Sessions stored in PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<History size={24} />}
            title="Session Archive"
            description="When analyses are run against match scenarios, they will be archived here along with follow-up threads."
            action={
              <Link to="/scenarios">
                <Button variant="primary" icon={<Zap size={14} />}>
                  Start an Analysis
                </Button>
              </Link>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
