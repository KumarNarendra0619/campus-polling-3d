export interface PollingBooth {
  booth_id: string
  booth_no: string
  booth_name: string
  building_id?: string
  building_name: string
  room_no: string
  floor: string
  entrance_id: string
  latitude: number
  longitude: number
  navigation_lat: number
  navigation_lon: number
  mapillary_ref?: string
  status: 'active' | 'inactive' | 'temporary' | 'closed'
  verified: boolean
}

export interface PollingBoothFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: PollingBooth
  }>
}
