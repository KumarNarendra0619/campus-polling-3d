export interface MapillaryReference {
  image_id?: string
  sequence_id?: string
  image_url?: string
  thumbnail_url?: string
}

export function parseMapillaryReference(value?: string): MapillaryReference {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') return parsed as MapillaryReference
  } catch {
    // Treat a plain value as an image ID/reference.
  }

  return { image_id: value.trim() }
}
