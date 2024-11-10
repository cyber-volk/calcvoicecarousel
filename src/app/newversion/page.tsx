'use client'

import { Navbar } from '@/components/navigation/navbar'
import NewVersionCalculator from '@/components/newversion'

export default function NewVersionPage() {
  return (
    <div>
      <Navbar />
      <main>
        <NewVersionCalculator />
      </main>
    </div>
  )
} 