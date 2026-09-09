import { useMemo, useState } from 'react'
import type { PollingBooth } from '../types/pollingBooth'

type Props = { booths: PollingBooth[]; selectedBooth: PollingBooth | null; onSelect: (booth: PollingBooth) => void }

export function BoothExplorer({ booths, selectedBooth, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return booths
    return booths.filter((booth) => `${booth.booth_id} ${booth.booth_name} ${booth.building_name} ${booth.room_no ?? ''}`.toLowerCase().includes(q))
  }, [booths, query])

  const select = (booth: PollingBooth) => {
    onSelect(booth)
    window.history.pushState({}, '', `/booth/${encodeURIComponent(booth.booth_id)}`)
  }

  return (
    <aside className="booth-explorer" aria-label="Polling booth explorer">
      <div className="explorer-header"><div><p className="explorer-kicker">Find a polling booth</p><h2>Booth Explorer</h2></div><span className="booth-count">{booths.length}</span></div>
      <label className="search-label" htmlFor="booth-search">Search booth or building</label>
      <input id="booth-search" className="booth-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="PB07, Social Science…" />
      <div className="booth-list">
        {filtered.map((booth) => (
          <button key={booth.booth_id} type="button" className={`booth-list-item ${selectedBooth?.booth_id === booth.booth_id ? 'active' : ''}`} onClick={() => select(booth)}>
            <span className="booth-number">PB{String(booth.booth_no).padStart(2, '0')}</span>
            <span className="booth-list-copy"><strong>{booth.building_name}</strong><small>{booth.room_label ?? booth.room_no ?? 'Room details pending'}</small></span>
            <span className={booth.verified ? 'mini-status verified-dot' : 'mini-status'} aria-label={booth.verified ? 'Verified' : 'Demo location'} />
          </button>
        ))}
        {filtered.length === 0 && <p className="empty-search">No matching polling booth.</p>}
      </div>
    </aside>
  )
}
