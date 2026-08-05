import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { WorkoutSchema } from '../lib/workout'

import type { Workout, WorkoutBlock } from '../lib/workout'
import type { FormEvent } from 'react'

export const Route = createFileRoute('/')({ component: Home })

export type RiderProfile = {
  name?: string
  ftp?: number
  age?: number
  weight?: number
}

type HomeMode = 'chat' | 'workout'

const riderProfileStorageKey = 'legsgo-rider-profile'

function isRiderProfile(value: unknown): value is RiderProfile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const profile = value as Record<string, unknown>

  return (
    (profile.name === undefined || typeof profile.name === 'string') &&
    (profile.ftp === undefined || typeof profile.ftp === 'number') &&
    (profile.age === undefined || typeof profile.age === 'number') &&
    (profile.weight === undefined || typeof profile.weight === 'number')
  )
}

function Home() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<HomeMode>('chat')
  const [profile, setProfile] = useState<RiderProfile | null>()
  const [profileError, setProfileError] = useState('')
  const [profileSaveStatus, setProfileSaveStatus] = useState('')
  const forwardedProps = useMemo(() => ({ riderProfile: profile }), [profile])
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
    forwardedProps,
  })

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(riderProfileStorageKey)

      if (!savedProfile) {
        setProfile(null)
        return
      }

      const parsedProfile: unknown = JSON.parse(savedProfile)
      setProfile(isRiderProfile(parsedProfile) ? parsedProfile : null)
    } catch {
      setProfile(null)
    }
  }, [])

  const handleSubmit = () => {
    const message = input.trim()

    if (!message || isLoading) return

    sendMessage(message)
    setInput('')
  }

  if (profile === undefined) {
    return null
  }

  if (profile === null) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-2xl border border-emerald-200 bg-white/80 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold tracking-widest text-emerald-700">
            Welcome to LegsGo
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Tell us about your riding
          </h1>
          <p className="mt-3 text-slate-600">
            Add anything you know now. Every field is optional.
          </p>

          <form
            className="mt-8 grid gap-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              setProfileError('')

              const formData = new FormData(event.currentTarget)
              const name = formData.get('name')?.toString().trim()
              const ftp = formData.get('ftp')?.toString()
              const age = formData.get('age')?.toString()
              const weight = formData.get('weight')?.toString()
              const nextProfile: RiderProfile = {
                ...(name ? { name } : {}),
                ...(ftp ? { ftp: Number(ftp) } : {}),
                ...(age ? { age: Number(age) } : {}),
                ...(weight ? { weight: Number(weight) } : {}),
              }

              try {
                localStorage.setItem(
                  riderProfileStorageKey,
                  JSON.stringify(nextProfile),
                )
                setProfile(nextProfile)
              } catch {
                setProfileError(
                  'We could not save your profile in this browser. Please try again.',
                )
              }
            }}
          >
            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              Name
              <input
                name="name"
                autoComplete="name"
                placeholder="Your name"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              FTP
              <input
                name="ftp"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Watts"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Age
              <input
                name="age"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Years"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
              Weight
              <input
                name="weight"
                type="number"
                min="1"
                step="0.1"
                inputMode="decimal"
                placeholder="pounds"
                className="rounded-xl border border-emerald-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
              />
            </label>

            {profileError && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2"
              >
                {profileError}
              </p>
            )}

            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 sm:col-span-2"
            >
              Start riding
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border border-emerald-200 bg-white/80 p-5 shadow-sm lg:sticky lg:top-6">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
          Rider profile
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {profile.name || 'Your details'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Changes are saved for future chats.
        </p>

        <form
          className="mt-5 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setProfileSaveStatus('')

            const formData = new FormData(event.currentTarget)
            const name = formData.get('name')?.toString().trim()
            const ftp = formData.get('ftp')?.toString()
            const age = formData.get('age')?.toString()
            const weight = formData.get('weight')?.toString()
            const nextProfile: RiderProfile = {
              ...(name ? { name } : {}),
              ...(ftp ? { ftp: Number(ftp) } : {}),
              ...(age ? { age: Number(age) } : {}),
              ...(weight ? { weight: Number(weight) } : {}),
            }

            try {
              localStorage.setItem(
                riderProfileStorageKey,
                JSON.stringify(nextProfile),
              )
              setProfile(nextProfile)
              setProfileSaveStatus('Profile saved.')
            } catch {
              setProfileSaveStatus(
                'We could not save your changes. Please try again.',
              )
            }
          }}
        >
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Name
            <input
              name="name"
              defaultValue={profile.name}
              autoComplete="name"
              placeholder="Your name"
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            FTP
            <input
              name="ftp"
              type="number"
              min="1"
              inputMode="numeric"
              defaultValue={profile.ftp}
              placeholder="Watts"
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Age
            <input
              name="age"
              type="number"
              min="1"
              inputMode="numeric"
              defaultValue={profile.age}
              placeholder="Years"
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Weight
            <input
              name="weight"
              type="number"
              min="1"
              step="0.1"
              inputMode="decimal"
              defaultValue={profile.weight}
              placeholder="Pounds"
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          {profileSaveStatus && (
            <p
              role="status"
              className={`text-sm ${
                profileSaveStatus === 'Profile saved.'
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }`}
            >
              {profileSaveStatus}
            </p>
          )}

          <button
            type="submit"
            className="rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800"
          >
            Save profile
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="mb-6">
          <p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase">
            Your cycling companion
          </p>
          <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="text-4xl font-bold text-slate-900">
              {mode === 'chat' ? 'LegsGo Chat' : 'Build a Workout'}
            </h1>
            <div
              role="group"
              aria-label="Choose a LegsGo mode"
              className="inline-flex rounded-xl border border-emerald-200 bg-white/80 p-1 shadow-sm"
            >
              <button
                type="button"
                aria-pressed={mode === 'chat'}
                onClick={() => setMode('chat')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === 'chat'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                aria-pressed={mode === 'workout'}
                onClick={() => setMode('workout')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === 'workout'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                Build a Workout
              </button>
            </div>
          </div>
          <p className="mt-2 text-slate-600">
            {mode === 'chat'
              ? 'Ask for ride ideas, training tips, or help planning your next route.'
              : 'Describe the ride you want and shape a workout around your goals.'}
          </p>
        </header>

        {mode === 'chat' ? (
          <>
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
          </>
        ) : (
          <WorkoutGenerator profile={profile} />
        )}
      </div>
    </main>
  )
}

