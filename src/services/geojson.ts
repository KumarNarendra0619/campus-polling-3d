import { Color, GeoJsonDataSource } from 'cesium'

export const CAMPUS_LAYERS = {
  boundary: '/data/campus_boundary.geojson',
  buildings: '/data/buildings.geojson',
  roads: '/data/roads.geojson',
  footpaths: '/data/footpaths.geojson',
  gates: '/data/gates.geojson',
  treesGreen: '/data/trees_green.geojson',
  amenities: '/data/amenities.geojson',
} as const

export type CampusLayerName = keyof typeof CAMPUS_LAYERS

export async function loadGeoJsonLayer(name: CampusLayerName): Promise<GeoJsonDataSource> {
  const dataSource = await GeoJsonDataSource.load(CAMPUS_LAYERS[name], {
    clampToGround: name !== 'buildings',
  })

  if (name === 'buildings') {
    for (const entity of dataSource.entities.values) {
      if (!entity.polygon) continue
      const rawHeight = entity.properties?.height_m?.getValue?.()
      const height = Number(rawHeight)
      entity.polygon.height = 0
      entity.polygon.extrudedHeight = Number.isFinite(height) && height > 0 ? height : 6
      entity.polygon.material = Color.WHITE.withAlpha(0.78)
      entity.polygon.outline = true
      entity.polygon.outlineColor = Color.DARKSLATEGRAY
    }
  }

  return dataSource
}
