'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DataVisualizationProps {
  title: string
  data: Array<{
    name: string
    value: number
    color: string
    percentage?: number
  }>
  type: 'bar' | 'line' | 'pie' | 'progress'
}

export function DataVisualization({ title, data, type }: DataVisualizationProps) {
  const maxValue = Math.max(...data.map(item => item.value))

  if (type === 'bar') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold">{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {/* Pie Chart */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 42 42" className="w-full h-full">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="2"/>
                {data.map((item, index) => {
                  const percentage = (item.value / total) * 100
                  const strokeDasharray = `${percentage} ${100 - percentage}`
                  const strokeDashoffset = 100 - currentAngle
                  currentAngle += percentage
                  
                  return (
                    <circle
                      key={index}
                      cx="21"
                      cy="21"
                      r="15.915"
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-strokeDashoffset}
                      className="transition-all duration-500"
                      transform="rotate(-90 21 21)"
                    />
                  )
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {data.map((item, index) => {
                const percentage = ((item.value / total) * 100).toFixed(1)
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm flex-1">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {percentage}%
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'line') {
    const width = 300
    const height = 100
    const padding = 20

    const xScale = (width - 2 * padding) / (data.length - 1)
    const yScale = (height - 2 * padding) / maxValue

    const points = data.map((item, index) => ({
      x: padding + index * xScale,
      y: height - padding - item.value * yScale
    }))

    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <line
                  key={index}
                  x1={padding}
                  y1={height - padding - maxValue * yScale * ratio}
                  x2={width - padding}
                  y2={height - padding - maxValue * yScale * ratio}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {/* Line */}
              <path
                d={pathData}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Points */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#3B82F6"
                />
              ))}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-xs text-gray-600">
              {data.map((item, index) => (
                <span key={index}>{item.name}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (type === 'progress') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">{item.value}</span>
                    {item.percentage && (
                      <Badge variant="outline" className="text-xs">
                        {item.percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-700" 
                    style={{ 
                      width: `${item.percentage || (item.value / maxValue) * 100}%`,
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}