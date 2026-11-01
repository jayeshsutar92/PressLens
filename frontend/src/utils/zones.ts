/**
 * Pitch spatial geometry and tactical zone classification
 * Standard regulation pitch dimensions: 105.0m length (X-axis) x 68.0m width (Y-axis)
 */

export const PITCH_LENGTH = 105.0
export const PITCH_WIDTH = 68.0

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function getPitchZone(x: number, y: number): string {
  const clampedX = clamp(x, 0, PITCH_LENGTH)
  const clampedY = clamp(y, 0, PITCH_WIDTH)

  // Check Zone 14 (The critical pocket immediately outside the penalty box)
  if (clampedX >= 70.0 && clampedX <= 88.5 && clampedY >= 23.0 && clampedY <= 45.0) {
    return 'Zone 14 - Attacking Midfield Hole'
  }

  // Determine horizontal third
  let third = 'Middle Third'
  if (clampedX < 35.0) {
    third = 'Defensive Third'
  } else if (clampedX > 70.0) {
    third = 'Attacking Third'
  }

  // Determine vertical corridor (5 channels)
  let corridor = 'Central Channel'
  if (clampedY < 13.6) {
    corridor = 'Left Wing'
  } else if (clampedY < 27.2) {
    corridor = 'Left Half-space'
  } else if (clampedY > 54.4) {
    corridor = 'Right Wing'
  } else if (clampedY > 40.8) {
    corridor = 'Right Half-space'
  }

  return `${third} - ${corridor}`
}

