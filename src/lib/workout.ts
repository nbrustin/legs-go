import { z } from 'zod'

import type { JSONSchema } from '@tanstack/ai'

export const WarmupBlockSchema = z.object({
  type: z.literal('warmup'),
  durationMinutes: z.number().int().positive(),
  startIntensityPercentFtp: z.number().int().min(20).max(150),
  endIntensityPercentFtp: z.number().int().min(20).max(150),
  description: z.string().min(1),
})

export const SteadyStateBlockSchema = z.object({
  type: z.literal('steady-state'),
  durationMinutes: z.number().int().positive(),
  intensityPercentFtp: z.number().int().min(20).max(150),
  description: z.string().min(1),
})

export const IntervalBlockSchema = z.object({
  type: z.literal('interval'),
  repetitions: z.number().int().positive().max(30),
  workDurationMinutes: z.number().positive(),
  recoveryDurationMinutes: z.number().positive(),
  workIntensityPercentFtp: z.number().int().min(20).max(200),
  recoveryIntensityPercentFtp: z.number().int().min(20).max(150),
  description: z.string().min(1),
})

export const CooldownBlockSchema = z.object({
  type: z.literal('cooldown'),
  durationMinutes: z.number().int().positive(),
  startIntensityPercentFtp: z.number().int().min(20).max(150),
  endIntensityPercentFtp: z.number().int().min(20).max(150),
  description: z.string().min(1),
})

export const WorkoutBlockSchema = z.discriminatedUnion('type', [
  WarmupBlockSchema,
  SteadyStateBlockSchema,
  IntervalBlockSchema,
  CooldownBlockSchema,
])

export const WorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  totalDurationMinutes: z.number().int().positive(),
  blocks: z.array(WorkoutBlockSchema).min(1),
})

const OpenAIWorkoutBlockResponseDataSchema = z.object({
  type: z.enum(['warmup', 'steady-state', 'interval', 'cooldown']),
  durationMinutes: z.number().int().positive().nullable(),
  startIntensityPercentFtp: z.number().int().min(20).max(150).nullable(),
  endIntensityPercentFtp: z.number().int().min(20).max(150).nullable(),
  intensityPercentFtp: z.number().int().min(20).max(150).nullable(),
  repetitions: z.number().int().positive().max(30).nullable(),
  workDurationMinutes: z.number().positive().nullable(),
  recoveryDurationMinutes: z.number().positive().nullable(),
  workIntensityPercentFtp: z.number().int().min(20).max(200).nullable(),
  recoveryIntensityPercentFtp: z.number().int().min(20).max(150).nullable(),
  description: z.string().min(1),
})

export const OpenAIWorkoutResponseDataSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  totalDurationMinutes: z.number().int().positive(),
  blocks: z.array(OpenAIWorkoutBlockResponseDataSchema).min(1),
})

const nullableInteger = (minimum: number, maximum?: number): JSONSchema => ({
  type: ['integer', 'null'],
  minimum,
  ...(maximum === undefined ? {} : { maximum }),
})

const nullableNumber = (): JSONSchema => ({
  type: ['number', 'null'],
  exclusiveMinimum: 0,
})

export const OpenAIWorkoutResponseSchema: JSONSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    totalDurationMinutes: { type: 'integer', minimum: 1 },
    blocks: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            enum: ['warmup', 'steady-state', 'interval', 'cooldown'],
          },
          durationMinutes: nullableInteger(1),
          startIntensityPercentFtp: nullableInteger(20, 150),
          endIntensityPercentFtp: nullableInteger(20, 150),
          intensityPercentFtp: nullableInteger(20, 150),
          repetitions: nullableInteger(1, 30),
          workDurationMinutes: nullableNumber(),
          recoveryDurationMinutes: nullableNumber(),
          workIntensityPercentFtp: nullableInteger(20, 200),
          recoveryIntensityPercentFtp: nullableInteger(20, 150),
          description: { type: 'string', minLength: 1 },
        },
        required: [
          'type',
          'durationMinutes',
          'startIntensityPercentFtp',
          'endIntensityPercentFtp',
          'intensityPercentFtp',
          'repetitions',
          'workDurationMinutes',
          'recoveryDurationMinutes',
          'workIntensityPercentFtp',
          'recoveryIntensityPercentFtp',
          'description',
        ],
      },
    },
  },
  required: ['name', 'description', 'totalDurationMinutes', 'blocks'],
}

export const WorkoutRequestSchema = z.object({
  durationMinutes: z.number().int().min(15).max(360),
  style: z.enum(['endurance', 'intervals', 'climbing', 'recovery', 'mixed']),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  description: z.string().trim().max(1000),
  riderProfile: z.object({
    name: z.string().optional(),
    ftp: z.number().positive().optional(),
    age: z.number().int().positive().optional(),
    weight: z.number().positive().optional(),
  }),
})

export type WarmupBlock = z.infer<typeof WarmupBlockSchema>
export type SteadyStateBlock = z.infer<typeof SteadyStateBlockSchema>
export type IntervalBlock = z.infer<typeof IntervalBlockSchema>
export type CooldownBlock = z.infer<typeof CooldownBlockSchema>
export type WorkoutBlock = z.infer<typeof WorkoutBlockSchema>
export type Workout = z.infer<typeof WorkoutSchema>
export type WorkoutRequest = z.infer<typeof WorkoutRequestSchema>
export type OpenAIWorkoutResponse = z.infer<
  typeof OpenAIWorkoutResponseDataSchema
>
