import { useEffect, useRef, useState } from 'react'
import { Cartesian3, EllipsoidTerrainProvider, Entity, Ion, SceneMode, Viewer, type DataSource } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { loadGeoJsonLayer, type CampusLayerName } from './services/geojson'
import { createBoothDataSource, loadPollingBooths } from './services/pollingBooths'
import { flyToBooth } from './services/boothRouting'
import { boothIdFromPath, resolveBoothFromPath } from './services/qrResolver'
import { NavigationButton } from './components/NavigationButton'
import { GroundView } from './components/GroundView'
import { BoothExplorer } from './components/BoothExplorer'
import { LayerControl, type LayerVisibility } from './components/LayerControl'
import type { PollingBooth } from './types/pollingBooth'

const LAYER_ORDER: CampusLayerName[] = ['boundary', 'buildings', 'roads', 'footpaths', 'gates', 'treesGreen', 'amenities']
const CAMPUS_CENTER = { lon: 78.78235, lat: 30.22129 }
const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  boundary: true,
  buildings: true,
  roads: true,
  footpaths: true,
  gates: true,
  treesGreen: true,
  amenities: true,
  booths: true,
}

function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const layerRefs = useRef(new Map<CampusLayerName, DataSource>())
  const boothLayerRef = useRef<DataSource | null>(null)
  const [status, setStatus] = useState('Initializing 3D campus viewer…')
  const [booths, setBooths] = useState<PollingBooth[]>([])
  const [selectedBooth, setSelectedBooth] = useState<PollingBooth | null>(null)
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY)
  const [is3D, setIs3D] = useState(true)

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    let viewer: Viewer | undefined
    let cancelled = false
    const initialize = async () => {
      try {
        const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined
        if (ionToken) Ion.defaultAccessToken = ionToken
        viewer = new Viewer(containerRef.current!, { animation: false, timeline: false, baseLayerPicker: false, geocoder: false, homeButton: true, navigationHelpButton: false, sceneModePicker: false, selectionIndicator: true, infoBox: false })
        viewerRef.current = viewer
        viewer.scene.globe.show = true
        viewer.scene.terrainProvider = ionToken ? await TerrainProviderFromIon() : new EllipsoidTerrainProvider()
        viewer.camera.flyTo({ destination: Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat, 650), duration: 0.8 })
        let layerCount = 0
        for (const layer of LAYER_ORDER) {
          if (cancelled) return
          try {
            const dataSource = await loadGeoJsonLayer(layer)
            layerRefs.current.set(layer, dataSource)
            dataSource.show = DEFAULT_LAYER_VISIBILITY[layer]
            await viewer.dataSources.add(dataSource)
            layerCount += 1
          } catch (error) {
            console.warn(`Could not load ${layer}:`, error)
          }
        }
        try {
          const boothRecords = await loadPollingBooths()
          if (cancelled) return
          const boothDataSource = createBoothDataSource(boothRecords)
          boothLayerRef.current = boothDataSource
          boothDataSource.show = DEFAULT_LAYER_VISIBILITY.booths
          await viewer.dataSources.add(boothDataSource)
          setBooths(boothRecords)
          const routeId = boothIdFromPath(window.location.pathname)
          const routeBooth = resolveBoothFromPath(window.location.pathname, boothRecords)
          if (routeBooth) {
            setSelectedBooth(routeBooth)
            flyToBooth(viewer, routeBooth)
            setStatus(`Booth ${routeBooth.booth_no} loaded — DEMO spatial record.`)
          } else if (routeId) {
            setStatus(`Booth ${routeId} was not found. Check the booth QR/link and choose a valid booth.`)
          } else {
            setStatus(`Campus ready — ${layerCount}/7 campus layers · ${boothRecords.length} polling booths · DEMO spatial data.`)
          }
        } catch (error) {
          if (!cancelled) {
            setBooths([])
            setSelectedBooth(null)
            setStatus(`Campus ready — ${layerCount}/7 campus layers · polling booth data unavailable. ${safeErrorMessage(error, 'Check the booth dataset.')}`)
          }
        }
      } catch (error) {
        if (!cancelled) setStatus(`3D viewer could not initialize. ${safeErrorMessage(error, 'Check browser compatibility and viewer configuration.')}`)
      }
    }
    void initialize()
    return () => {
      cancelled = true
      layerRefs.current.clear()
      boothLayerRef.current = null
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
      const booth = booths.find((item) => item.booth_id === boothId)
      if (booth) {
        setSelectedBooth(booth)
        window.history.pushState({}, '', `/booth/${encodeURIComponent(booth.booth_id)}`)
        flyToBooth(viewer, booth)
      }
    }
    handler.setInputAction(callback, 1)
    return () => handler.removeInputAction(1)
  }, [booths])

  useEffect(() => {
    const onPopState = () => {
      const routeId = boothIdFromPath(window.location.pathname)
      const booth = resolveBoothFromPath(window.location.pathname, booths)
      setSelectedBooth(booth ?? null)
      if (booth && viewerRef.current) {
        flyToBooth(viewerRef.current, booth)
        setStatus(`Booth ${booth.booth_no} loaded — DEMO spatial record.`)
      } else if (routeId) {
        setStatus(`Booth ${routeId} was not found. Choose a valid booth.`)
      } else {
        setStatus(`Campus ready — ${booths.length} polling booths available.`)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [booths])

  useEffect(() => {
    for (const [layer, dataSource] of layerRefs.current) dataSource.show = visibility[layer]
    if (boothLayerRef.current) boothLayerRef.current.show = visibility.booths
  }, [visibility])

  const selectBooth = (booth: PollingBooth) => {
    setSelectedBooth(booth)
    if (viewerRef.current) flyToBooth(viewerRef.current, booth)
    setStatus(`Booth ${booth.booth_no} selected — DEMO spatial record.`)
  }

  const closeBooth = () => {
    setSelectedBooth(null)
    window.history.pushState({}, '', '/')
  }

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }

  const toggleScene = () => {
    const nextIs3D = !is3D
    setIs3D(nextIs3D)
    if (viewerRef.current) viewerRef.current.scene.mode = nextIs3D ? SceneMode.SCENE3D : SceneMode.SCENE2D
  }

  return (
    <main className="app-shell">
      <header className="app-header"><div><p className="eyebrow">University Election</p><h1>Campus Polling 3D</h1><p className="subtitle">Find your polling booth · 3D campus guide</p></div><span className="version">MVP v0.1 · DEMO</span></header>
      <section className="viewer-section" aria-label="3D campus viewer">
        <div ref={containerRef} className="cesium-container" />
        <div className="map-badge">HNBGU · Birla Campus</div>
        <BoothExplorer booths={booths} selectedBooth={selectedBooth} onSelect={selectBooth} />
        <LayerControl visibility={visibility} onToggle={toggleLayer} is3D={is3D} onToggleScene={toggleScene} />
        <div className="viewer-status" role="status"><strong>{status}</strong><div className="data-path">Campus geometry and booth locations are DEMO data pending spatial verification.</div></div>
        {selectedBooth && <aside className="booth-card" aria-label="Polling booth details"><button className="booth-close" onClick={closeBooth} aria-label="Close">×</button><p className="booth-kicker">Polling Booth {selectedBooth.booth_no}</p><h2>{selectedBooth.booth_name}</h2><p><strong>Building:</strong> {selectedBooth.building_name}</p><p><strong>Room:</strong> {selectedBooth.room_no ?? '—'}</p><p><strong>Floor:</strong> {selectedBooth.floor ?? '—'}</p><p><strong>Entrance:</strong> {selectedBooth.entrance_id ?? '—'}</p><span className={selectedBooth.verified ? 'verified' : 'unverified'}>{selectedBooth.verified ? 'Verified booth location' : 'DEMO — location needs verification'}</span><GroundView booth={selectedBooth} /><NavigationButton booth={selectedBooth} /></aside>}
      </section>
    </main>
  )
}

async function TerrainProviderFromIon() { const { Terrain } = await import('cesium'); return Terrain.fromWorldTerrain() }
export default App
