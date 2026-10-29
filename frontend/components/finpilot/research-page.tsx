'use client'

import { useState } from 'react'
import { FileSearch, Search, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState, ErrorState, PageHeader, RecordFields } from '@/components/finpilot/shared'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'
import { searchResearch } from '@/lib/finpilot-service'
import { firstNumber, firstString, isApiRecord, type ResearchSearchResponse } from '@/lib/finpilot-data'

export function ResearchPage() {
  const { researchStatus, researchStatusLoading, researchStatusError } = useFinPilot()
  const [question, setQuestion] = useState('')
  const [topK, setTopK] = useState('3')
  const [response, setResponse] = useState<ResearchSearchResponse | null>(null)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (question.trim().length < 3 || question.length > 500) {
      setError('Enter a question between 3 and 500 characters.')
      return
    }
    const parsedTopK = Number(topK)
    if (!Number.isInteger(parsedTopK) || parsedTopK < 1 || parsedTopK > 10) {
      setError('top_k must be an integer from 1 to 10.')
      return
    }
    setSearching(true)
    setError('')
    setResponse(null)
    try {
      setResponse(await searchResearch({ question: question.trim(), top_k: parsedTopK }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Research search failed.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Evidence-led research" title="Fund research copilot" description="Questions and evidence come from the FastAPI retrieval service. The interface does not generate fallback answers or citations." />

      <div className="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
        <Card className="h-fit border-border/80 shadow-sm shadow-emerald-950/[0.03]">
          <CardHeader><CardTitle className="text-base text-navy">Research service</CardTitle><p className="text-sm text-slate-600">Live status from GET /research/status.</p></CardHeader>
          <CardContent>
            {researchStatusError ? <ErrorState message={researchStatusError.message} /> : researchStatusLoading ? <p className="py-5 text-sm text-slate-500">Checking research index…</p> : isApiRecord(researchStatus) ? <RecordFields record={researchStatus} /> : <EmptyState icon={FileSearch} title="No index status returned" description="The research service did not return a status record." />}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
            <CardHeader><CardTitle className="text-base text-navy">Search indexed evidence</CardTitle><p className="text-sm text-slate-600">POST /research/search · request fields match ResearchRequest.</p></CardHeader>
            <CardContent>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="research-question">Question</FieldLabel>
                    <Textarea
                      id="research-question"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault()
                      }}
                      placeholder="Ask about a risk, fee, or disclosed feature in indexed source material."
                      maxLength={500}
                      minLength={3}
                      required
                      rows={3}
                    />
                    <FieldDescription>{question.length}/500 characters. Answers are limited to returned evidence.</FieldDescription>
                  </Field>
                  <Field className="max-w-xs">
                    <FieldLabel htmlFor="research-top-k">Evidence results (top_k)</FieldLabel>
                    <Input id="research-top-k" type="number" min="1" max="10" step="1" value={topK} onChange={(event) => setTopK(event.target.value)} />
                  </Field>
                </FieldGroup>
                {error && <ErrorState message={error} />}
                <Button type="submit" className="self-start" disabled={searching}>{searching ? 'Searching indexed sources…' : <><Search data-icon="inline-start" />Search evidence</>}</Button>
              </form>
            </CardContent>
          </Card>

          {response ? (
            <Card className="border-border/80 shadow-sm shadow-emerald-950/[0.03]">
              <CardHeader><CardTitle className="text-base text-navy">API response</CardTitle><p className="text-sm text-slate-600">{response.question ?? question}</p></CardHeader>
              <CardContent className="space-y-4">
                {response.insufficient_evidence && (
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>{response.message ?? 'The API marked the available evidence as insufficient.'}</p>
                  </div>
                )}
                {!response.insufficient_evidence && response.message && <p className="rounded-xl bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">{response.message}</p>}
                {!response.results ? (
                  <div className="space-y-3 rounded-xl border border-border/70 bg-slate-50 p-4">
                    <p className="text-sm leading-6 text-slate-600">The OpenAPI response does not define evidence fields. Showing the payload returned by FastAPI without inventing a response shape.</p>
                    <RecordFields record={response} />
                  </div>
                ) : response.results.length === 0 ? (
                  <EmptyState icon={FileSearch} title="No evidence returned" description={response.message ?? 'The API returned no matching evidence for this question.'} />
                ) : (
                  <div className="space-y-3">
                    {response.results.map((result, index) => {
                      const source = firstString(result, 'source')
                      const page = firstNumber(result, 'page')
                      const similarity = firstNumber(result, 'similarity')
                      const text = firstString(result, 'text')
                      return (
                        <article key={`${source ?? 'source'}-${page ?? index}`} className="rounded-xl border border-border/70 bg-white p-4">
                          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-navy">{source ?? 'Source not returned'}</span>
                            {page !== undefined && <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">Page {page}</span>}
                            {similarity !== undefined && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">Similarity {similarity}</span>}
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{text ?? 'The API did not return a text field for this result.'}</p>
                        </article>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={FileSearch} title="Evidence appears here" description="Submit a question to receive the exact evidence returned by the FastAPI search endpoint." />
          )}
        </div>
      </div>
    </div>
  )
}