function WorkoutGenerator({ profile }: { profile: RiderProfile }) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const fieldClassName =
    'rounded-xl border border-emerald-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200'

  const handleGenerateWorkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsGenerating(true)
    setGenerationError('')
    setWorkout(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes: Number(formData.get('duration')),
          style: formData.get('style'),
          difficulty: formData.get('difficulty'),
          description: formData.get('description')?.toString() ?? '',
          riderProfile: profile,
        }),
      })
      const responseData: unknown = await response.json()

      if (!response.ok) {
        const message =
          typeof responseData === 'object' &&
          responseData !== null &&
          'error' in responseData &&
          typeof responseData.error === 'string'
            ? responseData.error
            : 'We could not generate a workout. Please try again.'
        throw new Error(message)
      }

      const result = WorkoutSchema.safeParse(responseData)

      if (!result.success) {
        throw new Error(
          'The generated workout was not valid. Please try again.',
        )
      }

      setWorkout(result.data)
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'We could not generate a workout. Please try again.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white/80 p-5 shadow-sm sm:p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
          Workout details
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Plan your next session
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Set the basics now. Workout generation will be added in a future step.
        </p>
      </div>

      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleGenerateWorkout}
      >
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Duration
          <select name="duration" defaultValue="60" className={fieldClassName}>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">2 hours</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Workout style
          <select
            name="style"
            defaultValue="endurance"
            className={fieldClassName}
          >
            <option value="endurance">Endurance</option>
            <option value="intervals">Intervals</option>
            <option value="climbing">Climbing</option>
            <option value="recovery">Recovery</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          Difficulty
          <select
            name="difficulty"
            defaultValue="moderate"
            className={fieldClassName}
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
          Description
          <textarea
            name="description"
            rows={5}
            placeholder="Tell LegsGo what you want to focus on, how your legs feel, or what event you are training for…"
            className={`${fieldClassName} resize-y`}
          />
        </label>

        <button
          type="submit"
          disabled={isGenerating}
          className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        >
          {isGenerating ? 'Generating Workout…' : 'Generate Workout'}
        </button>

        {generationError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2"
          >
            {generationError}
          </p>
        )}
      </form>

      {workout && <GeneratedWorkout workout={workout} />}
    </section>
  )
}

function GeneratedWorkout({ workout }: { workout: Workout }) {
  return (
    <article className="mt-8 border-t border-emerald-200 pt-6">
      <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
        Your workout
      </p>
      <div className="mt-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
        <h2 className="text-2xl font-bold text-slate-900">{workout.name}</h2>
        <p className="shrink-0 text-sm font-semibold text-emerald-700">
          {workout.totalDurationMinutes} minutes
        </p>
      </div>
      <p className="mt-2 text-slate-600">{workout.description}</p>

      <ol className="mt-5 grid gap-3">
        {workout.blocks.map((block, index) => (
          <li
            key={`${block.type}-${index}`}
            className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-slate-900">
                {index + 1}. {getBlockName(block)}
              </h3>
              <span className="shrink-0 text-sm font-semibold text-emerald-700">
                {getBlockDuration(block)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-700">
              {getBlockTarget(block)}
            </p>
            <p className="mt-1 text-sm text-slate-600">{block.description}</p>
          </li>
        ))}
      </ol>
    </article>
  )
}

function getBlockName(block: WorkoutBlock) {
  switch (block.type) {
    case 'warmup':
      return 'Warmup'
    case 'steady-state':
      return 'Steady state'
    case 'interval':
      return 'Intervals'
    case 'cooldown':
      return 'Cooldown'
  }
}

function getBlockDuration(block: WorkoutBlock) {
  if (block.type === 'interval') {
    const total =
      block.repetitions *
      (block.workDurationMinutes + block.recoveryDurationMinutes)
    return `${total} min total`
  }

  return `${block.durationMinutes} min`
}

function getBlockTarget(block: WorkoutBlock) {
  switch (block.type) {
    case 'warmup':
    case 'cooldown':
      return `${block.startIntensityPercentFtp}–${block.endIntensityPercentFtp}% FTP`
    case 'steady-state':
      return `${block.intensityPercentFtp}% FTP`
    case 'interval':
      return `${block.repetitions} × ${block.workDurationMinutes} min at ${block.workIntensityPercentFtp}% FTP, with ${block.recoveryDurationMinutes} min at ${block.recoveryIntensityPercentFtp}% FTP`
  }
}
