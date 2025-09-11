'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CollapsibleOverlayProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  width?: 'sm' | 'md' | 'lg'
}

export function CollapsibleOverlay({ 
  title, 
  children, 
  defaultOpen = true, 
  position = 'top-left',
  width = 'md' 
}: CollapsibleOverlayProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const widthClasses = {
    'sm': 'w-64',
    'md': 'w-80',
    'lg': 'w-96'
  }

  return (
    <div className={`absolute z-30 ${positionClasses[position]}`}>
      <Card className={`${widthClasses[width]} bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300 ${isOpen ? 'max-h-96 overflow-y-auto' : 'max-h-12 overflow-hidden'}`}>
        <CardHeader 
          className="pb-2 cursor-pointer flex-row items-center justify-between space-y-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
              ↓
            </span>
          </Button>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  )
}