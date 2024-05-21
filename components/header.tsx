import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconGitHub,
  IconNextChat,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import { ThemeToggle } from './theme-toggle'

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/" rel="nofollow">
          <h1 className="text-[24px] font-bold">Gibbarosa</h1>
        </Link>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          {/* <UserOrLogin /> */}
        </React.Suspense>
      </div>
      <div className="">
        <h1 className="text-[32px] font-bold">Gibbarosa</h1>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <ThemeToggle />
        {/* <Link
          target="_blank"
          href="https://www.gibbarosa.com"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          <span className="hidden ml-2 md:flex">Visit Gibbarosa</span>
        </Link> */}
      </div>
    </header>
  )
}
