import type { Workout, WorkoutBlock } from './workout'

function stripInvalidXmlCharacters(value: string) {
  return Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return (
        codePoint === 9 ||
        codePoint === 10 ||
        codePoint === 13 ||
        (codePoint >= 32 && codePoint <= 0xd7ff) ||
        (codePoint >= 0xe000 && codePoint <= 0xfffd) ||
        (codePoint >= 0x10000 && codePoint <= 0x10ffff)
      )
    })
    .join('')
}

function escapeXmlText(value: string) {
  return stripInvalidXmlCharacters(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDuration(minutes: number) {
  return Number((minutes * 60).toFixed(6)).toString()
}

function formatPower(percentFtp: number) {
  return (percentFtp / 100).toFixed(2)
}

function blockToZwo(block: WorkoutBlock) {
  switch (block.type) {
    case 'warmup':
      return `<Warmup Duration="${formatDuration(block.durationMinutes)}" PowerLow="${formatPower(block.startIntensityPercentFtp)}" PowerHigh="${formatPower(block.endIntensityPercentFtp)}" />`
    case 'steady-state':
      return `<SteadyState Duration="${formatDuration(block.durationMinutes)}" Power="${formatPower(block.intensityPercentFtp)}" />`
    case 'interval':
      return `<IntervalsT Repeat="${block.repetitions}" OnDuration="${formatDuration(block.workDurationMinutes)}" OffDuration="${formatDuration(block.recoveryDurationMinutes)}" OnPower="${formatPower(block.workIntensityPercentFtp)}" OffPower="${formatPower(block.recoveryIntensityPercentFtp)}" />`
    case 'cooldown':
      return `<Cooldown Duration="${formatDuration(block.durationMinutes)}" PowerLow="${formatPower(block.startIntensityPercentFtp)}" PowerHigh="${formatPower(block.endIntensityPercentFtp)}" />`
  }
}

export function workoutToZwo(workout: Workout) {
  const blocks = workout.blocks
    .map((block) => `    ${blockToZwo(block)}`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>LegsGo</author>
  <name>${escapeXmlText(workout.name)}</name>
  <description>${escapeXmlText(workout.description)}</description>
  <sportType>bike</sportType>
  <workout>
${blocks}
  </workout>
</workout_file>
`
}

export function sanitizeZwoFileName(value: string) {
  const sanitized = Array.from(value)
    .filter((character) => (character.codePointAt(0) ?? 0) >= 32)
    .join('')
    .trim()
    .replace(/\.zwo$/i, '')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 120)

  return sanitized || 'legsgo-workout'
}
