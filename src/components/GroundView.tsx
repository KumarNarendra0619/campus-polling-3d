import { parseMapillaryReference } from '../types/mapillary'
import type { PollingBooth } from '../types/pollingBooth'

interface GroundViewProps {
  booth: PollingBooth
}

function mapillaryUrl(reference: ReturnType<typeof parseMapillaryReference>) {
  if (reference.image_id) return `https://www.mapillary.com/app/?pKey=${encodeURIComponent(reference.image_id)}`
  return null
}

export function GroundView({ booth }: GroundViewProps) {
  const reference = parseMapillaryReference(booth.mapillary_ref)
  const url = mapillaryUrl(reference)

  if (!url) {
    return (
      <section className="ground-view" aria-label="Ground view">
        <strong>Ground View unavailable</strong>
        <p>No verified Mapillary reference has been added for this booth yet.</p>
      </section>
    )
  }

  return (
    <section className="ground-view" aria-label={`Ground View for ${booth.booth_name}`}>
      <div>
        <strong>Ground View</strong>
        <p>Open the verified Mapillary approach/entrance view.</p>
      </div>
      <a
        className="ground-view-button"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Mapillary
      </a>
    </section>
  )
}
