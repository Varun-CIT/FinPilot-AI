'use client'

import { useState, type FormEvent } from 'react'
import {
  ArrowUp,
  BookOpenText,
  FileSearch2,
  FileText,
  LoaderCircle,
  MessageSquareText,
  SearchCheck,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bubble,
  BubbleContent,
} from '@/components/ui/bubble'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Textarea } from '@/components/ui/textarea'
import { DemoBadge, PageHeader } from '@/components/finpilot/shared'
import { answerFundResearchQuestion, type ResearchReply } from '@/lib/finpilot-service'
import type { EvidenceItem } from '@/lib/finpilot-data'

type ChatTurn = {
  id: string
  role: 'user' | 'assistant'
  content: string
  evidence?: EvidenceItem[]
  insufficientEvidence?: boolean
  sourceLabel?: string
  welcome?: boolean
}

const suggestedQuestions = [
  'What investment objective is stated in the sample document?',
  'Who is the fund manager named in the document?',
  'Does the available file disclose a return or expense ratio?',
  'Which holdings are listed in the disclosed portfolio?',
]

const openingMessage: ChatTurn = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ask a question about the fictional sample source pack. I will keep retrieved text separate from the generated summary, and will say when the available material does not support an answer.',
  welcome: true,
}

function EvidenceCard({
  evidence,
  onOpen,
}: {
  evidence: EvidenceItem
  onOpen: (evidence: EvidenceItem) => void
}) {
  return (
    <article className="rounded-xl border border-border/80 bg-white p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-emerald/20 bg-emerald/5 text-[9px] font-semibold text-emerald-800">
          <SearchCheck data-icon="inline-start" /> Retrieved evidence
        </Badge>
        <Badge variant="secondary" className="text-[9px]">Page {evidence.page}</Badge>
      </div>
      <p className="mt-2.5 text-[11px] font-semibold text-navy">{evidence.documentName}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">{evidence.section}</p>
      <blockquote className="mt-2 border-l-2 border-emerald/40 pl-3 text-[11px] leading-5 text-slate-600">
        “{evidence.excerpt}”
      </blockquote>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-2 h-7 px-2 text-[10px] text-slate-600"
        onClick={() => onOpen(evidence)}
      >
        <BookOpenText data-icon="inline-start" />
        Open source in viewer
      </Button>
    </article>
  )
}

