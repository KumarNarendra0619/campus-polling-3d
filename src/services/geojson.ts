import { GeoJsonDataSource } from 'cesium'

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

export async function loadGeoJsonLayer(
  name: CampusLayerName,
): Promise<GeoJsonDataSource> {
  return GeoJsonDataSource.load(CAMPUS_LAYERS[name], {
    clampToGround: name !== 'buildings',
  })
}
