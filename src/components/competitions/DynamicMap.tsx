'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
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

// Define bounds for South Korea to prevent panning to other countries
const SOUTH_KOREA_BOUNDS = L.latLngBounds(
  [33.0, 124.5], // South West (below Jeju)
  [39.0, 132.0]  // North East (above Seoul, includes Dokdo)
)

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

interface GroupedMarker {
  location: string
  lat: number
  lng: number
  competitions: {
    id: string
    title: string
    date: string
  }[]
}

// Component to automatically fit bounds to markers (only within Korea)
function MapBounds({ markers }: { markers: GroupedMarker[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
      
      // Ensure the calculated bounds don't exceed South Korea
      if (!SOUTH_KOREA_BOUNDS.contains(bounds)) {
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      } else {
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }
  }, [markers, map])
  
  return null
}

const PREDEFINED_LOCATIONS: Record<string, { lat: number, lng: number }> = {
  '부산사직실내수영장': { lat: 35.1911, lng: 129.0602 },
  '부산 사직실내수영장': { lat: 35.1911, lng: 129.0602 },
  '부산': { lat: 35.1911, lng: 129.0602 }, // General fallback
  '목포실내수영장': { lat: 34.8016, lng: 126.3920 },
  '창원실내수영장': { lat: 35.2410, lng: 128.6750 },
  '울산문수실내수영장': { lat: 35.5350, lng: 129.2560 },
  '김천실내수영장': { lat: 36.1360, lng: 128.1060 },
  '광주남부대국제수영장': { lat: 35.2155, lng: 126.8373 },
  '남부대국제수영장': { lat: 35.2155, lng: 126.8373 },
  '전주완산수영장': { lat: 35.8080, lng: 127.1230 },
  '제주실내수영장': { lat: 33.4840, lng: 126.5160 },
  '여수진남수영장': { lat: 34.7700, lng: 127.7020 },
  '진남수영장': { lat: 34.7700, lng: 127.7020 }
}

export default function DynamicMap({ competitions }: DynamicMapProps) {
  const [groupedMarkers, setGroupedMarkers] = useState<GroupedMarker[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const geocodeLocations = async () => {
      setIsLoading(true)
      const validCompetitions = competitions.filter(c => c.location && c.location.trim() !== '')
      
      // Cache coordinates to avoid redundant API calls
      const geocodeCache: Record<string, { lat: number, lng: number }> = {}
      const groupMap = new Map<string, GroupedMarker>()

      for (const comp of validCompetitions) {
        if (!comp.location) continue
        
        const cacheKey = comp.location.trim()
        
        // Add competition to an existing group if location was already geocoded
        if (groupMap.has(cacheKey)) {
          const existingGroup = groupMap.get(cacheKey)!
          existingGroup.competitions.push({
            id: comp.id,
            title: comp.title,
            date: comp.date
          })
          continue
        }

        try {
          let lat: number, lng: number
          
          // 1. Check predefined locations
          const predefined = Object.keys(PREDEFINED_LOCATIONS).find(k => cacheKey.includes(k))
          if (predefined) {
            lat = PREDEFINED_LOCATIONS[predefined].lat
            lng = PREDEFINED_LOCATIONS[predefined].lng
          } else if (geocodeCache[cacheKey]) {
            lat = geocodeCache[cacheKey].lat
            lng = geocodeCache[cacheKey].lng
          } else {
            // Use Nominatim API for open-source geocoding
            const searchQuery = cacheKey.includes('한국') || cacheKey.includes('대한민국') 
              ? cacheKey 
              : `대한민국 ${cacheKey}`
              
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
            const data = await response.json()
            
            if (data && data.length > 0) {
              lat = parseFloat(data[0].lat)
              lng = parseFloat(data[0].lon)
              geocodeCache[cacheKey] = { lat, lng }
              
              // Respect Nominatim API rate limits (1 request per second)
              await new Promise(resolve => setTimeout(resolve, 1000))
            } else {
              continue // Skip if not found
            }
          }
          
          groupMap.set(cacheKey, {
            location: cacheKey,
            lat,
            lng,
            competitions: [{
              id: comp.id,
              title: comp.title,
              date: comp.date
            }]
          })

        } catch (error) {
          console.error('Geocoding error for:', cacheKey, error)
        }
      }
      
      setGroupedMarkers(Array.from(groupMap.values()))
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
        minZoom={6} // Prevent zooming out too far
        maxBounds={SOUTH_KOREA_BOUNDS} // Restrict panning to South Korea only
        maxBoundsViscosity={1.0} // Make the bounds solid (no bounce)
        style={{ height: '100%', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {groupedMarkers.map((group) => (
          <Marker 
            key={group.location} 
            position={[group.lat, group.lng]}
            icon={customIcon}
          >
            <Tooltip permanent direction="top" offset={[0, -40]} className="!bg-white/95 !backdrop-blur-sm !border-0 !shadow-md !text-slate-800 !font-bold !rounded-xl !px-3 !py-1.5 !whitespace-nowrap !text-xs text-center z-50">
              <div className="flex flex-col items-center gap-0.5">
                <span>{group.location}</span>
                <span className="text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
                  {group.competitions.length}개 대회
                </span>
              </div>
            </Tooltip>
            <Popup className="rounded-2xl min-w-[220px]">
              <div className="p-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-white z-10 flex flex-col gap-1 pb-3 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{group.location}</span>
                  </div>
                  <div className="inline-flex w-fit bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                    총 {group.competitions.length}개 대회 개최
                  </div>
                </div>
                
                <div className="space-y-2">
                  {group.competitions.map(comp => (
                    <div key={comp.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:border-rose-200 transition-colors">
                      <h3 className="font-black text-slate-800 mb-1.5 text-[13px] leading-tight">{comp.title}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(comp.date), 'yyyy년 M월 d일')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapBounds markers={groupedMarkers} />
      </MapContainer>
    </div>
  )
}
