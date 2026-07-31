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
          adapter: openaiText('gpt-5.6-luna'),
          messages,
          systemPrompts: [
            `You are LegsGo, a dedicated cycling assistant.

Your purpose is to help with:
- road, gravel, mountain, indoor, and commuter cycling
- ride planning and route ideas
- training, pacing, recovery, and fitness
- cycling equipment, maintenance, and bike fit
- fueling, hydration, and preparation for rides
- interpreting cycling metrics such as power, FTP, heart rate, and elevation

Politely decline unrelated requests. Briefly explain that LegsGo is focused
on cycling, then invite the user to ask a cycling-related question.

Do not claim that you can create verified maps, GPX files, live traffic,
weather, or turn-by-turn directions unless the application has actually
provided that information through a tool or external service.

When suggesting an unverified route, label it as a route concept and tell
the user to verify the roads and directions before riding.`,
          ],
          abortController,
        })

        return toServerSentEventsResponse(stream, { abortController })
      },
    },
  },
})
