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

  if (!match || !Number.isInteger(boothNumber) || boothNumber < 1 || boothNumber > 14) errors.push(`${label}: invalid booth_id; expected PB01–PB14.`)

  for (const [field, value] of [
    ['booth_no', booth.booth_no], ['booth_name', booth.booth_name], ['venue', booth.venue],
    ['building_name', booth.building_name], ['status', booth.status], ['source', booth.source],
    ['election_source', booth.election_source],
  ] as const) {
    if ((typeof value !== 'string' && field !== 'booth_no') || (typeof value === 'string' && !value.trim())) errors.push(`${label}: missing required field ${field}.`)
  }

  if (!Number.isInteger(booth.booth_no) || booth.booth_no < 1 || booth.booth_no > 14) errors.push(`${label}: invalid booth_no.`)
  if (!Array.isArray(booth.voter_groups)) errors.push(`${label}: voter_groups must be an array.`)
  if (!VALID_STATUSES.has(booth.status as PollingBooth['status'])) errors.push(`${label}: invalid status.`)
  if (typeof booth.verified !== 'boolean') errors.push(`${label}: verified must be true or false.`)
  if (typeof booth.dummy !== 'boolean') errors.push(`${label}: dummy must be true or false.`)

  const spatialPairs = [
    ['polling coordinates', booth.latitude, booth.longitude, -90, 90, -180, 180],
    ['navigation coordinates', booth.navigation_lat, booth.navigation_lon, -90, 90, -180, 180],
  ] as const

  for (const [name, lat, lon, latMin, latMax, lonMin, lonMax] of spatialPairs) {
    const bothNull = lat === null && lon === null
    const bothValid = validCoordinate(lat, latMin, latMax) && validCoordinate(lon, lonMin, lonMax)
    if (!bothNull && !bothValid) errors.push(`${label}: ${name} must be both null or valid latitude/longitude values.`)
  }

  if (booth.verified) {
    if (booth.latitude === null || booth.longitude === null) errors.push(`${label}: verified booth requires polling coordinates.`)
    if (booth.navigation_lat === null || booth.navigation_lon === null) errors.push(`${label}: verified booth requires navigation coordinates.`)
    if (!booth.building_id) errors.push(`${label}: verified booth requires building_id.`)
    if (!booth.entrance_id) errors.push(`${label}: verified booth requires entrance_id.`)
    if (!booth.verification_date) errors.push(`${label}: verified booth requires verification_date.`)
    if (booth.dummy) errors.push(`${label}: verified booth cannot be marked dummy.`)
  }

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

    if (booth.dummy) warnings.push(`${normalizedId || `record ${index + 1}`}: DEMO spatial record; replace before production.`)
    if (booth.latitude === null || booth.navigation_lat === null) warnings.push(`${normalizedId || `record ${index + 1}`}: spatial verification pending; map marker and navigation are disabled.`)
    if (booth.status === 'inactive' || booth.status === 'closed') warnings.push(`${normalizedId || `record ${index + 1}`}: navigation is disabled because the booth is ${booth.status}.`)
  })

  if (validBooths.length !== 14) errors.push(`Expected exactly 14 polling booths; found ${validBooths.length}.`)

  return { validBooths, errors, warnings }
}
