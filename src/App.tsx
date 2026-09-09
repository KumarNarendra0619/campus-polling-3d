import { useEffect, useRef, useState } from 'react'
import {
  Color,
  GeoJsonDataSource,
  HeightReference,
  Ion,
  Terrain,
  Viewer,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { CAMPUS_LAYERS, loadGeoJsonLayer, type CampusLayerName } from './services/geojson'

const LAYER_ORDER: CampusLayerName[] = [
  'boundary',
  'buildings',
  'roads',
  'footpaths',
  'gates',
  'treesGreen',
  'amenities',
]

const LAYER_LABELS: Record<CampusLayerName, string> = {
  boundary: 'Campus boundary',
  buildings: 'Buildings',
  roads: 'Roads',
  footpaths: 'Footpaths',
  gates: 'Gates',
  treesGreen: 'Trees / green areas',
  amenities: 'Amenities',
}

function styleLayer(dataSource: GeoJsonDataSource, layer: CampusLayerName) {
  for (const entity of dataSource.entities.values) {
    if (entity.polygon) {
      entity.polygon.material =
        layer === 'buildings'
          ? Color.WHITE.withAlpha(0.82)
          : Color.TRANSPARENT
      entity.polygon.outline = true
      entity.polygon.outlineColor =
        layer === 'boundary' ? Color.DARKGREEN : Color.GRAY

      if (layer === 'buildings') {
        const rawHeight = entity.properties?.height_m?.getValue?.()
        const rawFloors = entity.properties?.floors?.getValue?.()
        const height = Number(rawHeight) || Number(rawFloors) * 3.2 || 8
        entity.polygon.height = 0
        entity.polygon.extrudedHeight = height
      }
    }

    if (entity.polyline) {
      entity.polyline.width = layer === 'roads' ? 4 : 2
      entity.polyline.material =
        layer === 'roads' ? Color.DARKGRAY : Color.LIGHTGRAY
      entity.polyline.clampToGround = true
    }

    if (entity.point) {
      entity.point.pixelSize = layer === 'gates' ? 10 : 7
      entity.point.color =
        layer === 'gates' ? Color.DARKGREEN : Color.DARKGRAY
      entity.point.heightReference = HeightReference.CLAMP_TO_GROUND
    }
  }
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const dataSourcesRef = useRef<GeoJsonDataSource[]>([])
  const [status, setStatus] = useState('Initializing 3D campus viewer…')
  const [loadedLayers, setLoadedLayers] = useState<string[]>([])

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    let viewer: Viewer | undefined
    let cancelled = false

    const initialize = async () => {
      try {
        viewer = new Viewer(containerRef.current!, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: true,
          navigationHelpButton: false,
          sceneModePicker: false,
          selectionIndicator: true,
          infoBox: true,
        })

        viewerRef.current = viewer
        viewer.scene.globe.show = true
        viewer.scene.terrainProvider = Terrain.fromWorldTerrain()

        const loaded: string[] = []

        for (const layer of LAYER_ORDER) {
          if (cancelled) return
          try {
            const dataSource = await loadGeoJsonLayer(layer)
            styleLayer(dataSource, layer)
            await viewer.dataSources.add(dataSource)
            dataSourcesRef.current.push(dataSource)
            loaded.push(LAYER_LABELS[layer])
            if (!cancelled) setLoadedLayers([...loaded])
          } catch (error) {
            console.warn(`Could not load ${layer}:`, error)
          }
        }

        if (!cancelled) {
          setStatus(
            loaded.length > 0
              ? `3D campus ready — ${loaded.length}/7 layers loaded.`
              : '3D viewer ready — waiting for verified campus GeoJSON data.',
          )
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setStatus('3D viewer could not initialize. Check the browser console.')
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
      dataSourcesRef.current = []
      viewer?.destroy()
      viewerRef.current = null
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">University Election</p>
          <h1>Campus Polling 3D</h1>
        </div>
        <span className="version">MVP v0.1</span>
      </header>

      <section className="viewer-section" aria-label="3D campus viewer">
        <div ref={containerRef} className="cesium-container" />
        <div className="viewer-status" role="status">
          <strong>{status}</strong>
          {loadedLayers.length > 0 && (
            <div className="layer-status">{loadedLayers.join(' · ')}</div>
          )}
          <div className="data-path">Data source: {CAMPUS_LAYERS.buildings}</div>
        </div>
      </section>
    </main>
  )
}

void Ion

export default App
