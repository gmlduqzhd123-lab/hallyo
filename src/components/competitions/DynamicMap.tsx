'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'

// Fix for default marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Competition {
  id: string
  title: string
  date: string
  end_date?: string
  location?: string
}

interface DynamicMapProps {
  competitions: Competition[]
}

interface GeocodedMarker {
  id: string
  title: string
  date: string
  location: string
  lat: number
  lng: number
}

// Component to automatically fit bounds to markers
function MapBounds({ markers }: { markers: GeocodedMarker[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [markers, map])
  
  return null
}

export default function DynamicMap({ competitions }: DynamicMapProps) {
  const [markers, setMarkers] = useState<GeocodedMarker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const geocodeLocations = async () => {
      setIsLoading(true)
      const validCompetitions = competitions.filter(c => c.location && c.location.trim() !== '')
      
      const newMarkers: GeocodedMarker[] = []
      
      // Simple cache to avoid redundant API calls
      const geocodeCache: Record<string, { lat: number, lng: number }> = {}

      for (const comp of validCompetitions) {
        if (!comp.location) continue
        
        const cacheKey = comp.location.trim()
        
        try {
          if (geocodeCache[cacheKey]) {
            newMarkers.push({
              id: comp.id,
              title: comp.title,
              date: comp.date,
              location: cacheKey,
              lat: geocodeCache[cacheKey].lat,
              lng: geocodeCache[cacheKey].lng
            })
            continue
          }

          // Use Nominatim API for open-source geocoding
          // Add '대한민국' to improve accuracy for local searches
          const searchQuery = cacheKey.includes('한국') || cacheKey.includes('대한민국') 
            ? cacheKey 
            : `대한민국 ${cacheKey}`
            
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
          const data = await response.json()
          
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat)
            const lng = parseFloat(data[0].lon)
            
            geocodeCache[cacheKey] = { lat, lng }
            
            newMarkers.push({
              id: comp.id,
              title: comp.title,
              date: comp.date,
              location: cacheKey,
              lat,
              lng
            })
          }
          
          // Respect Nominatim API rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error('Geocoding error for:', cacheKey, error)
        }
      }
      
      setMarkers(newMarkers)
      setIsLoading(false)
    }

    geocodeLocations()
  }, [competitions])

  return (
    <div className="relative w-full h-[600px] md:h-[800px] rounded-3xl overflow-hidden shadow-sm border border-slate-100 bg-white z-0">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-rose-500 mb-4"></div>
          <p className="text-slate-600 font-bold">지도 정보를 불러오는 중입니다...</p>
        </div>
      )}
      
      <MapContainer 
        center={[36.5, 127.5]} // Default center of South Korea
        zoom={7} 
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lng]}
            icon={customIcon}
          >
            <Popup className="rounded-2xl">
              <div className="p-1">
                <h3 className="font-black text-rose-600 mb-2 text-base">{marker.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-600 mb-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(marker.date), 'yyyy년 M월 d일')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{marker.location}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapBounds markers={markers} />
      </MapContainer>
    </div>
  )
}
