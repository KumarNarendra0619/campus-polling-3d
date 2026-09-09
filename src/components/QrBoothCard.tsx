import type { PollingBooth } from '../types/pollingBooth'
import { boothUrl } from '../services/qrResolver'

interface QrBoothCardProps {
  booth: PollingBooth
}

export function QrBoothCard({ booth }: QrBoothCardProps) {
  const url = boothUrl(booth.booth_id)

  return (
    <section className="qr-booth-card" aria-label={`QR link for ${booth.booth_name}`}>
      <div>
        <strong>{booth.booth_no} — {booth.booth_name}</strong>
        <p>{url}</p>
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(url)}
        aria-label={`Copy QR URL for ${booth.booth_name}`}
      >
        Copy link
      </button>
    </section>
  )
}
