'use client'

import { useEffect, useRef, useState } from 'react'
import { ConfigurationData, FilterState } from '@/types/dashboard'
import { INDONESIA_PROVINCES, INDONESIA_CENTER, MAP_ZOOM_LEVELS } from '@/lib/indonesia-geodata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface NationalMapViewProps {
  configData: ConfigurationData
  filterState: FilterState
  onProvinceSelect: (provinceId: string) => void
}

export function NationalMapView({ configData, filterState, onProvinceSelect }: NationalMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [showOverlays, setShowOverlays] = useState(true)

  useEffect(() => {
    if (!mapRef.current) return

    // Dynamic import of Leaflet for client-side rendering
    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Create map instance
      const map = L.map(mapRef.current!, {
        center: INDONESIA_CENTER,
        zoom: MAP_ZOOM_LEVELS.national,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      setMapInstance(map)

       // Add province markers and interactions
      INDONESIA_PROVINCES.forEach((province) => {
        // Calculate color intensity based on POI density (darker blue = more POI)
        const intensity = Math.min(province.poiDensity / 100, 1)
        
        // Create blue color gradient based on POI density
        const blueValues = {
          r: Math.floor(59 * (1 - intensity * 0.8)), // Darker red component
          g: Math.floor(130 * (1 - intensity * 0.6)), // Darker green component  
          b: Math.floor(246 * (1 - intensity * 0.2)) // Keep blue dominant
        }
        
        const provinceColor = `rgb(${blueValues.r}, ${blueValues.g}, ${blueValues.b})`
        const provinceFillOpacity = 0.4 + (intensity * 0.4) // More opacity for higher POI
        
        // Status indicator color
        const statusColors = {
          green: '#10B981',
          yellow: '#F59E0B',
          red: '#EF4444'
        }

        // Create province area with color-coded POI density
        const provinceArea = L.circle([province.coordinates[0], province.coordinates[1]], {
          radius: 60000 + (province.poiDensity * 800), // Size based on POI density
          fillColor: provinceColor,
          color: provinceColor,
          weight: 2,
          opacity: 0.8,
          fillOpacity: provinceFillOpacity
        })

        // Create custom marker for province center (status indicator)
        const provinceMarker = L.circleMarker([province.coordinates[0], province.coordinates[1]], {
          radius: 10,
          fillColor: statusColors[province.realizationStatus],
          color: 'white',
          weight: 3,
          opacity: 1,
          fillOpacity: 1
        })

        // Tooltip content
        const tooltipContent = `
          <div class="font-semibold">${province.name}</div>
          <div class="text-sm text-gray-600 mt-1">
            <div>Realization: ${province.realizationValue}%</div>
            <div>Status: <span class="font-medium" style="color: ${statusColors[province.realizationStatus]}">${province.realizationStatus.toUpperCase()}</span></div>
            <div>POI Density: ${province.poiDensity}</div>
            <div>Target: Rp ${province.targetProfit.toLocaleString('id-ID')}</div>
          </div>
        `

        // Add interactions
        provinceMarker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10],
          className: 'province-tooltip'
        })

        provinceArea.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10],
          className: 'province-tooltip'
        })

        // Click handlers
        const handleClick = () => {
          setSelectedProvince(province.id)
          onProvinceSelect(province.id)
        }

        provinceMarker.on('click', handleClick)
        provinceArea.on('click', handleClick)

        // Hover effects
        provinceMarker.on('mouseover', () => setHoveredProvince(province.id))
        provinceMarker.on('mouseout', () => setHoveredProvince(null))
        provinceArea.on('mouseover', () => setHoveredProvince(province.id))
        provinceArea.on('mouseout', () => setHoveredProvince(null))

        // Add to map
        provinceArea.addTo(map)
        provinceMarker.addTo(map)
      })

      // Custom CSS for tooltips
      const style = document.createElement('style')
      style.textContent = `
        .province-tooltip {
          background: white;
          border: none;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 8px 12px;
        }
        .province-tooltip .leaflet-tooltip-content {
          margin: 0;
        }
      `
      document.head.appendChild(style)
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [])

  // Filter provinces based on current filters
  const filteredProvinces = INDONESIA_PROVINCES.filter(province => {
    // Add filtering logic based on filterState
    return true // For now, show all provinces
  })

  // Calculate statistics
  const totalProvinces = INDONESIA_PROVINCES.length
  const greenProvinces = INDONESIA_PROVINCES.filter(p => p.realizationStatus === 'green').length
  const yellowProvinces = INDONESIA_PROVINCES.filter(p => p.realizationStatus === 'yellow').length
  const redProvinces = INDONESIA_PROVINCES.filter(p => p.realizationStatus === 'red').length
  const avgRealization = Math.round(INDONESIA_PROVINCES.reduce((sum, p) => sum + p.realizationValue, 0) / totalProvinces)

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

        {/* Enhanced Statistics Overlay with Charts */}
      <div className="absolute top-4 left-4 z-30 space-y-3 max-h-screen overflow-y-auto">
        {/* National Overview Card */}
        <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">National Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Target Profit */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Target Profit:</span>
              <span className="font-semibold">Rp {configData.targetProfit.toLocaleString('id-ID')}</span>
            </div>

            {/* Average Realization */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Realization:</span>
              <Badge variant={avgRealization >= 80 ? 'default' : avgRealization >= 60 ? 'secondary' : 'destructive'}>
                {avgRealization}%
              </Badge>
            </div>

            {/* Province Status Distribution Chart */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Province Performance Distribution</div>
              
              {/* Visual Bar Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>On Target ({greenProvinces})</span>
                  </div>
                  <span className="font-medium">{Math.round((greenProvinces / totalProvinces) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(greenProvinces / totalProvinces) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Warning ({yellowProvinces})</span>
                  </div>
                  <span className="font-medium">{Math.round((yellowProvinces / totalProvinces) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${(yellowProvinces / totalProvinces) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Below Target ({redProvinces})</span>
                  </div>
                  <span className="font-medium">{Math.round((redProvinces / totalProvinces) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(redProvinces / totalProvinces) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* POI Density Stats */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">POI Density Overview</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-gray-600">Highest POI</div>
                  <div className="font-bold text-blue-600">
                    {Math.max(...INDONESIA_PROVINCES.map(p => p.poiDensity))}
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-gray-600">Avg POI</div>
                  <div className="font-bold text-blue-600">
                    {Math.round(INDONESIA_PROVINCES.reduce((sum, p) => sum + p.poiDensity, 0) / totalProvinces)}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Sectors */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Active Filters</div>
              <div className="flex flex-wrap gap-1">
                {configData.selectedSectors.slice(0, 2).map((sectorId) => (
                  <Badge key={sectorId} variant="outline" className="text-xs">
                    {sectorId.slice(0, 12)}...
                  </Badge>
                ))}
                {configData.selectedSectors.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{configData.selectedSectors.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Provinces Performance Chart */}
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Provinces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {INDONESIA_PROVINCES
                .sort((a, b) => b.realizationValue - a.realizationValue)
                .slice(0, 5)
                .map((province, index) => (
                  <div key={province.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 text-xs text-gray-500">#{index + 1}</span>
                        <span className="font-medium">{province.name.length > 15 ? province.name.slice(0, 15) + '...' : province.name}</span>
                      </div>
                      <Badge 
                        variant={province.realizationStatus === 'green' ? 'default' : province.realizationStatus === 'yellow' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {province.realizationValue}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          province.realizationStatus === 'green' ? 'bg-green-500' : 
                          province.realizationStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${province.realizationValue}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

         {/* Enhanced Map Legend */}
        <Card className="w-96">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Interactive Map Legend</div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Province Status Indicators</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    <span>On Target (≥80% realization)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                    <span>Warning (60-79% realization)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                    <span>Below Target (&lt;60% realization)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">POI Density Color Coding</div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-600 mb-2">Darker blue areas = Higher POI concentration</div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgb(179, 205, 246)'}}></div>
                      <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgb(99, 155, 246)'}}></div>
                      <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgb(59, 130, 246)'}}></div>
                      <div className="w-4 h-4 rounded" style={{backgroundColor: 'rgb(29, 100, 196)'}}></div>
                    </div>
                    <span className="text-xs text-gray-600">Low → High POI</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Circle size also indicates POI density level
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">Interaction Guide</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Hover over provinces for quick info</div>
                  <div>• Click any province for detailed analysis</div>
                  <div>• Larger circles = more business opportunities</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       {/* Map Legend - Moved to right side */}
      <div className="absolute top-4 right-4 z-30">
        <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Interactive Map Legend</div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Province Status Indicators</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                    <span>On Target (≥80%)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border border-white"></div>
                    <span>Warning (60-79%)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                    <span>Below Target (&lt;60%)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">POI Density Color Coding</div>
                <div className="text-xs text-gray-600 mb-1">Darker blue = Higher POI concentration</div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded" style={{backgroundColor: 'rgb(179, 205, 246)'}}></div>
                  <div className="w-3 h-3 rounded" style={{backgroundColor: 'rgb(99, 155, 246)'}}></div>
                  <div className="w-3 h-3 rounded" style={{backgroundColor: 'rgb(59, 130, 246)'}}></div>
                  <div className="w-3 h-3 rounded" style={{backgroundColor: 'rgb(29, 100, 196)'}}></div>
                  <span className="text-xs text-gray-600 ml-2">Low → High POI</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">Interaction Guide</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Click provinces for detailed analysis</div>
                  <div>• Hover for quick information</div>
                  <div>• Larger circles = more opportunities</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Instructions - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-30">
        <Card className="w-64 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Navigation Tips</div>
              <div className="space-y-1">
                <div>• Click any province to view detailed analysis</div>
                <div>• Blue intensity shows POI density levels</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}