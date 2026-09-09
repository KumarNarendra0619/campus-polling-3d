import { useEffect, useRef, useState } from 'react'
import { Entity, Ion, Terrain, Viewer } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { CAMPUS_LAYERS, loadGeoJsonLayer, type CampusLayerName } from './services/geojson'
import { createBoothDataSource, loadPollingBooths } from './services/pollingBooths'
import { flyToBooth } from './services/boothRouting'
import { boothIdFromPath, resolveBoothFromPath } from './services/qrResolver'
import { NavigationButton } from './components/NavigationButton'
import { GroundView } from './components/GroundView'
import type { PollingBooth } from './types/pollingBooth'

const LAYER_ORDER: CampusLayerName[] = ['boundary', 'buildings', 'roads', 'footpaths', 'gates', 'treesGreen', 'amenities']

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
        viewer = new Viewer(containerRef.current!, { animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: true, navigationHelpButton: false, sceneModePicker: false, selectionIndicator: true, infoBox: false })
        viewerRef.current = viewer
        viewer.scene.globe.show = true
        viewer.scene.terrainProvider = Terrain.fromWorldTerrain()
        let layerCount = 0
        for (const layer of LAYER_ORDER) {
          if (cancelled) return
          try { await viewer.dataSources.add(await loadGeoJsonLayer(layer)); layerCount += 1 } catch (error) { console.warn(`Could not load ${layer}:`, error) }
        }
        try {
          const boothRecords = await loadPollingBooths()
          if (cancelled) return
          await viewer.dataSources.add(createBoothDataSource(boothRecords))
          setBooths(boothRecords)
          const routeBooth = resolveBoothFromPath(window.location.pathname, boothRecords)
          if (routeBooth) { setSelectedBooth(routeBooth); flyToBooth(viewer, routeBooth) }
          else if (boothIdFromPath(window.location.pathname)) setStatus(`Campus ready — booth ${boothIdFromPath(window.location.pathname)} was not found.`)
          else setStatus(`Campus ready — ${layerCount}/7 campus layers · ${boothRecords.length} polling booths.`)
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
    return () => { cancelled = true; viewer?.destroy(); viewerRef.current = null }
  }, [])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const handler = viewer.screenSpaceEventHandler
    const callback = (movement: any) => {
      const picked = viewer.scene.pick(movement.position)
      const entity = picked?.id as Entity | undefined
      const boothId = entity?.properties?.booth_id?.getValue?.()
      const booth = booths.find((item) => item.booth_id === boothId)
      if (booth) { setSelectedBooth(booth); window.history.pushState({}, '', `/booth/${encodeURIComponent(booth.booth_id.toUpperCase())}`); flyToBooth(viewer, booth) }
    }
    handler.setInputAction(callback, 1)
    return () => handler.removeInputAction(1)
  }, [booths])

  useEffect(() => {
    const onPopState = () => { const booth = resolveBoothFromPath(window.location.pathname, booths); setSelectedBooth(booth ?? null); if (booth && viewerRef.current) flyToBooth(viewerRef.current, booth) }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [booths])

  const closeBooth = () => { setSelectedBooth(null); window.history.pushState({}, '', '/') }

  return (
    <main className="app-shell">
      <header className="app-header"><div><p className="eyebrow">University Election</p><h1>Campus Polling 3D</h1></div><span className="version">MVP v0.1</span></header>
      <section className="viewer-section" aria-label="3D campus viewer">
        <div ref={containerRef} className="cesium-container" />
        <div className="viewer-status" role="status"><strong>{status}</strong><div className="data-path">Data source: {CAMPUS_LAYERS.buildings}</div></div>
        {selectedBooth && <aside className="booth-card" aria-label="Polling booth details">
          <button className="booth-close" onClick={closeBooth} aria-label="Close">×</button>
          <p className="booth-kicker">Polling Booth {selectedBooth.booth_no}</p>
          <h2>{selectedBooth.booth_name}</h2>
          <p><strong>Building:</strong> {selectedBooth.building_name}</p><p><strong>Room:</strong> {selectedBooth.room_no}</p><p><strong>Floor:</strong> {selectedBooth.floor}</p><p><strong>Entrance:</strong> {selectedBooth.entrance_id}</p>
          <span className={selectedBooth.verified ? 'verified' : 'unverified'}>{selectedBooth.verified ? 'Verified booth location' : 'Location needs verification'}</span>
          <GroundView booth={selectedBooth} /><NavigationButton booth={selectedBooth} />
        </aside>}
      </section>
    </main>
  )
}

void Ion
export default App