function AssistantTurn({
  turn,
  onOpenEvidence,
}: {
  turn: ChatTurn
  onOpenEvidence: (evidence: EvidenceItem) => void
}) {
  return (
    <Message align="start" className="items-start">
      <MessageAvatar className="mt-5 size-7 bg-navy text-white">
        <Sparkles aria-hidden="true" className="size-3.5" />
      </MessageAvatar>
      <MessageContent className="max-w-[92%]">
        <MessageHeader className="px-1 text-[10px]">
          FinPilot AI <span className="mx-1 text-slate-300">·</span> {turn.welcome ? 'Research workspace' : 'Generated summary'}
        </MessageHeader>
        <Bubble variant={turn.insufficientEvidence ? 'outline' : 'muted'} align="start" className="max-w-full">
          <BubbleContent className={`px-3.5 py-3 text-[11px] leading-5 ${turn.insufficientEvidence ? 'border-amber-200 bg-amber-50 text-amber-950' : ''}`}>
            {turn.content}
          </BubbleContent>
        </Bubble>
        {turn.evidence && turn.evidence.length > 0 && (
          <div className="mt-1 flex flex-col gap-2">
            <Marker variant="separator" className="text-[9px] font-semibold uppercase tracking-[0.1em]">
              <MarkerContent>Retrieved source evidence</MarkerContent>
            </Marker>
            {turn.evidence.map((evidence) => (
              <EvidenceCard
                key={`${evidence.documentName}-${evidence.page}-${evidence.section}`}
                evidence={evidence}
                onOpen={onOpenEvidence}
              />
            ))}
          </div>
        )}
        {!turn.welcome && turn.sourceLabel && (
          <MessageFooter className="px-1 text-[9px]">
            Source state: {turn.sourceLabel}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  )
}

function UserTurn({ turn }: { turn: ChatTurn }) {
  return (
    <Message align="end" className="items-start">
      <MessageAvatar className="mt-5 size-7 bg-emerald/10 text-[9px] font-semibold text-emerald-800">
        You
      </MessageAvatar>
      <MessageContent className="max-w-[78%]">
        <MessageHeader className="justify-end px-1 text-[10px]">Your question</MessageHeader>
        <Bubble variant="default" align="end">
          <BubbleContent className="px-3.5 py-2.5 text-[11px] leading-5">
            {turn.content}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  )
}

export function ResearchPage() {
  const [messages, setMessages] = useState<ChatTurn[]>([openingMessage])
  const [question, setQuestion] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function askQuestion(value: string) {
    const cleanQuestion = value.trim()
    if (!cleanQuestion || isPending) return

    const questionTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanQuestion,
    }
    setMessages((current) => [...current, questionTurn])
    setQuestion('')
    setSelectedEvidence(null)
    setIsPending(true)

    try {
      const response: ResearchReply = await answerFundResearchQuestion(cleanQuestion)
      const assistantTurn: ChatTurn = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.insufficientEvidence
          ? 'Insufficient evidence in the available documents.'
          : response.answer,
        evidence: response.evidence,
        insufficientEvidence: response.insufficientEvidence,
        sourceLabel: response.sourceLabel,
      }
      setMessages((current) => [...current, assistantTurn])
      if (response.evidence[0]) setSelectedEvidence(response.evidence[0])
    } catch (error) {
      toast.error('Research request failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: 'Insufficient evidence in the available documents.',
          insufficientEvidence: true,
          sourceLabel: 'The research service did not return a supported answer',
        },
      ])
    } finally {
      setIsPending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void askQuestion(question)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Document-grounded fund research"
        title="Fund research copilot"
        description="Ask about the available source pack and inspect exactly what was retrieved before using a summary."
        action={<DemoBadge />}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.34fr)_minmax(300px,0.66fr)]">
        <Card className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
          <CardHeader className="border-b border-border/70 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald/10 text-emerald-800">
                  <MessageSquareText aria-hidden="true" className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-[15px] font-semibold text-navy">Source-grounded conversation</CardTitle>
                  <CardDescription className="mt-1 text-[11px]">Fictional sample document set · no live fund data</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[9px] text-slate-600">
                <span className="mr-1.5 size-1.5 rounded-full bg-emerald" /> Demo source pack
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-0">
            <MessageScrollerProvider>
              <MessageScroller className="h-[390px] max-h-[390px] min-h-[390px] flex-none">
                <MessageScrollerViewport className="px-4 py-5 sm:px-6">
                  <MessageScrollerContent className="gap-5">
                    {messages.map((turn) => (
                      <MessageGroup key={turn.id}>
                        {turn.role === 'user' ? (
                          <UserTurn turn={turn} />
                        ) : (
                          <AssistantTurn
                            turn={turn}
                            onOpenEvidence={setSelectedEvidence}
                          />
                        )}
                      </MessageGroup>
                    ))}
                    {isPending && (
                      <MessageGroup>
                        <Message align="start" className="items-start">
                          <MessageAvatar className="mt-5 size-7 bg-navy text-white">
                            <Sparkles aria-hidden="true" className="size-3.5" />
                          </MessageAvatar>
                          <MessageContent>
                            <MessageHeader className="px-1 text-[10px]">Checking available evidence</MessageHeader>
                            <Bubble variant="muted">
                              <BubbleContent className="flex items-center gap-2 px-3.5 py-3 text-[11px] text-slate-600">
                                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                                Searching the demo source pack…
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageGroup>
                    )}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
              </MessageScroller>
            </MessageScrollerProvider>

            {messages.length === 1 && (
              <div className="px-4 sm:px-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">Try a sample question</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => void askQuestion(suggestion)}
                      className="h-auto min-h-8 whitespace-normal py-1.5 text-left text-[10px] font-medium"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t border-border/70 bg-slate-50/60 p-4 sm:px-6">
              <Field>
                <FieldLabel htmlFor="research-question" className="sr-only">Ask a question about the demo fund documents</FieldLabel>
                <div className="flex items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald/20">
                  <Textarea
                    id="research-question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask a question about a mutual fund…"
                    className="max-h-24 min-h-10 resize-none border-0 px-2 py-2 text-xs shadow-none focus-visible:ring-0"
                    rows={1}
                    disabled={isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!question.trim() || isPending}
                    aria-label="Send question"
                    className="shrink-0"
                  >
                    <ArrowUp />
                  </Button>
                </div>
              </Field>
              <p className="mt-2 flex items-center gap-1.5 text-[9px] leading-4 text-slate-500">
                <InfoIcon /> Answers are demo-only. Verify every citation against the source document.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="min-h-[360px] rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-[15px] font-semibold text-navy">Document viewer</CardTitle>
                  <CardDescription className="mt-1 text-[11px]">Selected source excerpt</CardDescription>
                </div>
                <FileSearch2 aria-hidden="true" className="size-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              {selectedEvidence ? (
                <div className="overflow-hidden rounded-xl border border-border/80 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-slate-50 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald/10 text-emerald-800">
                        <FileText aria-hidden="true" className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold text-navy">{selectedEvidence.documentName}</p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">Page {selectedEvidence.page} · {selectedEvidence.section}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[8px]">DEMO</Badge>
                  </div>
                  <div className="min-h-[250px] bg-[linear-gradient(to_bottom,transparent_31px,#e2e8f0_32px)] bg-[length:100%_32px] p-4">
                    <div className="mb-4 flex items-center justify-between text-[9px] uppercase tracking-[0.1em] text-slate-400">
                      <span>Sample source excerpt</span>
                      <span>p. {selectedEvidence.page}</span>
                    </div>
                    <p className="text-[11px] leading-8 text-slate-700">{selectedEvidence.excerpt}</p>
                    <div className="mt-5 border-t border-dashed border-slate-300 pt-3 text-[9px] leading-4 text-slate-400">
                      Synthetic page preview for interface demonstration. Not a real scheme document.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[275px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <BookOpenText aria-hidden="true" className="size-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-navy">No source selected</p>
                  <p className="mt-1.5 max-w-[220px] text-[10px] leading-4 text-muted-foreground">Supported responses will show the retrieved document and page here. Unsupported questions remain unanswered.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[13px] font-semibold text-navy">Evidence handling</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pb-4">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald/10 text-emerald-800"><SearchCheck aria-hidden="true" className="size-3.5" /></div>
                <p className="text-[10px] leading-4 text-slate-600"><span className="font-semibold text-navy">Retrieved evidence</span> is displayed verbatim from the fictional source pack.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Sparkles aria-hidden="true" className="size-3.5" /></div>
                <p className="text-[10px] leading-4 text-slate-600"><span className="font-semibold text-navy">Generated summary</span> is bounded by retrieved evidence; no evidence means no answer.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <p className="text-[10px] leading-4 text-slate-500">DEMO DATA · No live scheme documents, market data, returns, holdings, or expense ratios are available in this workspace.</p>
    </div>
  )
}

function InfoIcon() {
  return <span aria-hidden="true" className="flex size-3 items-center justify-center rounded-full border border-slate-400 text-[8px] font-semibold">i</span>
}
