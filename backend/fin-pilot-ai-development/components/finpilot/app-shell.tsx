'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  Gauge,
  History,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DemoBadge } from '@/components/finpilot/shared'

const navigation = [
  { label: 'Dashboard', href: '/', icon: Gauge, group: 'Workspace' },
  { label: 'Investor Profiles', href: '/investors', icon: Users, group: 'Workspace' },
  { label: 'Risk Assessment', href: '/risk-assessment', icon: ShieldCheck, group: 'Workspace' },
  { label: 'Goal Planner', href: '/goal-planner', icon: Target, group: 'Workspace' },
  { label: 'Fund Research Copilot', href: '/fund-research', icon: FileSearch, group: 'Intelligence' },
  { label: 'Recommendations', href: '/recommendations', icon: Sparkles, group: 'Intelligence' },
  { label: 'Adviser Review', href: '/adviser-review', icon: ClipboardCheck, group: 'Governance' },
  { label: 'Audit Trail', href: '/audit-trail', icon: History, group: 'Governance' },
]

const pageTitles = Object.fromEntries(navigation.map((item) => [item.href, item.label]))

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald text-white shadow-[0_5px_18px_rgba(16,185,129,0.22)]">
        <Activity aria-hidden="true" className="size-[19px]" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[16px] font-semibold tracking-[-0.04em] text-white">
          FinPilot <span className="text-emerald">AI</span>
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">Smarter Advice. Clearer Reasons.</p>
      </div>
    </div>
  )
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const groups = ['Workspace', 'Intelligence', 'Governance']

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 pb-3 pt-5">
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              {group}
            </p>
            <nav aria-label={`${group} navigation`} className="flex flex-col gap-1">
              {navigation
                .filter((item) => item.group === group)
                .map(({ label, href, icon: Icon }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-white/[0.085] text-white ring-1 ring-inset ring-white/[0.08]'
                          : 'text-slate-300 hover:bg-white/[0.055] hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-emerald" />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={`size-[17px] shrink-0 ${active ? 'text-emerald' : 'text-slate-400 group-hover:text-slate-200'}`}
                        strokeWidth={1.8}
                      />
                      <span className="truncate">{label}</span>
                    </Link>
                  )
                })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.08] p-4">
        <div className="rounded-xl border border-white/[0.09] bg-white/[0.045] p-3.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald" aria-hidden="true" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
              Demo workspace
            </p>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Fictional records only. Changes stay in this session.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between px-1 text-[10px] text-slate-500">
          <span>FinPilot AI</span>
          <span>Preview build</span>
        </div>
      </div>
    </>
  )
}

function NotificationMenu() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open notifications"
            className="relative text-slate-600 hover:bg-slate-100 hover:text-navy"
          />
        }
      >
        <Bell aria-hidden="true" />
        <span className="absolute right-[9px] top-[8px] size-1.5 rounded-full border border-white bg-emerald" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[330px] p-0">
        <div className="border-b px-4 py-3">
          <PopoverHeader>
            <PopoverTitle className="text-sm text-navy">Notifications</PopoverTitle>
            <p className="text-xs text-muted-foreground">Demo workspace updates</p>
          </PopoverHeader>
        </div>
        <div className="flex flex-col">
          <div className="flex gap-3 border-b px-4 py-3.5">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
            <div>
              <p className="text-xs font-medium text-navy">3 proposals need a review</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                Review the fictional draft queue before taking action.
              </p>
            </div>
          </div>
          <div className="flex gap-3 px-4 py-3.5">
            <span className="mt-1 size-2 shrink-0 rounded-full bg-emerald" />
            <div>
              <p className="text-xs font-medium text-navy">Demo evidence pack is ready</p>
              <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                One synthetic scheme excerpt is available for research walkthroughs.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t px-4 py-3">
          <Link
            href="/adviser-review"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Open review queue <ChevronRight aria-hidden="true" className="ml-1 inline size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const title = pageTitles[pathname] ?? 'Workspace'

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-white/[0.08] bg-navy text-white lg:flex">
        <div className="flex h-[76px] items-center border-b border-white/[0.08] px-5">
          <Brand />
        </div>
        <NavigationContent />
      </aside>

      <div className="min-h-screen lg:pl-[252px]">
        <header className="sticky top-0 z-20 h-[68px] border-b border-border/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="shrink-0 text-slate-600 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu aria-hidden="true" />
                </Button>
                <SheetContent side="left" className="w-[280px] border-white/10 bg-navy p-0 text-white sm:max-w-[280px]">
                  <SheetHeader className="h-[76px] justify-center border-b border-white/[0.08] px-5 py-0">
                    <SheetTitle className="text-left text-white">
                      <Brand />
                    </SheetTitle>
                  </SheetHeader>
                  <NavigationContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <span>Workspace</span>
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </div>
              <h2 className="truncate text-sm font-semibold text-navy">{title}</h2>
              <div className="hidden sm:block">
                <DemoBadge />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-border/80 bg-surface px-3 py-2 text-[11px] text-slate-500 md:flex">
                <Search aria-hidden="true" className="size-3.5" />
                <span>Workspace demo</span>
                <kbd className="ml-2 rounded border bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-400">DEMO</kbd>
              </div>
              <NotificationMenu />
              <div className="hidden h-7 w-px bg-border sm:block" />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="h-auto gap-2 rounded-xl px-1.5 py-1.5 text-left hover:bg-slate-100"
                      aria-label="Open adviser profile menu"
                    />
                  }
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-navy text-[11px] font-semibold text-white">
                      DA
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block text-xs font-semibold text-navy">Demo Adviser</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">Adviser workspace</span>
                  </span>
                  <ChevronDown aria-hidden="true" className="hidden size-3.5 text-slate-400 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Demo Adviser</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => toast.info('This is a fictional demo profile.')}>Profile settings</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info('No live account is connected in this demo.')}>Workspace preferences</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => toast.info('Session-only demo workspace.')}>Sign out</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 pb-10 pt-6 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
          {children}
          <footer className="mt-10 flex flex-col gap-1 border-t border-border/70 pt-4 text-[10px] leading-4 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>FinPilot AI · Smarter Advice. Clearer Reasons.</p>
            <p>Fictional demo records · Not investment advice · No live market data</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
