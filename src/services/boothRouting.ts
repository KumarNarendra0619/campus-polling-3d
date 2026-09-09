import { Cartesian3, Viewer } from 'cesium'
import type { PollingBooth } from '../types/pollingBooth'

export function findBooth(booths: PollingBooth[], boothId: string) {
  const normalized = boothId.trim().toUpperCase()
  return booths.find((booth) => booth.booth_id.toUpperCase() === normalized)
}

export function flyToBooth(viewer: Viewer, booth: PollingBooth) {
  return viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(booth.longitude, booth.latitude, 120),
    orientation: { heading: 0, pitch: -0.75, roll: 0 },
    duration: 1.2,
  })
}

export function boothPosition(booth: PollingBooth) {
  return Cartesian3.fromDegrees(booth.longitude, booth.latitude)
}

export function boothRoutePath(boothId: string) {
  return `/booth/${encodeURIComponent(boothId.trim().toUpperCase())}`
}
