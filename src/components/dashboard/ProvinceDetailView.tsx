'use client'

import { useEffect, useRef, useState } from 'react'
import { ConfigurationData, FilterState } from '@/types/dashboard'
import { getProvinceById } from '@/lib/indonesia-geodata'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProvinceDetailViewProps {
  provinceId: string
  configData: ConfigurationData
  filterState: FilterState
  onBranchSelect: (branchId: string) => void
}

export function ProvinceDetailView({ 
  provinceId, 
  configData, 
  filterState, 
  onBranchSelect 
}: ProvinceDetailViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)

  const province = getProvinceById(provinceId)

  // Mock infrastructure data for the province
  const mockInfrastructure = [
    { id: 'KC001', name: 'KC Jakarta Pusat', type: 'KC', coordinates: [-6.2088, 106.8456], customers: 1250 },
    { id: 'KC002', name: 'KC Jakarta Utara', type: 'KC', coordinates: [-6.1344, 106.8640], customers: 980 },
    { id: 'ATM001', name: 'ATM Mall Central Park', type: 'ATM', coordinates: [-6.1768, 106.7800], customers: 0 },
    { id: 'AGENT001', name: 'Agent46 Kelapa Gading', type: 'Agent46', coordinates: [-6.1588, 106.9000], customers: 340 }
  ]

  // Mock value chain data
  const mockValueChain = [
    { id: 'PROD001', type: 'producer', coordinates: [-6.2500, 106.8000], isWondrUser: true, businessType: 'Manufacturing' },
    { id: 'DIST001', type: 'distributor', coordinates: [-6.1800, 106.8200], isWondrUser: false, businessType: 'Wholesale' },
    { id: 'CONS001', type: 'consumer', coordinates: [-6.2200, 106.8600], isWondrUser: true, businessType: 'Retail' }
  ]

  useEffect(() => {
    if (!mapRef.current || !province) return

    const initMap = async () => {
      const L = (await import('leaflet')).default

      const map = L.map(mapRef.current!, {
        center: [province.coordinates[0], province.coordinates[1]],
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      setMapInstance(map)

      // Add infrastructure points
      mockInfrastructure.forEach((point) => {
        const markerColors = {
          KC: '#3B82F6', // Blue
          ATM: '#10B981', // Green
          Agent46: '#F59E0B' // Orange
        }

        const marker = L.circleMarker([point.coordinates[0], point.coordinates[1]], {
          radius: point.type === 'KC' ? 12 : 8,
          fillColor: markerColors[point.type as keyof typeof markerColors],
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        })

        const tooltipContent = `
          <div class="font-semibold">${point.name}</div>
          <div class="text-sm text-gray-600 mt-1">
            <div>Type: ${point.type}</div>
            ${point.customers > 0 ? `<div>Customers: ${point.customers.toLocaleString()}</div>` : ''}
          </div>
        `

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10]
        })

        if (point.type === 'KC') {
          marker.on('click', () => {
            setSelectedBranch(point.id)
            onBranchSelect(point.id)
          })
        }

        marker.addTo(map)
      })

       // Add hexagon grid for potential zones
      const hexagonGrid = [
        { coords: [province.coordinates[0] + 0.2, province.coordinates[1] + 0.1], potential: 92, type: 'high-potential' },
        { coords: [province.coordinates[0] - 0.1, province.coordinates[1] + 0.2], potential: 78, type: 'moderate-potential' },
        { coords: [province.coordinates[0] + 0.1, province.coordinates[1] - 0.2], potential: 45, type: 'low-potential' },
        { coords: [province.coordinates[0] - 0.2, province.coordinates[1] - 0.1], potential: 65, type: 'moderate-potential' },
        { coords: [province.coordinates[0] + 0.3, province.coordinates[1]], potential: 88, type: 'high-potential' },
        { coords: [province.coordinates[0] - 0.3, province.coordinates[1]], potential: 35, type: 'low-potential' },
        { coords: [province.coordinates[0], province.coordinates[1] + 0.3], potential: 72, type: 'moderate-potential' },
        { coords: [province.coordinates[0], province.coordinates[1] - 0.3], potential: 58, type: 'moderate-potential' }
      ]

      // Add hexagon markers with color-coded potential
      hexagonGrid.forEach((hex, index) => {
        const hexColors = {
          'high-potential': '#10B981',    // Green
          'moderate-potential': '#F59E0B', // Orange  
          'low-potential': '#EF4444'      // Red
        }

         // Create hexagon-like polygon
        const hexSize = 0.08
        const hexagonPoints: [number, number][] = []
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60) * (Math.PI / 180)
          const lat = hex.coords[0] + hexSize * Math.cos(angle)
          const lng = hex.coords[1] + hexSize * Math.sin(angle)
          hexagonPoints.push([lat, lng])
        }

        const hexagon = L.polygon(hexagonPoints, {
          fillColor: hexColors[hex.type as keyof typeof hexColors],
          color: 'white',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.6
        })

        const tooltipContent = `
          <div class="font-semibold">Potential Zone ${index + 1}</div>
          <div class="text-sm text-gray-600 mt-1">
            <div>Potential Score: ${hex.potential}</div>
            <div>Classification: ${hex.type.replace('-', ' ')}</div>
          </div>
        `

        hexagon.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10]
        })

        hexagon.addTo(map)
      })

      // Add value chain points
      mockValueChain.forEach((point) => {
        const typeColors = {
          producer: '#8B5CF6', // Purple
          distributor: '#F59E0B', // Orange
          consumer: '#10B981' // Green
        }

        const marker = L.circleMarker([point.coordinates[0], point.coordinates[1]], {
          radius: 6,
          fillColor: typeColors[point.type as keyof typeof typeColors],
          color: point.isWondrUser ? 'white' : '#666',
          weight: point.isWondrUser ? 3 : 1,
          opacity: 1,
          fillOpacity: 0.8
        })

        const tooltipContent = `
          <div class="font-semibold">${point.type.charAt(0).toUpperCase() + point.type.slice(1)}</div>
          <div class="text-sm text-gray-600 mt-1">
            <div>Business: ${point.businessType}</div>
            <div>Wondr User: ${point.isWondrUser ? 'Yes' : 'No'}</div>
          </div>
        `

        marker.bindTooltip(tooltipContent, {
          direction: 'top',
          offset: [0, -10]
        })

        marker.addTo(map)
      })
    }

    initMap()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [province])

  if (!province) return <div>Province not found</div>

  // Mock financial data
  const financialData = {
    deposits: 45600000000,
    loans: 32100000000,
    investments: 18900000000,
    totalTransactions: 125000,
    wondrUsers: 8500,
    nonWondrUsers: 12300,
    adoptionRate: 40.9
  }

  const kcBranches = mockInfrastructure.filter(item => item.type === 'KC')
  const atmCount = mockInfrastructure.filter(item => item.type === 'ATM').length
  const agentCount = mockInfrastructure.filter(item => item.type === 'Agent46').length

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />

        {/* Enhanced Province Info Overlay with Charts */}
      <div className="absolute top-4 left-4 z-30 space-y-3 max-h-screen overflow-y-auto">
        <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{province.name}</span>
              <Badge 
                variant={
                  province.realizationStatus === 'green' ? 'default' : 
                  province.realizationStatus === 'yellow' ? 'secondary' : 
                  'destructive'
                }
              >
                {province.realizationValue}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Performance Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Target Progress</span>
                <span className="font-semibold">{province.realizationValue}% of target</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    province.realizationStatus === 'green' ? 'bg-green-500' : 
                    province.realizationStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(province.realizationValue, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Financial Metrics with Mini Charts */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Financial Performance</div>
              
              {/* Deposits */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Deposits</span>
                  <span className="font-semibold">Rp {(financialData.deposits / 1e9).toFixed(1)}B</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${(financialData.deposits / 50e9) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Loans */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Loans</span>
                  <span className="font-semibold">Rp {(financialData.loans / 1e9).toFixed(1)}B</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ width: `${(financialData.loans / 35e9) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Investments */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Investments</span>
                  <span className="font-semibold">Rp {(financialData.investments / 1e9).toFixed(1)}B</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${(financialData.investments / 25e9) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* User Adoption Chart */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">User Adoption Analysis</div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-xs text-gray-600">Wondr Users</div>
                  <div className="font-bold text-blue-600">{financialData.wondrUsers.toLocaleString()}</div>
                  <div className="text-xs text-blue-500">{financialData.adoptionRate.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Non-Users</div>
                  <div className="font-bold text-gray-600">{financialData.nonWondrUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{(100 - financialData.adoptionRate).toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="text-xs text-gray-600">Total</div>
                  <div className="font-bold text-green-600">{(financialData.wondrUsers + financialData.nonWondrUsers).toLocaleString()}</div>
                  <div className="text-xs text-green-500">100%</div>
                </div>
              </div>

              {/* Adoption Rate Visualization */}
              <div className="flex rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${financialData.adoptionRate}%` }}
                ></div>
                <div 
                  className="bg-gray-300" 
                  style={{ width: `${100 - financialData.adoptionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Infrastructure Stats */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-900">Infrastructure Coverage</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="w-6 h-6 rounded-full bg-blue-500 mx-auto mb-1"></div>
                  <div className="text-xs text-gray-600">KC Branches</div>
                  <div className="font-bold text-blue-600">{kcBranches.length}</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="w-6 h-6 rounded-full bg-green-500 mx-auto mb-1"></div>
                  <div className="text-xs text-gray-600">ATMs</div>
                  <div className="font-bold text-green-600">{atmCount}</div>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="w-6 h-6 rounded-full bg-orange-500 mx-auto mb-1"></div>
                  <div className="text-xs text-gray-600">Agent46</div>
                  <div className="font-bold text-orange-600">{agentCount}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

         {/* Potential Zones Summary */}
        <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Potential Zones Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-green-50 rounded border">
                  <div className="font-bold text-green-600">3</div>
                  <div className="text-gray-600">High Potential</div>
                </div>
                <div className="p-2 bg-orange-50 rounded border">
                  <div className="font-bold text-orange-600">3</div>
                  <div className="text-gray-600">Moderate</div>
                </div>
                <div className="p-2 bg-red-50 rounded border">
                  <div className="font-bold text-red-600">2</div>
                  <div className="text-gray-600">Low Potential</div>
                </div>
              </div>
              <div className="text-xs text-gray-600 text-center">
                Click KC branches below to analyze specific 10km radius zones
              </div>
            </div>
          </CardContent>
        </Card>

         {/* KC Branches List */}
        <Card className="w-80 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">KC Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kcBranches.map((branch) => (
                <Button
                  key={branch.id}
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                  onClick={() => onBranchSelect(branch.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{branch.name}</div>
                    <div className="text-sm text-gray-600">{branch.customers.toLocaleString()} customers</div>
                  </div>
                  <div className="text-sm text-blue-600">→</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Enhanced Legend with Hexagons */}
      <div className="absolute bottom-4 right-4 z-30">
        <Card className="w-72 bg-white/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-900">Map Legend</div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Potential Zones (Hexagons)</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-2 bg-green-500 border border-white" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
                    <span>High Potential (80-100)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-2 bg-orange-500 border border-white" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
                    <span>Moderate Potential (50-79)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-2 bg-red-500 border border-white" style={{clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'}}></div>
                    <span>Low Potential (0-49)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Infrastructure</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>KC Branches (clickable)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>ATMs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Agent46</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Value Chain</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Producers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Distributors</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Consumers</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">White border = Wondr user</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}