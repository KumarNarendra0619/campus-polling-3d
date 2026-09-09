import { Cartesian3, HeadingPitchRange, Viewer } from 'cesium'
import type { PollingBooth } from '../types/pollingBooth'

export function findBooth(booths: PollingBooth[], boothId: string) {
  const normalized = boothId.trim().toUpperCase()
  return booths.find((booth) => booth.booth_id.toUpperCase() === normalized)
}

export function flyToBooth(viewer: Viewer, booth: PollingBooth) {
  return viewer.flyTo(
    viewer.entities.getById(booth.booth_id) ?? viewer.entities,
    {
      offset: new HeadingPitchRange(0, -0.65, 80),
      duration: 1.2,
    },
  )
}

export function boothPosition(booth: PollingBooth) {
  return Cartesian3.fromDegrees(booth.longitude, booth.latitude)
}
