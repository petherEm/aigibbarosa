'use client'

import { useActions, useUIState } from 'ai/rsc'
import Image from 'next/image'

import type { AI } from '@/lib/chat/actions'

interface Product {
  id: string
  title: string
  url: string
  description: string
}

export function Products({ props: products }: { props: Product[] }) {
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm sm:flex-row">
        {products.map(product => (
          <button
            key={product.id}
            className="flex cursor-pointer flex-row gap-2 rounded-lg bg-zinc-800 p-2 text-left hover:bg-zinc-700 sm:w-52"
            onClick={async () => {
              const response = await submitUserMessage(`View ${product.title}`)
              setMessages(currentMessages => [...currentMessages, response])
            }}
          >
            {product.title}
            <Image
              src={product?.images[0].url}
              alt={product.title}
              width={48}
              height={48}
            />
          </button>
        ))}
      </div>
      <div className="p-4 text-center text-sm text-zinc-500">
        Note: Data and latency are simulated for illustrative purposes and
        should not be considered as financial advice.
      </div>
    </div>
  )
}
