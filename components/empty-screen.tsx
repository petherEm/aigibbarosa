import { UseChatHelpers } from 'ai/react'

import { ReactTyped } from 'react-typed'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'
import { ThemeToggle } from './theme-toggle'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-[32px] font-semibold">Bonjour,</h1>
        <h1 className="text-[32px] font-semibold">
          <ReactTyped
            strings={[
              'I am Gibbarosa AI Assistant',
              'I am here to help you with you luxury shopping'
            ]}
            typeSpeed={100}
            loop
          />
        </h1>
        <p className="font-inter leading-normal text-muted-foreground">
          I am here to help you selecting your next luxury item from our store{' '}
          <ExternalLink href="https://www.gibbarosa.com">
            Gibbarosa.com
          </ExternalLink>
        </p>
      </div>
    </div>
  )
}
