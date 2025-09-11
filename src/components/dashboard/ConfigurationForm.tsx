'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfigurationData } from '@/types/dashboard'
import { BUSINESS_SECTORS, CUSTOMER_SEGMENTS } from '@/lib/sector-data'

interface ConfigurationFormProps {
  onSubmit: (data: ConfigurationData) => void
}

export function ConfigurationForm({ onSubmit }: ConfigurationFormProps) {
  const [targetProfit, setTargetProfit] = useState<string>('')
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [selectedSubsectors, setSelectedSubsectors] = useState<string[]>([])
  const [selectedCustomerSegments, setSelectedCustomerSegments] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSectorToggle = (sectorId: string) => {
    if (selectedSectors.includes(sectorId)) {
      setSelectedSectors(prev => prev.filter(id => id !== sectorId))
      // Remove all subsectors of this sector
      const sector = BUSINESS_SECTORS.find(s => s.id === sectorId)
      if (sector) {
        const subsectorIds = sector.subsectors.map(sub => sub.id)
        setSelectedSubsectors(prev => prev.filter(id => !subsectorIds.includes(id)))
      }
    } else {
      setSelectedSectors(prev => [...prev, sectorId])
    }
  }

  const handleSubsectorToggle = (subsectorId: string, sectorId: string) => {
    if (selectedSubsectors.includes(subsectorId)) {
      setSelectedSubsectors(prev => prev.filter(id => id !== subsectorId))
    } else {
      setSelectedSubsectors(prev => [...prev, subsectorId])
      // Ensure parent sector is selected
      if (!selectedSectors.includes(sectorId)) {
        setSelectedSectors(prev => [...prev, sectorId])
      }
    }
  }

  const handleCustomerSegmentToggle = (segmentId: string) => {
    if (selectedCustomerSegments.includes(segmentId)) {
      setSelectedCustomerSegments(prev => prev.filter(id => id !== segmentId))
    } else {
      setSelectedCustomerSegments(prev => [...prev, segmentId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Remove all non-digits and convert to number
    const cleanedProfit = targetProfit.replace(/\D/g, '')
    const profit = parseInt(cleanedProfit, 10)
    
    if (isNaN(profit) || profit <= 0) {
      alert('Please enter a valid target profit amount')
      setIsSubmitting(false)
      return
    }
    
    const configData: ConfigurationData = {
      targetProfit: profit,
      selectedSectors,
      selectedSubsectors,
      selectedCustomerSegments
    }

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onSubmit(configData)
    setIsSubmitting(false)
  }

  const formatNumber = (value: string) => {
    // Remove all non-digits
    const number = value.replace(/\D/g, '')
    if (!number) return ''
    
    // Convert to number and format with commas
    const num = parseInt(number, 10)
    if (isNaN(num)) return ''
    
    return num.toLocaleString('id-ID')
  }

  const isFormValid = targetProfit.trim() !== '' && selectedSectors.length > 0 && selectedCustomerSegments.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">W</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration Setup</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Configure your business priorities and target segments to customize the dashboard experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Target Profit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">1</span>
              </div>
              <span>Target Profit</span>
            </CardTitle>
            <CardDescription>
              Set your strategic profit target to align dashboard insights with business priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="targetProfit" className="text-base font-medium">
                Annual Target Profit (IDR)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">Rp</span>
                <Input
                  id="targetProfit"
                  placeholder="20000000000"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(formatNumber(e.target.value))}
                  className="pl-12 text-lg h-12"
                  required
                />
              </div>
              <p className="text-sm text-gray-600">
                Example: Type "20000000000" for 20 billion IDR target
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Sectors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <span>Business Sectors</span>
            </CardTitle>
            <CardDescription>
              Select business sectors to focus your market analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="mb-4">
                <Badge variant="outline" className="mr-2">
                  {selectedSectors.length} sectors selected
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {BUSINESS_SECTORS.map((sector) => (
                  <div 
                    key={sector.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSectors.includes(sector.id) 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSectorToggle(sector.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{sector.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {sector.subsectors.length} subsectors
                        </span>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedSectors.includes(sector.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedSectors.includes(sector.id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <span>Customer Segmentation</span>
            </CardTitle>
            <CardDescription>
              Select target customer segments to personalize insights and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="mb-4">
                <Badge variant="outline">
                  {selectedCustomerSegments.length} segments selected
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CUSTOMER_SEGMENTS.map((segment) => (
                  <div 
                    key={segment.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCustomerSegments.includes(segment.id)
                        ? 'bg-purple-50 border-purple-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCustomerSegmentToggle(segment.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{segment.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {segment.description}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mt-1 ml-3 ${
                        selectedCustomerSegments.includes(segment.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedCustomerSegments.includes(segment.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid || isSubmitting}
            className="w-full max-w-md h-12 text-lg"
          >
            {isSubmitting ? 'Configuring Dashboard...' : 'Access Analytics Dashboard'}
          </Button>
        </div>

        {!isFormValid && (
          <p className="text-center text-sm text-gray-600">
            Please complete all required fields: Target Profit, at least 1 Business Sector, and 1 Customer Segment
          </p>
        )}
      </form>
    </div>
  )
}