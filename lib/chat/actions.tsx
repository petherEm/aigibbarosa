import 'server-only'
import {
  createAI,
  createStreamableUI,
  getAIState,
  render,
  createStreamableValue,
  getMutableAIState
} from 'ai/rsc'
import OpenAI from 'openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat } from '@/lib/types'
import { auth } from '@/auth'
import { Products } from '@/components/stocks/products'
import ProdGrid from '@/components/stocks/prodgrid'

export type Message = {
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool'
  content: string
  id: string
  name?: string
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

// -----START----GIBBAROSA CUSTOM ACTIONS-----START----

async function getProducts() {
  try {
    const response = await fetch(
      'https://gibnextadmin.onrender.com/store/products'
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Parse the JSON data
    const data = await response.json()
    const products = data.products

    return products
  } catch (error) {
    console.error(error)
    return null
  }
}

async function getProductPrice(productName: string) {
  try {
    const products = await getProducts()

    if (!products || products.length === 0) {
      return `No products found.`
    }

    const product = products.find(
      (p: any) => p.title.toLowerCase() === productName.toLowerCase()
    )

    if (!product) {
      return `Product "${productName}" not found.`
    }

    if (
      !product.prices ||
      !Array.isArray(product.prices) ||
      product.prices.length === 0
    ) {
      return `No prices available for "${product.title}".`
    }

    const prices = product.prices
      //@ts-ignore
      .map(price => {
        const amount = (price.amount / 100).toFixed(2) // Convert amount from cents to a readable format
        return `${amount} ${price.currency_code.toUpperCase()}`
      })
      .join(' and ')

    return `The price of "${product.title}" is ${prices}.`
  } catch (error) {
    console.error('Error fetching product price:', error)
    return `There was an error fetching the product price. Please try again later.`
  }
}

function directToStore() {
  window.location.href = 'https://www.gibbarosa.com'
}

// -----END----GIBBAROSA CUSTOM ACTIONS-----END----

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  // Update the AI state with the user message
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  // Create a streamable value for the bot message, streamable UI
  const ui = render({
    model: 'gpt-4o',
    provider: openai,
    initial: <SpinnerMessage />,
    messages: [
      {
        role: 'system',
        content: `\
        You are pre-owned luxury goods, e-commerce assistant. You can help users buy products, step by step. You answer questions about specific products and brands. You are very polite and you present yourself as Bożena.
        You and the user can discuss the price but you cannot change it. User can select the product through and go to checkout through the UI.
        Messages inside [] means that it's a UI element or a user event. For example:
        - "[Price of Dior bag is PLN 1000]" means that an interface of the product is shown to the user.
        - "[User has clicked the like element on the UI]" means you suggest redirection to http://www.gibbarosa.com

      If the user wants to see the current products, call \`show_products\`.
      If the user requests purchasing a product, call \`redirect_to_store\` to show the purchase UI.
      If the user just wants the price, call \`show_price_delivery\` to show the price.
      If the user swears, or wants to complete another impossible task, respond politely that you will not do it, but you can show the user the products by calling \`show_products\`.
      You can also show the user all the products by calling \`show_products\`.
      If user wants to explore more products or buy directly at a store, call \`redirect_to_store\`.

      You do not respond on any other, non related questions. If user diverts the conversation always respond that you are Luxury shopping assistant and you are unable to advice suggest anything else.
      If customer asks in Polish, respond in Polish. If customer asks in English, respond in English. If customer asks in French, respond in French. If customer asks in German, respond in German. If customer asks in Spanish, respond in Spanish.

`
      },
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    functions: {
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        render: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'getEvents',
                content: JSON.stringify(events)
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      },
      showProducts: {
        description: 'Show Gibbarosa products.',
        parameters: z.object({
          plans: z.array(
            z.object({
              id: z.string().describe('The id of the product.'),
              title: z.string().describe('The name of the product.'),
              desc: z.number().describe('The description of the product.')
            })
          )
        }),
        render: async function* () {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)
          const products = await getProducts()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showProducts',
                content: JSON.stringify(products)
              }
            ]
          })

          return (
            <BotCard>
              {/* TO DO: a component to display products */}
              <ProdGrid products={products} />
            </BotCard>
          )
        }
      },
      showProductPrice: {
        description: 'Get the price of a specific product.',
        parameters: z.object({
          productName: z.string().describe('The name of the product.')
        }),

        //@ts-ignore
        render: async function* ({ productName }) {
          yield (
            <BotCard>
              <div>Fetching price for {productName}...</div>
            </BotCard>
          )

          const priceMessage = await getProductPrice(productName)

          console.log('Price message:', priceMessage)

          // Update the AI state with the function's response
          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'showProductPrice',
                content: priceMessage
              }
            ]
          })

          yield (
            <BotCard>
              <div>{priceMessage}</div>
            </BotCard>
          )
        }
      },
      redirectToStore: {
        description: 'Redirect to Gibbarosa.',
        parameters: z.object({
          plans: z.array(
            z.object({
              id: z.string().describe('The id of the product.'),
              title: z.string().describe('The name of the product.'),
              desc: z.number().describe('The description of the product.')
            })
          )
        }),
        render: async function* () {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const products = await getProducts()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'function',
                name: 'redirectToStore',
                content: JSON.stringify(products)
              }
            ]
          })

          return (
            <BotCard>
              {/* TO DO: a component to display products */}
              <Products props={products} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: ui
  }
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  unstable_onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState()

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  unstable_onSetAIState: async ({ state, done }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`
      const title = messages[0].content.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'function' ? (
          message.name === 'getEvents' ? (
            <BotCard>
              <Events props={JSON.parse(message.content)} />
            </BotCard>
          ) : message.name === 'showProductPrice' ? (
            <BotCard>
              <div>{message.content}</div>
            </BotCard>
          ) : null
        ) : message.role === 'user' ? (
          <UserMessage>{message.content}</UserMessage>
        ) : (
          <BotMessage content={message.content} />
        )
    }))
}
