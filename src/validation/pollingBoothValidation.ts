import type { PollingBooth } from '../types/pollingBooth'

const VALID_STATUSES = new Set<PollingBooth['status']>(['active', 'inactive', 'temporary', 'closed'])
const BOOTH_ID_PATTERN = /^PB(\d{1,2})$/i

export interface BoothValidationResult {
  validBooths: PollingBooth[]
  errors: string[]
  warnings: string[]
}

function validCoordinate(value: unknown, min: number, max: number) {
  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max
}

function validateBooth(booth: Partial<PollingBooth>, index: number): string[] {
  const errors: string[] = []
  const label = booth.booth_id || `record ${index + 1}`
  const match = typeof booth.booth_id === 'string' ? booth.booth_id.trim().match(BOOTH_ID_PATTERN) : null
  const boothNumber = match ? Number(match[1]) : NaN

  if (!match || !Number.isInteger(boothNumber) || boothNumber < 1 || boothNumber > 14) {
    errors.push(`${label}: invalid booth_id; expected PB01–PB14.`)
  }
  for (const [field, value] of [
    ['booth_no', booth.booth_no],
    ['booth_name', booth.booth_name],
    ['building_name', booth.building_name],
    ['room_no', booth.room_no],
    ['floor', booth.floor],
    ['entrance_id', booth.entrance_id],
  ] as const) {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${label}: missing required field ${field}.`)
  }

  if (!validCoordinate(booth.latitude, -90, 90) || !validCoordinate(booth.longitude, -180, 180)) {
    errors.push(`${label}: invalid polling coordinates.`)
  }
  if (!validCoordinate(booth.navigation_lat, -90, 90) || !validCoordinate(booth.navigation_lon, -180, 180)) {
    errors.push(`${label}: invalid navigation coordinates.`)
  }
  if (!VALID_STATUSES.has(booth.status as PollingBooth['status'])) {
    errors.push(`${label}: invalid status.`)
  }
  if (typeof booth.verified !== 'boolean') errors.push(`${label}: verified must be true or false.`)

  return errors
}

export function validatePollingBooths(booths: PollingBooth[]): BoothValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const validBooths: PollingBooth[] = []
  const seen = new Set<string>()

  booths.forEach((booth, index) => {
    const normalizedId = typeof booth.booth_id === 'string' ? booth.booth_id.trim().toUpperCase() : ''
    if (normalizedId && seen.has(normalizedId)) errors.push(`${normalizedId}: duplicate booth_id.`)
    if (normalizedId) seen.add(normalizedId)

    const boothErrors = validateBooth(booth, index)
    if (boothErrors.length) errors.push(...boothErrors)
    else validBooths.push({ ...booth, booth_id: normalizedId })

    if (booth.status === 'inactive' || booth.status === 'closed') {
      warnings.push(`${normalizedId || `record ${index + 1}`}: navigation is disabled because the booth is ${booth.status}.`)
    }
  })

  return { validBooths, errors, warnings }
}
