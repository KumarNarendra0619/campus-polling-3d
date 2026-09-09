import type { PollingBooth } from '../types/pollingBooth'
import { findBooth } from './boothRouting'

const BOOTH_PATH_PATTERN = /^\/booth\/([^/]+)\/?$/i

export function boothIdFromPath(pathname: string): string | null {
  const match = pathname.match(BOOTH_PATH_PATTERN)
  if (!match) return null

  try {
    return decodeURIComponent(match[1]).trim().toUpperCase()
  } catch {
    return null
  }
}

export function resolveBoothFromPath(
  pathname: string,
  booths: PollingBooth[],
): PollingBooth | null {
  const boothId = boothIdFromPath(pathname)
  return boothId ? findBooth(booths, boothId) ?? null : null
}

export function boothUrl(boothId: string, origin = window.location.origin): string {
  const normalized = boothId.trim().toUpperCase()
  if (!/^PB\d{1,2}$/.test(normalized)) {
    throw new Error(`Invalid polling booth ID: ${boothId}`)
  }

  return new URL(`/booth/${encodeURIComponent(normalized)}`, origin).toString()
}

export function allBoothUrls(
  boothIds: string[],
  origin = window.location.origin,
): Record<string, string> {
  return Object.fromEntries(
    boothIds.map((boothId) => {
      const normalized = boothId.trim().toUpperCase()
      return [normalized, boothUrl(normalized, origin)]
    }),
  )
}
