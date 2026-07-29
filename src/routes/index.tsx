import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  const handleSubmit = () => {
    const message = input.trim()

    if (!message || isLoading) return

    sendMessage(message)
    setInput('')
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-6">
        <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase">
          Your cycling companion
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">LegsGo Chat</h1>
        <p className="mt-2 text-slate-600">
          Ask for ride ideas, training tips, or help planning your next route.
        </p>
      </header>

      <section
        aria-live="polite"
        className="flex min-h-80 flex-1 flex-col gap-4 rounded-2xl border border-emerald-200 bg-white/80 p-4 shadow-sm"
      >
        {messages.length === 0 ? (
          <p className="m-auto max-w-sm text-center text-slate-500">
            Try asking, “What should I pack for a long weekend ride?”
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'ml-auto bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-slate-800'
              }`}
            >
              <p className="mb-1 text-xs font-bold tracking-wide uppercase opacity-70">
                {message.role === 'user' ? 'You' : 'LegsGo'}
              </p>
              {message.parts.map((part, index) =>
                part.type === 'text' ? (
                  <p key={index} className="whitespace-pre-wrap">
                    {part.content}
                  </p>
                ) : null,
              )}
            </article>
          ))
        )}

        {isLoading && (
          <p className="text-sm font-medium text-emerald-700">
            LegsGo is planning…
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            Something went wrong: {error.message}
          </p>
        )}
      </section>

      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          handleSubmit()
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <input
          id="chat-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
          placeholder="Ask about your next ride…"
          className="min-w-0 flex-1 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Sending…' : 'Send'}
        </button>
      </form>
    </main>
  )
}
