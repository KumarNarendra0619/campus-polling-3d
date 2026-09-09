import type { PollingBooth } from '../types/pollingBooth'
import { navigateToBooth } from '../services/googleMaps'

interface NavigationButtonProps {
  booth: PollingBooth
  disabled?: boolean
}

export function NavigationButton({ booth, disabled = false }: NavigationButtonProps) {
  const canNavigate = Number.isFinite(Number(booth.navigation_lat)) && Number.isFinite(Number(booth.navigation_lon))

  return (
    <button
      type="button"
      className="navigation-button"
      disabled={disabled || !canNavigate || booth.status === 'closed' || booth.status === 'inactive'}
      onClick={() => navigateToBooth(booth)}
      aria-label={`Navigate to ${booth.booth_name}`}
    >
      Open Google Maps
    </button>
  )
}
