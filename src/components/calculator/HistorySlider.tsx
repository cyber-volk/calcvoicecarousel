import React, { useState, useRef, useEffect } from 'react'
import { Book, X, Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Form } from '@/types/calculator'
import { formatDistanceToNow } from 'date-fns'
import { SiteColor } from '@/types/calculator'
import { SITE_COLORS } from '@/components/calculator/shared'

interface HistorySliderProps {
  forms: Form[]
  currentFormIndex: number
  onFormSelect: (index: number, historicalForm?: Form) => void
  siteColor: SiteColor
}

interface FormPreviewProps {
  form: Form
  onClose: () => void
  onRestore: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  isFirstForm: boolean
  isLastForm: boolean
  siteColor: SiteColor
}

function FormPreview({ 
  form, 
  onClose, 
  onRestore, 
  onNavigate, 
  isFirstForm, 
  isLastForm,
  siteColor 
}: FormPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${SITE_COLORS[siteColor].bg} rounded-lg shadow-xl p-6 w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto relative`}>
        {/* Navigation buttons */}
        <div className="fixed top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between z-[60] pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onNavigate('prev')
            }}
            disabled={isFirstForm}
            className={`p-3 rounded-full bg-white shadow-lg transform transition-all duration-200 pointer-events-auto
              ${isFirstForm ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-110'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onNavigate('next')
            }}
            disabled={isLastForm}
            className={`p-3 rounded-full bg-white shadow-lg transform transition-all duration-200 pointer-events-auto
              ${isLastForm ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 hover:scale-110'}`}
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">Form Preview</h2>
            <div className="flex items-center text-gray-500 mt-2">
              <Clock size={16} className="mr-2" />
              <span>{formatDistanceToNow(new Date(form.timestamp), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onRestore()  // This will load the selected form state
                onClose()    // Close the preview after restoring
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Restore
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-white rounded-lg">
              <label className="text-sm text-gray-500 block">Multiplier</label>
              <p className="font-medium text-lg">{form.multiplier}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <label className="text-sm text-gray-500 block">Fond</label>
              <p className="font-medium text-lg">{form.fond || '0'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <label className="text-sm text-gray-500 block">Solde à l'instant</label>
              <p className="font-medium text-lg">{form.soldeALinstant || '0'}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <label className="text-sm text-gray-500 block">Solde de début</label>
              <p className="font-medium text-lg">{form.soldeDeDebut || '0'}</p>
            </div>
          </div>

          {/* Tables */}
          <div className="space-y-8">
            {/* Credit Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Crédit</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Total Client</th>
                      <th className="border border-gray-300 px-4 py-2">Détailles</th>
                      <th className="border border-gray-300 px-4 py-2">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.creditRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{row.totalClient}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.details}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit Payee Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Crédit Payée</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Total Payée</th>
                      <th className="border border-gray-300 px-4 py-2">Détailles</th>
                      <th className="border border-gray-300 px-4 py-2">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.creditPayeeRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{row.totalPayee}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.details}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Depense Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Dépense</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Total Dépense</th>
                      <th className="border border-gray-300 px-4 py-2">Détailles</th>
                      <th className="border border-gray-300 px-4 py-2">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.depenseRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{row.totalDepense}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.details}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Retrait Table */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Retrait</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2">Retrait Payée</th>
                      <th className="border border-gray-300 px-4 py-2">Retrait</th>
                      <th className="border border-gray-300 px-4 py-2">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.retraitRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{row.retraitPayee}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.retrait}</td>
                        <td className="border border-gray-300 px-4 py-2">{row.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-8 text-center p-4 bg-white rounded-lg">
            <h2 className="text-xl font-bold mb-2">Result</h2>
            <p className="text-3xl font-bold text-blue-600">{form.result}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HistorySlider({ forms, currentFormIndex, onFormSelect, siteColor }: HistorySliderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Update to use calculation history
  const currentForm = forms[currentFormIndex]
  const calculationHistory = currentForm.calculationHistory || []
  
  // Filter calculation history entries with results
  const historyWithResults = calculationHistory.filter(entry => 
    entry.result && entry.result !== 'Total: 0.0'
  )

  const handleFormClick = (form: Form, index: number) => {
    setPreviewForm(form)
    setPreviewIndex(index)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentPosition = previewIndex
    const newPosition = direction === 'prev' ? currentPosition - 1 : currentPosition + 1
    
    if (newPosition >= 0 && newPosition < historyWithResults.length) {
      const entry = historyWithResults[newPosition]
      setPreviewIndex(newPosition)
      setPreviewForm(entry)
    }
  }

  const returnToLatest = () => {
    if (historyWithResults.length > 0) {
      const latestEntry = historyWithResults[historyWithResults.length - 1]
      const latestIndex = historyWithResults.length - 1
      onFormSelect(currentFormIndex) // Keep the current form selected
      setPreviewIndex(latestIndex)
      setPreviewForm(latestEntry)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setPreviewForm(null)
  }

  const handleRestore = (form: Form) => {
    // Call onFormSelect with the current form index to update the parent component
    onFormSelect(currentFormIndex)
    // Load the historical form data
    if (form) {
      // The parent component will handle loading the form data
      onFormSelect(currentFormIndex, form)  // Pass the historical form data
    }
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-30"
          onClick={handleClose}
        />
      )}

      <div className={`fixed bottom-0 left-0 right-0 ${SITE_COLORS[siteColor].bg} border-t border-gray-200 p-4 z-40`}>
        {!isOpen ? (
          <div className="absolute left-1/2 -translate-x-1/2 -top-5">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center justify-center w-10 h-10 bg-white rounded-full hover:bg-gray-100 transition-all duration-200 border border-gray-200 shadow-lg"
            >
              <Book size={20} className="text-gray-600" />
            </button>
          </div>
        ) : (
          <div ref={sliderRef} className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Form History</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={returnToLatest}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                >
                  <RotateCcw size={16} />
                  Return to Latest
                </button>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-300 -translate-y-1/2" />
              <div className="flex items-center justify-start space-x-8 overflow-x-auto pb-4 px-4">
                {historyWithResults.map((entry, index) => (
                  <button
                    key={entry.timestamp}
                    onClick={() => handleFormClick(entry, index)}
                    className="flex flex-col items-center min-w-[60px] group relative"
                  >
                    <div 
                      className={`w-6 h-6 rounded-full flex-shrink-0 mb-2 transition-all duration-200 
                        ${index === previewIndex
                          ? 'bg-blue-500 ring-4 ring-blue-200' 
                          : 'bg-gray-300 group-hover:bg-gray-400 group-hover:scale-110'
                        }`}
                      title={`Calculation ${index + 1} - ${entry.result}`}
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap opacity-80 group-hover:opacity-100">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {previewForm && (
          <FormPreview 
            form={previewForm}
            onClose={() => setPreviewForm(null)}
            onRestore={() => handleRestore(previewForm)}
            onNavigate={handleNavigate}
            isFirstForm={previewIndex === 0}
            isLastForm={previewIndex === historyWithResults.length - 1}
            siteColor={siteColor}
          />
        )}
      </div>
    </>
  )
} 