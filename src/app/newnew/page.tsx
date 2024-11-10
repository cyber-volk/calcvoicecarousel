'use client'

import { Navbar } from '@/components/navigation/navbar'
import NewCalculator from '@/components/newnew'

export default function NewNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4">
        <NewCalculator />
      </div>
    </div>
  )
} 