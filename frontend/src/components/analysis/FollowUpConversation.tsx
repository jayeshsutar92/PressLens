import { type FC, type FormEvent, useState } from 'react'
import {
  BookOpen,
  Bot,
  CornerDownLeft,
  Flame,
  HelpCircle,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import type { ConversationMessage } from '../../types/analysis.ts'
import { analysisService } from '../../api/services/analysis.ts'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, LoadingSpinner } from '../common/index.ts'

export interface FollowUpConversationProps {
  analysisId: string
  initialMessages?: ConversationMessage[]
  scenarioTitle?: string
}

const PRESET_QUESTIONS = [
  'Why did the winger press the centre-back?',
  'What happens if the opponent bypasses the first pressing line?',
  'Which passing option was being blocked by the cover shadow?',
  'What tactical weakness does this pressing structure expose?',
]

let msgSequence = 0
function createMessageId(prefix: string): string {
  msgSequence += 1
  return `${prefix}_${msgSequence}`
}

function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

export const FollowUpConversation: FC<FollowUpConversationProps> = ({
  analysisId,
  initialMessages = [],
  scenarioTitle,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages)
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (queryText?: string) => {
    const textToSend = (queryText ?? question).trim()
    if (!textToSend || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    // Optimistic user message
    const tempUserMsg: ConversationMessage = {
      id: createMessageId('temp_user'),
      role: 'user',
      content: textToSend,
      created_at: getCurrentTimestamp(),
    }
    setMessages((prev) => [...prev, tempUserMsg])
    setQuestion('')

    try {
      const response = await analysisService.submitFollowUp(analysisId, {
        question: textToSend,
      })

      const assistantMsg: ConversationMessage = {
        id: createMessageId('turn_assistant'),
        role: 'assistant',
        content: response.answer,
        msg_metadata: {
          relevant_players_mentioned: response.relevant_players_mentioned,
          clarified_tactics: response.clarified_tactics,
          sources_cited: response.sources_cited,
        },
        created_at: response.created_at,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve follow-up answer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    void handleSubmit()
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            <MessageSquare size={20} color="var(--color-pitch)" />
            Contextual Tactical Q&amp;A
          </CardTitle>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Ask deep-dive questions referencing {scenarioTitle || 'the match scenario'} and AI pressing deductions.
          </span>
        </div>
        <Badge variant="tactical">Groq Llama 3.3 Memory</Badge>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Preset Inquiry Chips */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="var(--color-pitch)" />
              SUGGESTED FAN INQUIRIES:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PRESET_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="pl-btn pl-btn-ghost pl-btn-sm"
                  onClick={() => void handleSubmit(q)}
                  disabled={isSubmitting}
                  style={{
                    fontSize: '0.8125rem',
                    textAlign: 'left',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-default)',
                    padding: '6px 12px',
                    color: 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-pitch)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                >
                  <HelpCircle size={12} color="var(--color-pitch)" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation History Stream */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '480px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                No follow-up inquiries yet. Select a suggested question above or enter your own tactical query below.
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user'
                const meta = msg.msg_metadata as
                  | {
                      relevant_players_mentioned?: string[]
                      clarified_tactics?: string[]
                      sources_cited?: { document_title: string; relevance_score: number }[]
                    }
                  | undefined

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: isUser ? '85%' : '95%',
                      borderRadius: 'var(--radius-lg)',
                      padding: '14px 18px',
                      backgroundColor: isUser ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-canvas)',
                      border: isUser
                        ? '1px solid rgba(59, 130, 246, 0.3)'
                        : '1px solid var(--border-default)',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {isUser ? (
                        <>
                          <User size={14} color="#60a5fa" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#93c5fd' }}>
                            Fan Inquiry
                          </span>
                        </>
                      ) : (
                        <>
                          <Bot size={14} color="var(--color-pitch)" />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-pitch-light)' }}>
                            Tactical Assistant
                          </span>
                        </>
                      )}
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Metadata tags: Relevant Players and Clarified Tactics */}
                    {meta && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {meta.relevant_players_mentioned && meta.relevant_players_mentioned.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={10} /> Players:
                            </span>
                            {meta.relevant_players_mentioned.map((p, idx) => (
                              <Badge key={idx} variant="default" size="sm">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {meta.clarified_tactics && meta.clarified_tactics.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Flame size={10} /> Concepts:
                            </span>
                            {meta.clarified_tactics.map((t, idx) => (
                              <Badge key={idx} variant="tactical" size="sm">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {meta.sources_cited && meta.sources_cited.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <BookOpen size={10} /> Cited:
                            </span>
                            {meta.sources_cited.map((s, idx) => (
                              <Badge key={idx} variant="pitch" size="sm">
                                {s.document_title}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}

            {isSubmitting && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                }}
              >
                <LoadingSpinner size="sm" />
                <span>Evaluating follow-up against match scenario coordinates and tactical theory...</span>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.8125rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="pl-input"
                placeholder="Ask a tactical follow-up question (e.g. Which player initiated the trap?)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  paddingRight: '36px',
                  backgroundColor: 'var(--bg-canvas)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }}
              >
                <CornerDownLeft size={14} />
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!question.trim() || isSubmitting}
              icon={isSubmitting ? <LoadingSpinner size="sm" /> : <Send size={14} />}
            >
              Ask
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
