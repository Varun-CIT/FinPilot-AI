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
  PanelLeftClose,
  PanelLeftOpen,
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
import { ApiStatusBadge } from '@/components/finpilot/shared'
import { useFinPilot } from '@/components/finpilot/finpilot-provider'

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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'justify-center' : ''}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar shadow-[0_6px_18px_rgba(98,215,167,0.2)]">
        <Activity aria-hidden="true" className="size-[19px]" strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="text-[16px] font-semibold tracking-[-0.04em] text-white">
            FinPilot <span className="text-sidebar-primary">AI</span>
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300">Smarter advice, clearer reasons.</p>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-sidebar-primary/20 bg-sidebar-primary/10 px-2 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-sidebar-primary">
            <Sparkles aria-hidden="true" className="size-3" />
            AI-powered advisory
          </span>
        </div>
      )}
    </div>
  )
}

function NavigationContent({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const groups = ['Workspace', 'Intelligence', 'Governance']

  return (
    <>
      <div className={`flex-1 overflow-y-auto pb-3 pt-5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {groups.map((group) => (
          <div key={group} className="mb-5">
            <p className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 ${collapsed ? 'sr-only' : ''}`}>
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
                      aria-label={collapsed ? label : undefined}
                      title={collapsed ? label : undefined}
                      className={`group relative flex min-h-10 items-center rounded-lg text-[13px] font-medium transition-colors ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${
                        active
                          ? 'bg-white/[0.09] text-white ring-1 ring-inset ring-white/[0.08]'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-sidebar-primary" />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={`size-[17px] shrink-0 ${active ? 'text-sidebar-primary' : 'text-slate-400 group-hover:text-slate-200'}`}
                        strokeWidth={1.8}
                      />
                      <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
                    </Link>
                  )
                })}
            </nav>
          </div>
        ))}
      </div>
      <div className={`border-t border-white/[0.08] ${collapsed ? 'p-2' : 'p-4'}`}>
        <div
          className={`rounded-xl border border-white/[0.09] bg-white/[0.045] ${collapsed ? 'flex justify-center p-2' : 'p-3.5'}`}
          title={collapsed ? 'AI-powered advisory' : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <Sparkles aria-hidden="true" className="size-3.5 shrink-0 text-sidebar-primary" />
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-200">
                Human-reviewed AI
              </p>
            )}
          </div>
          {!collapsed && (
            <p className="mt-2 text-[11px] leading-4 text-slate-400">
              Evidence-led workflows, with adviser judgement in control.
            </p>
          )}
        </div>
        <div className={`mt-3 flex items-center gap-2.5 rounded-xl px-2 py-2 ${collapsed ? 'justify-center px-0' : ''}`}>
          <Avatar className="size-8 shrink-0 rounded-lg">
            <AvatarFallback className="rounded-lg bg-sidebar-accent text-[10px] font-semibold text-white">
              AD
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-white">Adviser</p>
              <p className="truncate text-[10px] text-slate-400">Workspace profile</p>
            </div>
          )}
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
            className="text-slate-600 hover:bg-slate-100 hover:text-navy"
          />
        }
      >
        <Bell aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[330px] p-0">
        <div className="border-b px-4 py-3">
          <PopoverHeader>
            <PopoverTitle className="text-sm text-navy">Notifications</PopoverTitle>
            <p className="text-xs text-muted-foreground">Adviser workspace alerts</p>
          </PopoverHeader>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald/10 text-emerald-800">
            <Bell aria-hidden="true" className="size-4" />
          </span>
          <p className="text-xs font-semibold text-navy">No notifications available</p>
          <p className="max-w-[230px] text-[11px] leading-4 text-muted-foreground">
            Connected-service alerts will appear here when they are provided by the workspace API.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { apiStatus } = useFinPilot()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const title = pageTitles[pathname] ?? 'Workspace'

  return (
    <div className="min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.08] bg-navy text-white transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-[76px]' : 'w-[252px]'}`}
      >
        <div className={`flex h-[76px] items-center border-b border-white/[0.08] ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          <Brand compact={sidebarCollapsed} />
        </div>
        <NavigationContent collapsed={sidebarCollapsed} />
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[252px]'}`}>
        <header className="sticky top-0 z-20 h-[68px] border-b border-border/80 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-pressed={sidebarCollapsed}
                className="hidden shrink-0 text-slate-600 hover:bg-slate-100 lg:inline-flex"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
              >
                {sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              </Button>
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
                  <NavigationContent onNavigate={() => setMobileOpen(false)} collapsed={false} />
                </SheetContent>
              </Sheet>
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                <span>Workspace</span>
                <ChevronRight aria-hidden="true" className="size-3.5" />
              </div>
              <h2 className="truncate text-sm font-semibold text-navy">{title}</h2>
              <div className="hidden sm:block">
                <ApiStatusBadge status={apiStatus} />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block text-xs font-semibold text-navy">Adviser</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">Workspace profile</span>
                  </span>
                  <ChevronDown aria-hidden="true" className="hidden size-3.5 text-slate-400 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Adviser workspace</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/audit-trail" />} nativeButton={false}>
                    Open audit trail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Account settings are not connected in this preview.')}>
                    Account settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] px-4 pb-10 pt-6 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
          {children}
          <footer className="mt-10 flex flex-col gap-1 border-t border-border/70 pt-4 text-[10px] leading-4 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>FinPilot AI · Smarter advice, clearer reasons.</p>
            <p>Adviser review required · Client delivery disabled · No execution or orders</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
