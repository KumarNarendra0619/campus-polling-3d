import { Cartesian3, Color, GeoJsonDataSource, LabelStyle, VerticalOrigin } from 'cesium'
import type { PollingBooth } from '../types/pollingBooth'
import { validatePollingBooths } from '../validation/pollingBoothValidation'

const DATA_URL = '/data/polling_booths.geojson'

export async function loadPollingBooths(): Promise<PollingBooth[]> {
  const response = await fetch(DATA_URL)
  if (!response.ok) throw new Error(`Polling booth data request failed: ${response.status}`)

  const json = await response.json()
  if (json?.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error('Invalid polling_booths.geojson: expected a FeatureCollection.')
  }

  const records = json.features
    .filter((feature: any) => feature?.type === 'Feature' && feature?.properties?.booth_id)
    .map((feature: any) => feature.properties as PollingBooth)

  const result = validatePollingBooths(records)
  if (result.errors.length) throw new Error(`Polling booth validation failed: ${result.errors.join(' ')}`)
  for (const warning of result.warnings) console.warn(warning)
  return result.validBooths
}

export function createBoothDataSource(booths: PollingBooth[]) {
  const dataSource = new GeoJsonDataSource('Polling Booths')

  for (const booth of booths) {
    if (booth.latitude === null || booth.longitude === null) continue

    const entity = dataSource.entities.add({
      id: booth.booth_id,
      position: Cartesian3.fromDegrees(booth.longitude, booth.latitude),
      point: {
        pixelSize: 14,
        color: booth.verified ? Color.RED : Color.ORANGE,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `PB${String(booth.booth_no).padStart(2, '0')}`,
        font: '600 14px sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: { x: 0, y: -18 } as any,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      properties: {
        booth_id: booth.booth_id,
        booth_no: booth.booth_no,
        booth_name: booth.booth_name,
        venue: booth.venue,
        building_name: booth.building_name,
        room_no: booth.room_no,
        floor: booth.floor,
        entrance_id: booth.entrance_id,
        status: booth.status,
        verified: booth.verified,
      },
    })

    entity.name = `${String(booth.booth_no).padStart(2, '0')} — ${booth.booth_name}`
  }

  return dataSource
}
