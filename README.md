# Campus Polling 3D

## 3D Campus Polling Booth Navigation MVP

A campus-scale 3D navigation prototype for 14 university election polling booths.

### V1 scope
- Verified campus GIS data
- Interactive 3D campus visualization
- 14 polling booth locations
- Mapillary ground-level visual reference
- QR-based booth access
- Google Maps walking-navigation handoff
- Mobile-first student interface

### Technology
- React + TypeScript + Vite
- CesiumJS
- GeoJSON
- Mapillary
- Google Maps URLs
- GitHub

### Development principle
Build incrementally, test each module, and keep raw source data separate from processed/public datasets.

## Repository structure

```text
public/
  models/
  qr/
data/
  processed/
  mapillary/
docs/
src/
  components/
  pages/
  services/
  types/
  utils/
```

## Status

STEP-09A — Repository initialization.