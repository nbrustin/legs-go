import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import {
  NormalizedWorkoutRequestSchema,
  WorkoutGenerationResponseSchema,
} from '../lib/workout'
import { sanitizeZwoFileName, workoutToZwo } from '../lib/zwo'

import type {
  NormalizedWorkoutRequest,
  Workout,
  WorkoutBlock,
} from '../lib/workout'
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
  const [profile, setProfile] = useState<RiderProfile>()
  const [profileError, setProfileError] = useState('')
  const forwardedProps = useMemo(() => ({ riderProfile: profile }), [profile])
  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
    forwardedProps,
  })

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(riderProfileStorageKey)

      if (!savedProfile) {
        setProfile({})
        return
      }

      const parsedProfile: unknown = JSON.parse(savedProfile)
      setProfile(isRiderProfile(parsedProfile) ? parsedProfile : {})
    } catch {
      setProfile({})
    }
  }, [])

  useEffect(() => {
    if (profile === undefined) return

    try {
      localStorage.setItem(riderProfileStorageKey, JSON.stringify(profile))
      setProfileError('')
    } catch {
      setProfileError(
        'We could not save your changes in this browser. Please try again.',
      )
    }
  }, [profile])

  const updateProfile = (field: keyof RiderProfile, value: string) => {
    setProfile((currentProfile) => {
      const nextProfile = { ...currentProfile }

      if (field === 'name') {
        if (value) {
          nextProfile.name = value
        } else {
          delete nextProfile.name
        }
      } else if (value) {
        nextProfile[field] = Number(value)
      } else {
        delete nextProfile[field]
      }

      return nextProfile
    })
  }

  const handleSubmit = () => {
    const message = input.trim()

    if (!message || isLoading) return

    sendMessage(message)
    setInput('')
  }

  if (profile === undefined) {
    return null
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
          Optional. Changes save automatically.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Name
            <input
              name="name"
              value={profile.name ?? ''}
              onChange={(event) => updateProfile('name', event.target.value)}
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
              value={profile.ftp ?? ''}
              onChange={(event) => updateProfile('ftp', event.target.value)}
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
              value={profile.age ?? ''}
              onChange={(event) => updateProfile('age', event.target.value)}
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
              value={profile.weight ?? ''}
              onChange={(event) => updateProfile('weight', event.target.value)}
              placeholder="Pounds"
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
          </label>

          {profileError && (
            <p role="alert" className="text-sm text-red-700">
              {profileError}
            </p>
          )}
        </div>
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
  const [fileName, setFileName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [style, setStyle] =
    useState<NormalizedWorkoutRequest['style']>('endurance')
  const [difficulty, setDifficulty] =
    useState<NormalizedWorkoutRequest['difficulty']>('moderate')
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
          durationMinutes: Number(durationMinutes),
          style,
          difficulty,
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

      const result = WorkoutGenerationResponseSchema.safeParse(responseData)

      if (!result.success) {
        throw new Error(
          'The generated workout was not valid. Please try again.',
        )
      }

      setDurationMinutes(String(result.data.normalizedRequest.durationMinutes))
      setStyle(result.data.normalizedRequest.style)
      setDifficulty(result.data.normalizedRequest.difficulty)
      setFileName(result.data.workout.name)
      setWorkout(result.data.workout)
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

  const handleDownloadZwo = () => {
    if (!workout) return

    const xml = workoutToZwo(workout)
    const downloadName = `${sanitizeZwoFileName(fileName)}.zwo`
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')

    downloadLink.href = objectUrl
    downloadLink.download = downloadName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
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
          Set your defaults, then use the description for any specific changes.
        </p>
      </div>

      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleGenerateWorkout}
      >
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Duration
          <div className="relative">
            <input
              name="duration"
              type="number"
              min="15"
              max="360"
              step="1"
              required
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className={`${fieldClassName} w-full pr-20`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-medium text-slate-500">
              minutes
            </span>
          </div>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Workout style
          <select
            name="style"
            value={style}
            onChange={(event) => {
              const result =
                NormalizedWorkoutRequestSchema.shape.style.safeParse(
                  event.target.value,
                )
              if (result.success) setStyle(result.data)
            }}
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
            value={difficulty}
            onChange={(event) => {
              const result =
                NormalizedWorkoutRequestSchema.shape.difficulty.safeParse(
                  event.target.value,
                )
              if (result.success) setDifficulty(result.data)
            }}
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

      {workout && (
        <GeneratedWorkout
          workout={workout}
          fileName={fileName}
          onFileNameChange={setFileName}
          onDownload={handleDownloadZwo}
        />
      )}
    </section>
  )
}

function GeneratedWorkout({
  workout,
  fileName,
  onFileNameChange,
  onDownload,
}: {
  workout: Workout
  fileName: string
  onFileNameChange: (value: string) => void
  onDownload: () => void
}) {
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

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:flex-row sm:items-end">
        <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-semibold text-slate-700">
          File name
          <input
            value={fileName}
            onChange={(event) => onFileNameChange(event.target.value)}
            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
          />
        </label>
        <button
          type="button"
          onClick={onDownload}
          className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800"
        >
          Download Zwift (.zwo)
        </button>
      </div>

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
