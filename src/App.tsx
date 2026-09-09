import { useEffect, useRef, useState } from 'react'
import { Color, Entity, Ion, Terrain, Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { CAMPUS_LAYERS, loadGeoJsonLayer, type CampusLayerName } from './services/geojson'
import { createBoothDataSource, loadPollingBooths } from './services/pollingBooths'
import type { PollingBooth } from './types/pollingBooth'

const LAYER_ORDER: CampusLayerName[] = [
  'boundary', 'buildings', 'roads', 'footpaths', 'gates', 'treesGreen', 'amenities',
]

const LAYER_LABELS: Record<CampusLayerName, string> = {
  boundary: 'Campus boundary', buildings: 'Buildings', roads: 'Roads', footpaths: 'Footpaths',
  gates: 'Gates', treesGreen: 'Trees / green areas', amenities: 'Amenities',
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [status, setStatus] = useState('Initializing 3D campus viewer…')
  const [booths, setBooths] = useState<PollingBooth[]>([])
  const [selectedBooth, setSelectedBooth] = useState<PollingBooth | null>(null)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    let viewer: Viewer | undefined
    let cancelled = false

    const initialize = async () => {
      try {
        viewer = new Viewer(containerRef.current!, {
          animation: false, timeline: false, baseLayerPicker: false, geocoder: false,
          homeButton: true, navigationHelpButton: false, sceneModePicker: false,
          selectionIndicator: true, infoBox: false,
        })
        viewerRef.current = viewer
        viewer.scene.globe.show = true
        viewer.scene.terrainProvider = Terrain.fromWorldTerrain()

        let layerCount = 0
        for (const layer of LAYER_ORDER) {
          if (cancelled) return
          try {
            const ds = await loadGeoJsonLayer(layer)
            await viewer.dataSources.add(ds)
            layerCount += 1
          } catch (error) {
            console.warn(`Could not load ${layer}:`, error)
          }
        }

        try {
          const boothRecords = await loadPollingBooths()
          if (!cancelled) {
            const boothSource = createBoothDataSource(boothRecords)
            await viewer.dataSources.add(boothSource)
            setBooths(boothRecords)
            setStatus(`Campus ready — ${layerCount}/7 campus layers · ${boothRecords.length} polling booths.`)
          }
        } catch (error) {
          console.warn('Could not load polling booths:', error)
          if (!cancelled) setStatus(`Campus ready — ${layerCount}/7 campus layers · polling booth data unavailable.`)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) setStatus('3D viewer could not initialize. Check the browser console.')
      }
    }

    void initialize()

    const clickHandler = viewer ? undefined : undefined
    void clickHandler

    return () => {
      cancelled = true
      viewer?.destroy()
      viewerRef.current = null
    }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const handler = viewer.screenSpaceEventHandler
    const callback = (movement: any) => {
      const picked = viewer.scene.pick(movement.position)
      const entity = picked?.id as Entity | undefined
      const boothId = entity?.properties?.booth_id?.getValue?.()
      if (!boothId) return
      const booth = booths.find((item) => item.booth_id === boothId)
      if (booth) setSelectedBooth(booth)
    }
    handler.setInputAction(callback, 1)
    return () => handler.removeInputAction(1)
  }, [booths])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div><p className="eyebrow">University Election</p><h1>Campus Polling 3D</h1></div>
        <span className="version">MVP v0.1</span>
      </header>
      <section className="viewer-section" aria-label="3D campus viewer">
        <div ref={containerRef} className="cesium-container" />
        <div className="viewer-status" role="status">
          <strong>{status}</strong>
          <div className="data-path">Data source: {CAMPUS_LAYERS.buildings}</div>
        </div>
        {selectedBooth && (
          <aside className="booth-card" aria-label="Polling booth details">
            <button className="booth-close" onClick={() => setSelectedBooth(null)} aria-label="Close">×</button>
            <p className="booth-kicker">Polling Booth {selectedBooth.booth_no}</p>
            <h2>{selectedBooth.booth_name}</h2>
            <p><strong>Building:</strong> {selectedBooth.building_name}</p>
            <p><strong>Room:</strong> {selectedBooth.room_no}</p>
            <p><strong>Floor:</strong> {selectedBooth.floor}</p>
            <p><strong>Entrance:</strong> {selectedBooth.entrance_id}</p>
            <span className={selectedBooth.verified ? 'verified' : 'unverified'}>
              {selectedBooth.verified ? 'Verified booth location' : 'Location needs verification'}
            </span>
          </aside>
        )}
      </section>
    </main>
  )
}

void Ion

export default App
