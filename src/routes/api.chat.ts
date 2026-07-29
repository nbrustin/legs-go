import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const abortController = new AbortController()
        const { messages } = await request.json()

        const stream = chat({
          adapter: openaiText('gpt-5-mini'),
          messages,
          abortController,
        })

        return toServerSentEventsResponse(stream, { abortController })
      },
    },
  },
})
