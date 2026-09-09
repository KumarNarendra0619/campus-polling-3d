import { useEffect, useRef, useState } from 'react'
import { Viewer, Ion, Terrain } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [status, setStatus] = useState('Initializing 3D campus viewer…')

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    let viewer: Viewer | undefined

    try {
      viewer = new Viewer(containerRef.current, {
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
      setStatus('3D viewer ready — campus data will be connected next.')
    } catch (error) {
      console.error(error)
      setStatus('3D viewer could not initialize. Check the browser console.')
    }

    return () => {
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
        <div className="viewer-status" role="status">{status}</div>
      </section>
    </main>
  )
}

void Ion

export default App
