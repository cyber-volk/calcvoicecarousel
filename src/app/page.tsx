'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navigation/navbar'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-6">Welcome to Calculator App</h1>
        <p className="text-center text-gray-600 mb-8">
          Please select a calculator version from the navigation bar above
        </p>
      </main>
    </div>
  )
}
