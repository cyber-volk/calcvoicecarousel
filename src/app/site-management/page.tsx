'use client'

import { Navbar } from '@/components/navigation/navbar'
import { CalculatorWithSiteManagement } from '@/components/calculator-with-site-management'

export default function SiteManagementPage() {
  return (
    <div>
      <Navbar />
      <main>
        <CalculatorWithSiteManagement />
      </main>
    </div>
  )
} 