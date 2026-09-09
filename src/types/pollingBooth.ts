export interface PollingBooth {
  booth_id: string
  booth_no: number
  booth_name: string
  venue: string
  building_id: string | null
  building_name: string
  room_no: string | null
  room_label: string | null
  floor: string | null
  voter_groups: string[]
  latitude: number | null
  longitude: number | null
  navigation_lat: number | null
  navigation_lon: number | null
  entrance_id: string | null
  mapillary_ref: string | null
  mapillary_sequence_id: string | null
  status: 'active' | 'inactive' | 'temporary' | 'closed'
  verified: boolean
  dummy: boolean
  verification_date: string | null
  source: string
  election_source: string
  spatial_sources: string[]
  notes: string | null
}

export interface PollingBoothFeatureCollection {
  type: 'FeatureCollection'
  name?: string
  crs?: {
    type: string
    properties: { name: string }
  }
  metadata?: Record<string, unknown>
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    } | null
    properties: PollingBooth
  }>
}
