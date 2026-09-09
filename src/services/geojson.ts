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

function propertyNumber(entity: any, key: string, fallback: number) {
  const value = Number(entity.properties?.[key]?.getValue?.())
  return Number.isFinite(value) ? value : fallback
}

export async function loadGeoJsonLayer(name: CampusLayerName): Promise<GeoJsonDataSource> {
  const dataSource = await GeoJsonDataSource.load(CAMPUS_LAYERS[name], {
    clampToGround: name !== 'buildings',
  })

  for (const entity of dataSource.entities.values) {
    if (name === 'buildings' && entity.polygon) {
      const height = propertyNumber(entity, 'height_m', 6)
      entity.polygon.height = 0
      entity.polygon.extrudedHeight = Math.max(3, height)
      entity.polygon.material = Color.WHITE.withAlpha(0.82)
      entity.polygon.outline = true
      entity.polygon.outlineColor = Color.DARKSLATEGRAY
    }

    if (name === 'boundary' && entity.polygon) {
      entity.polygon.material = Color.TRANSPARENT
      entity.polygon.outline = true
      entity.polygon.outlineColor = Color.DODGERBLUE
      entity.polygon.outlineWidth = 2
    }

    if ((name === 'roads' || name === 'footpaths') && entity.polyline) {
      entity.polyline.width = name === 'roads' ? 4 : 2.5
      entity.polyline.material = name === 'roads' ? Color.DARKSLATEGRAY : Color.LIGHTGRAY
    }

    if (name === 'gates' && entity.point) entity.point.pixelSize = 10
    if (name === 'treesGreen' && entity.point) entity.point.pixelSize = 9
    if (name === 'amenities' && entity.point) entity.point.pixelSize = 8
  }

  return dataSource
}
