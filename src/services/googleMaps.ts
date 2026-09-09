import type { PollingBooth } from '../types/pollingBooth'

const GOOGLE_MAPS_DIRECTIONS_URL = 'https://www.google.com/maps/dir/'

export function buildGoogleMapsWalkingUrl(booth: PollingBooth): string {
  const lat = Number(booth.navigation_lat)
  const lon = Number(booth.navigation_lon)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(`Invalid navigation coordinates for ${booth.booth_id}.`)
  }

  const destination = `${lat},${lon}`
  const params = new URLSearchParams({
    api: '1',
    destination: destination,
    travelmode: 'walking',
  })

  return `${GOOGLE_MAPS_DIRECTIONS_URL}?${params.toString()}`
}

export function navigateToBooth(booth: PollingBooth): void {
  window.location.assign(buildGoogleMapsWalkingUrl(booth))
}
