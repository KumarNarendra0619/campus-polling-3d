import type { CampusLayerName } from '../services/geojson'

export type LayerVisibility = Record<CampusLayerName | 'booths', boolean>

type Props = {
  visibility: LayerVisibility
  onToggle: (layer: keyof LayerVisibility) => void
  is3D: boolean
  onToggleScene: () => void
}

const LAYERS: Array<[keyof LayerVisibility, string]> = [
  ['buildings', 'Buildings'],
  ['roads', 'Roads'],
  ['footpaths', 'Footpaths'],
  ['gates', 'Gates'],
  ['treesGreen', 'Trees & green areas'],
  ['amenities', 'Amenities'],
  ['booths', 'Polling booths'],
]

export function LayerControl({ visibility, onToggle, is3D, onToggleScene }: Props) {
  return (
    <aside className="layer-control" aria-label="Map layers and view controls">
      <div className="layer-title-row">
        <strong>Map layers</strong>
        <button type="button" className="scene-toggle" onClick={onToggleScene} aria-label={`Switch to ${is3D ? '2D' : '3D'} view`}>
          {is3D ? '2D' : '3D'}
        </button>
      </div>
      <div className="layer-options">
        {LAYERS.map(([layer, label]) => (
          <label key={layer} className="layer-option">
            <input type="checkbox" checked={visibility[layer]} onChange={() => onToggle(layer)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </aside>
  )
}
