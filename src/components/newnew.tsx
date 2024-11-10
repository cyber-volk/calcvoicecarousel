'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { 
  Mic, Trash, Plus, Languages, ChevronRight, ChevronLeft, 
  Edit2, Check, X, Trash2, RotateCcw, Book, Clock, Palette 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { processVoiceInput } from '@/utils/voice-processing'
import { ErrorKeys, Errors, RowField } from '@/types/calculator'
import { 
  SITE_COLORS, 
  VoiceFeedback, 
  VoiceInputButton, 
  LanguageSelector,
  SiteCarousel 
} from '@/components/calculator/shared'
import { MESSAGES, LANGUAGE_OPTIONS } from '@/constants/calculator'

// Types
type VoiceLanguage = 'none' | 'ar-SA' | 'fr-FR' | 'en-US'
type SiteColor = 'none' | 'blue' | 'green' | 'yellow' | 'purple' | 'red'

interface Row {
  details: string
  client: string
}

interface CreditRow extends Row {
  totalClient: string
}

interface CreditPayeeRow extends Row {
  totalPayee: string
}

interface DepenseRow extends Row {
  totalDepense: string
}

interface RetraitRow {
  retraitPayee: string
  retrait: string
  client: string
}

interface Form {
  id: string
  result: string
  timestamp: string
  creditRows: CreditRow[]
  creditPayeeRows: CreditPayeeRow[]
  depenseRows: DepenseRow[]
  retraitRows: RetraitRow[]
  fond: string
  soldeALinstant: string
  soldeDeDebut: string
  site: string
  multiplier: string
  calculationHistory?: Form[]
}

interface Site {
  id: string
  name: string
  color: SiteColor
  forms: Form[]
  statistics: {
    lastUpdated: string
  }
}

// Helper Functions
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
} 

// FormPreview Component
interface FormPreviewProps {
  form: Form
  onClose: () => void
  onRestore: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  isFirstForm: boolean
  isLastForm: boolean
  siteColor: SiteColor
  removeRow: (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait', index: number) => void
  updateRow: (tableType: keyof RowField, index: number, field: RowField[typeof tableType], value: string) => void
  handleVoiceInputWithFeedback: (callback: (value: string) => void, isNumberField?: boolean) => void
  voiceLanguage: VoiceLanguage
  addRow: (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait') => void  // Add this line
}

function FormPreview({ 
  form, 
  onClose, 
  onRestore, 
  onNavigate, 
  isFirstForm, 
  isLastForm,
  siteColor,
  removeRow,
  updateRow,
  handleVoiceInputWithFeedback,
  voiceLanguage,
  addRow
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
                onRestore()
                onClose()
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
          <div className="space-y-6 mb-8"> {/* Add mb-8 here */}
            {/* Credit Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Crédit</h3>
                <button
                  type="button"
                  onClick={() => addRow('credit')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" /> {/* Delete button */}
                    <col className="w-[50px] sm:w-[70px]" /> {/* Total - even smaller */}
                    <col /> {/* Details - takes more space */}
                    <col className="w-[90px] sm:w-[110px]" /> {/* Client - smaller */}
                  </colgroup>
                  <tbody>
                    {form.creditRows.map((row: CreditRow, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeRow('credit', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.totalClient}
                            readOnly
                            className="w-full bg-gray-50 text-right font-mono px-2 py-1 rounded"
                            maxLength={4}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => updateRow('credit', index, 'details', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('credit', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('credit', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('credit', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CreditPayee Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Crédit Payée</h3>
                <button
                  type="button"
                  onClick={() => addRow('creditPayee')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[50px] sm:w-[70px]" /> {/* Reduced width on mobile */}
                    <col />
                    <col className="w-[90px] sm:w-[110px]" />
                  </colgroup>
                  <tbody>
                    {form.creditPayeeRows.map((row: CreditPayeeRow, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <button
                            type="button"
                            onClick={() => removeRow('creditPayee', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <input
                            type="text"
                            value={row.totalPayee}
                            readOnly
                            className="w-full bg-gray-50 text-right font-mono px-1"
                            maxLength={4}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => updateRow('creditPayee', index, 'details', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('creditPayee', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('creditPayee', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('creditPayee', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Depense Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Dépense</h3>
                <button
                  type="button"
                  onClick={() => addRow('depense')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[50px] sm:w-[70px]" /> {/* Reduced width on mobile */}
                    <col />
                    <col className="w-[90px] sm:w-[110px]" />
                  </colgroup>
                  <tbody>
                    {form.depenseRows.map((row: DepenseRow, index: number) => (
                      <tr key={index}>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeRow('depense', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.totalDepense}
                            readOnly
                            className="w-full bg-gray-50 text-right font-mono px-2 py-1 rounded"
                            maxLength={4}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => updateRow('depense', index, 'details', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('depense', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('depense', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('depense', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Retrait Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Retrait</h3>
                <button
                  type="button"
                  onClick={() => addRow('retrait')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <tbody>
                    {form.retraitRows.map((row: RetraitRow, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => removeRow('retrait', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={row.retraitPayee}
                            onChange={(e) => updateRow('retrait', index, 'retraitPayee', e.target.value)}
                            className={`w-full font-mono px-2 py-1 rounded ${
                              row.retraitPayee === 'OK' ? 'bg-gray-50' : ''
                            }`}
                            readOnly={row.retraitPayee === 'OK'}
                            maxLength={10}
                          />
                          {row.retraitPayee !== 'OK' && (
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'retraitPayee', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          )}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <div className="relative">
                            <textarea
                              value={row.retrait}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  updateRow('retrait', index, 'retrait', value)
                                }
                              }}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'retrait', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('retrait', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
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

// HistorySlider Component
interface HistorySliderProps {
  forms: Form[]
  currentFormIndex: number
  onFormSelect: (index: number, historicalForm?: Form) => void
  siteColor: SiteColor
  removeRow: (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait', index: number) => void
  updateRow: (tableType: keyof RowField, index: number, field: RowField[typeof tableType], value: string) => void
  handleVoiceInputWithFeedback: (callback: (value: string) => void, isNumberField?: boolean) => void
  voiceLanguage: VoiceLanguage
  addRow: (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait') => void  // Add this line
}

function HistorySlider({ 
  forms, 
  currentFormIndex, 
  onFormSelect, 
  siteColor,
  removeRow,
  updateRow,
  handleVoiceInputWithFeedback,
  voiceLanguage,
  addRow
}: HistorySliderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number>(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Get current form and its history
  const currentForm = forms[currentFormIndex]
  const calculationHistory = currentForm.calculationHistory || []
  
  // Filter history entries with results
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

  const handleRestore = (form: Form) => {
    onFormSelect(currentFormIndex, form)
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-30"
          onClick={() => setIsOpen(false)}
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
            {/* History timeline UI */}
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
            removeRow={removeRow}
            updateRow={updateRow}
            handleVoiceInputWithFeedback={handleVoiceInputWithFeedback}
            voiceLanguage={voiceLanguage}
            addRow={addRow}  // Add this line
          />
        )}
      </div>
    </>
  )
} 

// Main Calculator Component
export default function NewCalculator() {
  // 1. State hooks
  const [mounted, setMounted] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('none')
  const [isListening, setIsListening] = useState(false)
  const [multiplier, setMultiplier] = useState('1.1')
  const [fond, setFond] = useState('')
  const [soldeALinstant, setSoldeALinstant] = useState('')
  const [site, setSite] = useState('')
  const [soldeDeDebut, setSoldeDeDebut] = useState('')
  const [creditRows, setCreditRows] = useState<CreditRow[]>([{ totalClient: '', details: '', client: '' }])
  const [creditPayeeRows, setCreditPayeeRows] = useState<CreditPayeeRow[]>([{ totalPayee: '', details: '', client: '' }])
  const [depenseRows, setDepenseRows] = useState<DepenseRow[]>([{ totalDepense: '', details: '', client: '' }])
  const [retraitRows, setRetraitRows] = useState<RetraitRow[]>([{ retraitPayee: '', retrait: '', client: '' }])
  const [result, setResult] = useState('')
  const [errors, setErrors] = useState<Errors>({
    fond: '',
    soldeALinstant: '',
    soldeDeDebut: '',
    credit: '',
    creditPayee: '',
    depense: '',
    retrait: ''
  })

  // Add these state hooks
  const [sites, setSites] = useLocalStorage<Site[]>('calculator-sites', [
    {
      id: '1',
      name: 'Default Site',
      color: 'none',
      forms: [{
        id: '1',
        result: '',
        timestamp: new Date().toISOString(),
        creditRows: [{ totalClient: '', details: '', client: '' }],
        creditPayeeRows: [{ totalPayee: '', details: '', client: '' }],
        depenseRows: [{ totalDepense: '', details: '', client: '' }],
        retraitRows: [{ retraitPayee: '', retrait: '', client: '' }],
        fond: '',
        soldeALinstant: '',
        soldeDeDebut: '',
        site: 'Default Site',
        multiplier: '1.1',
        calculationHistory: []
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
  ])
  const [currentSiteIndex, setCurrentSiteIndex] = useLocalStorage('current-site-index', 0)
  const [currentFormIndex, setCurrentFormIndex] = useLocalStorage('current-form-index', 0)

  // Add this state to track client-side rendering
  const [isClient, setIsClient] = useState(false)

  // Add this useEffect
  useEffect(() => {
    setMounted(true)
    // Set initial site name
    if (sites[currentSiteIndex]) {
      setSite(sites[currentSiteIndex].name)
    }
  }, [sites, currentSiteIndex])

  // Add validateInput function
  const validateInput = (value: string, errorKey: ErrorKeys, isMandatory = false) => {
    let parsedValue: number | null = null
    const newErrors = { ...errors }

    if (errorKey === 'soldeALinstant' || errorKey === 'soldeDeDebut') {
      const numbers = value.split('+').map(num => parseFloat(num.trim())).filter(num => !isNaN(num))
      parsedValue = numbers.reduce((acc, num) => acc + num, 0)
    } else {
      parsedValue = parseFloat(value)
    }

    if (value === '' && !isMandatory) {
      newErrors[errorKey] = ''
      setErrors(newErrors)
      return 0
    } else if (isMandatory && (value === '' || parsedValue === 0 || isNaN(parsedValue))) {
      newErrors[errorKey] = 'svp insérer un solde de début'
      setErrors(newErrors)
      return null
    } else if (isNaN(parsedValue)) {
      newErrors[errorKey] = 'Please enter a valid number'
      setErrors(newErrors)
      return null
    }

    newErrors[errorKey] = ''
    setErrors(newErrors)
    return parsedValue
  }

  // First define handleVoiceInput
  const handleVoiceInput = useCallback((
    callback: (value: string) => void, 
    isNumberField: boolean = true
  ) => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition is not supported in your browser. Please use Chrome.')
      return
    }

    // @ts-ignore - webkitSpeechRecognition is not in TypeScript types
    const recognition = new webkitSpeechRecognition()
    
    recognition.lang = voiceLanguage
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)

    recognition.onstart = () => {
      console.log('Voice recognition started')
    }

    recognition.onresult = (event: any) => {
      const results = event.results
      let finalTranscript = ''

      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (result.isFinal) {
          finalTranscript = result[0].transcript
          const processedValue = isNumberField 
            ? processVoiceInput(finalTranscript, true)
            : finalTranscript.trim()
          callback(processedValue)
          setIsListening(false)
          recognition.stop()
          break
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      alert(MESSAGES[voiceLanguage].error)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Recognition start error:', error)
      setIsListening(false)
      alert(MESSAGES[voiceLanguage].error)
    }
  }, [voiceLanguage, setIsListening])

  // Then define handleVoiceInputWithFeedback
  const handleVoiceInputWithFeedback = useCallback((
    callback: (value: string) => void,
    isNumberField: boolean = true
  ) => {
    handleVoiceInput((value: string) => {
      callback(value)
      setIsListening(false)
    }, isNumberField)
  }, [handleVoiceInput, setIsListening])

  // 2. useEffect hooks
  useEffect(() => {
    setMounted(true)
  }, [])

  // 3. Handler functions
  const handleSiteChange = (index: number) => {
    setCurrentSiteIndex(index)
    setCurrentFormIndex(0)
    loadForm(sites[index].forms[0])
  }

  const handleAddSite = () => {
    const newSite: Site = {
      id: crypto.randomUUID(),
      name: `New Site ${sites.length + 1}`,
      color: 'none',
      forms: [{
        id: crypto.randomUUID(),
        result: '',
        timestamp: new Date().toISOString(),
        creditRows: [{ totalClient: '', details: '', client: '' }],
        creditPayeeRows: [{ totalPayee: '', details: '', client: '' }],
        depenseRows: [{ totalDepense: '', details: '', client: '' }],
        retraitRows: [{ retraitPayee: '', retrait: '', client: '' }],
        fond: '',
        soldeALinstant: '',
        soldeDeDebut: '',
        site: `New Site ${sites.length + 1}`,
        multiplier: '1.1',
        calculationHistory: []
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
    setSites([...sites, newSite])
    setCurrentSiteIndex(sites.length)
    setCurrentFormIndex(0)
  }

  const handleUpdateSite = (siteIndex: number, updatedSite: Site) => {
    const newSites = [...sites]
    newSites[siteIndex] = updatedSite
    setSites(newSites)
    
    // Update the site name in the form if it's the current site
    if (siteIndex === currentSiteIndex) {
      setSite(updatedSite.name)
    }
  }

  const handleDeleteSite = (siteIndex: number) => {
    if (siteIndex === 0) {
      alert("Cannot delete the default site")
      return
    }
    const newSites = sites.filter((_, index: number) => index !== siteIndex)
    setSites(newSites)
    if (currentSiteIndex >= siteIndex) {
      setCurrentSiteIndex(Math.max(0, currentSiteIndex - 1))
    }
  }

  const loadForm = (form: Form) => {
    if (!form) return
    setMultiplier(form.multiplier)
    setFond(form.fond)
    setSoldeALinstant(form.soldeALinstant)
    setSite(form.site)
    setSoldeDeDebut(form.soldeDeDebut)
    setCreditRows(form.creditRows.map(row => ({...row})))
    setCreditPayeeRows(form.creditPayeeRows.map(row => ({...row})))
    setDepenseRows(form.depenseRows.map(row => ({...row})))
    setRetraitRows(form.retraitRows.map(row => ({...row})))
    setResult(form.result)
  }

  const handlePreviousForm = () => {
    if (currentFormIndex > 0) {
      // Save current form state
      const updatedForms = [...sites[currentSiteIndex].forms]
      updatedForms[currentFormIndex] = {
        ...updatedForms[currentFormIndex],
        creditRows: [...creditRows],
        creditPayeeRows: [...creditPayeeRows],
        depenseRows: [...depenseRows],
        retraitRows: [...retraitRows],
        fond,
        soldeALinstant,
        soldeDeDebut,
        multiplier,
        result
      }

      const updatedSite = {
        ...sites[currentSiteIndex],
        forms: updatedForms
      }
      handleUpdateSite(currentSiteIndex, updatedSite)

      // Navigate to previous form
      setCurrentFormIndex(currentFormIndex - 1)
      loadForm(updatedForms[currentFormIndex - 1])
    }
  }

  const handleNextForm = () => {
    if (currentFormIndex < sites[currentSiteIndex].forms.length - 1) {
      // Save current form state
      const updatedForms = [...sites[currentSiteIndex].forms]
      updatedForms[currentFormIndex] = {
        ...updatedForms[currentFormIndex],
        creditRows: [...creditRows],
        creditPayeeRows: [...creditPayeeRows],
        depenseRows: [...depenseRows],
        retraitRows: [...retraitRows],
        fond,
        soldeALinstant,
        soldeDeDebut,
        multiplier,
        result
      }

      const updatedSite = {
        ...sites[currentSiteIndex],
        forms: updatedForms
      }
      handleUpdateSite(currentSiteIndex, updatedSite)

      // Navigate to next form
      setCurrentFormIndex(currentFormIndex + 1)
      loadForm(updatedForms[currentFormIndex + 1])
    }
  }

  const handleAddForm = () => {
    const newForm: Form = {
      id: crypto.randomUUID(),
      result: '',
      timestamp: new Date().toISOString(),
      creditRows: [{ totalClient: '', details: '', client: '' }],
      creditPayeeRows: [{ totalPayee: '', details: '', client: '' }],
      depenseRows: [{ totalDepense: '', details: '', client: '' }],
      retraitRows: [{ retraitPayee: '', retrait: '', client: '' }],
      fond: '',
      soldeALinstant: '',
      soldeDeDebut: '',
      site: sites[currentSiteIndex].name,
      multiplier: '1.1',
      calculationHistory: []
    }

    // Save current form state before adding new form
    const updatedForms = [...sites[currentSiteIndex].forms]
    updatedForms[currentFormIndex] = {
      ...updatedForms[currentFormIndex],
      creditRows: [...creditRows],
      creditPayeeRows: [...creditPayeeRows],
      depenseRows: [...depenseRows],
      retraitRows: [...retraitRows],
      fond,
      soldeALinstant,
      soldeDeDebut,
      multiplier,
      result
    }

    const updatedSite = {
      ...sites[currentSiteIndex],
      forms: [...updatedForms, newForm]
    }
    handleUpdateSite(currentSiteIndex, updatedSite)
    setCurrentFormIndex(updatedSite.forms.length - 1)
    handleReset() // Reset form to empty state for new form
  }

  const removeRow = (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait', index: number) => {
    switch (tableType) {
      case 'credit':
        if (creditRows.length > 1) {
          setCreditRows(creditRows.filter((_, i: number) => i !== index))
        }
        break
      case 'creditPayee':
        if (creditPayeeRows.length > 1) {
          setCreditPayeeRows(creditPayeeRows.filter((_, i: number) => i !== index))
        }
        break
      case 'depense':
        if (depenseRows.length > 1) {
          setDepenseRows(depenseRows.filter((_, i: number) => i !== index))
        }
        break
      case 'retrait':
        if (retraitRows.length > 1) {
          setRetraitRows(retraitRows.filter((_, i: number) => i !== index))
        }
        break
    }
  }

  // Update the updateRow function to ensure consistent total field formatting
  const updateRow = (
    tableType: keyof RowField,
    index: number,
    field: RowField[typeof tableType],
    value: string
  ) => {
    switch (tableType) {
      case 'credit':
        const newCreditRows = [...creditRows]
        ;(newCreditRows[index] as any)[field] = value
        if (field === 'details') {
          const numbers = value.split('+').map(num => parseFloat(num.trim())).filter(num => !isNaN(num))
          const total = numbers.reduce((acc, num) => acc + num, 0)
          newCreditRows[index].totalClient = total.toFixed(1) // Always show one decimal
        }
        setCreditRows(newCreditRows)
        break

      case 'creditPayee':
        const newCreditPayeeRows = [...creditPayeeRows]
        ;(newCreditPayeeRows[index] as any)[field] = value
        if (field === 'details') {
          const numbers = value.split('+').map(num => parseFloat(num.trim())).filter(num => !isNaN(num))
          const total = numbers.reduce((acc, num) => acc + num, 0)
          newCreditPayeeRows[index].totalPayee = total.toFixed(1) // Always show one decimal
        }
        setCreditPayeeRows(newCreditPayeeRows)
        break

      case 'depense':
        const newDepenseRows = [...depenseRows]
        ;(newDepenseRows[index] as any)[field] = value
        if (field === 'details') {
          const numbers = value.split('+').map(num => parseFloat(num.trim())).filter(num => !isNaN(num))
          const total = numbers.reduce((acc, num) => acc + num, 0)
          newDepenseRows[index].totalDepense = total.toFixed(1) // Always show one decimal
        }
        setDepenseRows(newDepenseRows)
        break

      case 'retrait':
        const newRetraitRows = [...retraitRows]
        ;(newRetraitRows[index] as any)[field] = value

        if (field === 'retrait') {
          // When retrait is updated, update retraitPayee and soldeALinstant
          const retraitValue = parseFloat(value) || 0
          newRetraitRows[index].retraitPayee = 'OK' // Set to "OK" when retrait is updated
          newRetraitRows[index].retrait = value // Don't format the value here

          // Update soldeALinstant - only add the new value
          const currentSolde = soldeALinstant.trim() ? parseFloat(soldeALinstant) || 0 : 0
          setSoldeALinstant(`${currentSolde} + ${retraitValue}`)
        }

        if (field === 'retraitPayee') {
          // Don't override retraitPayee if user is manually entering a value
          if (value.toLowerCase() === 'ok') {
            newRetraitRows[index].retraitPayee = newRetraitRows[index].retrait
          }
        }

        setRetraitRows(newRetraitRows)
        break
    }
  }

  // Update the details textarea to handle right-aligned input
  const handleDetailsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    tableType: keyof RowField,
    index: number,
    field: RowField[typeof tableType]
  ) => {
    const value = e.target.value
    const numbers = value.split('+').filter(n => n.trim())
    
    // Keep the first number on the right
    if (numbers.length === 1) {
      updateRow(tableType, index, field, value)
    } else {
      // For subsequent numbers, add them to the left
      const formattedValue = numbers.reverse().join(' + ')
      updateRow(tableType, index, field, formattedValue)
    }
  }

  // Update the total input fields in all tables to ensure consistent width and display
  const totalInputClassName = `
    w-full 
    bg-gray-50 
    text-right 
    font-mono 
    px-2 
    py-1 
    rounded
    min-w-[70px]
  `

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const validatedSoldeALinstant = validateInput(soldeALinstant, 'soldeALinstant') || 0
    const validatedFond = validateInput(fond, 'fond') || 0
    const validatedSoldeDeDebut = validateInput(soldeDeDebut, 'soldeDeDebut', true)

    if (validatedSoldeDeDebut === null) return

    const totalRetrait = retraitRows.reduce((total, row) => total + parseFloat(row.retrait || '0'), 0)
    const totalRetraitPayee = retraitRows.reduce((total, row) => {
      if (row.retraitPayee === 'OK') {
        return total + parseFloat(row.retrait || '0')
      }
      return total + parseFloat(row.retraitPayee || '0')
    }, 0)

    const totalCredit = creditRows.reduce((total, row) => total + parseFloat(row.totalClient || '0'), 0)
    const totalCreditPayee = creditPayeeRows.reduce((total, row) => total + parseFloat(row.totalPayee || '0'), 0)
    const totalDepense = depenseRows.reduce((total, row) => total + parseFloat(row.totalDepense || '0'), 0)

    const selectedMultiplier = parseFloat(multiplier)

    const total = ((validatedSoldeDeDebut + totalRetrait) - validatedSoldeALinstant) * selectedMultiplier - totalRetraitPayee - totalDepense - totalCredit + totalCreditPayee + validatedFond

    const newResult = `Total: ${total.toFixed(1)}`
    setResult(newResult)

    // Create a deep copy of the current state for history
    const historyEntry: Form = {
      id: sites[currentSiteIndex].forms[currentFormIndex].id,
      result: newResult,
      timestamp: new Date().toISOString(),
      creditRows: creditRows.map(row => ({...row})),
      creditPayeeRows: creditPayeeRows.map(row => ({...row})),
      depenseRows: depenseRows.map(row => ({...row})),
      retraitRows: retraitRows.map(row => ({...row})),
      fond: fond,
      soldeALinstant: soldeALinstant,
      soldeDeDebut: soldeDeDebut,
      site: sites[currentSiteIndex].name,
      multiplier: multiplier,
      calculationHistory: []
    }

    // Update the current form with the new calculation history
    const updatedForms = [...sites[currentSiteIndex].forms]
    updatedForms[currentFormIndex] = {
      ...updatedForms[currentFormIndex],
      result: newResult,
      calculationHistory: [
        ...(updatedForms[currentFormIndex].calculationHistory || []),
        historyEntry
      ]
    }

    const updatedSite = {
      ...sites[currentSiteIndex],
      forms: updatedForms,
      statistics: {
        ...sites[currentSiteIndex].statistics,
        lastUpdated: new Date().toISOString()
      }
    }

    handleUpdateSite(currentSiteIndex, updatedSite)
  }

  const handleReset = () => {
    setMultiplier('1.1')
    setFond('')
    setSoldeALinstant('')
    setSite('')
    setSoldeDeDebut('')
    setCreditRows([{ totalClient: '', details: '', client: '' }])
    setCreditPayeeRows([{ totalPayee: '', details: '', client: '' }])
    setDepenseRows([{ totalDepense: '', details: '', client: '' }])
    setRetraitRows([{ retraitPayee: '', retrait: '', client: '' }])
    setResult('')
    setErrors({
      fond: '',
      soldeALinstant: '',
      soldeDeDebut: '',
      credit: '',
      creditPayee: '',
      depense: '',
      retrait: ''
    })
  }

  const handleDeleteForm = () => {
    const currentForms = sites[currentSiteIndex].forms
    
    // If it's the last form, show confirmation dialog
    if (currentForms.length === 1) {
      if (confirm("This is the last form. Are you sure you want to delete it?")) {
        // Create a new empty form
        const newForm: Form = {
          id: crypto.randomUUID(),
          result: '',
          timestamp: new Date().toISOString(),
          creditRows: [{ totalClient: '', details: '', client: '' }],
          creditPayeeRows: [{ totalPayee: '', details: '', client: '' }],
          depenseRows: [{ totalDepense: '', details: '', client: '' }],
          retraitRows: [{ retraitPayee: '', retrait: '', client: '' }],
          fond: '',
          soldeALinstant: '',
          soldeDeDebut: '',
          site: sites[currentSiteIndex].name,
          multiplier: '1.1',
          calculationHistory: []
        }
        
        const updatedSite = {
          ...sites[currentSiteIndex],
          forms: [newForm],
          statistics: {
            ...sites[currentSiteIndex].statistics,
            lastUpdated: new Date().toISOString()
          }
        }
        
        handleUpdateSite(currentSiteIndex, updatedSite)
        setCurrentFormIndex(0)
        handleReset()
      }
      return
    }

    // For other forms, proceed with deletion
    const updatedForms = currentForms.filter((_, index) => index !== currentFormIndex)
    const updatedSite = {
      ...sites[currentSiteIndex],
      forms: updatedForms,
      statistics: {
        ...sites[currentSiteIndex].statistics,
        lastUpdated: new Date().toISOString()
      }
    }
    
    handleUpdateSite(currentSiteIndex, updatedSite)
    setCurrentFormIndex(Math.max(0, currentFormIndex - 1))
    loadForm(updatedForms[Math.max(0, currentFormIndex - 1)])
  }

  const addRow = (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait') => {
    switch (tableType) {
      case 'credit':
        setCreditRows([...creditRows, { totalClient: '', details: '', client: '' }])
        break
      case 'creditPayee':
        setCreditPayeeRows([...creditPayeeRows, { totalPayee: '', details: '', client: '' }])
        break
      case 'depense':
        setDepenseRows([...depenseRows, { totalDepense: '', details: '', client: '' }])
        break
      case 'retrait':
        setRetraitRows([...retraitRows, { retraitPayee: '', retrait: '', client: '' }])
        break
    }
  }

  if (!mounted) {
    return null
  }

  // 4. Return statement
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`container mx-auto rounded-3xl shadow-lg p-2 sm:p-8 mt-2 sm:mt-12 mb-20 max-w-full sm:max-w-7xl ${SITE_COLORS[sites[currentSiteIndex]?.color || 'none'].bg}`}>
        {/* Add SiteCarousel here */}
        <SiteCarousel
          sites={sites}
          currentSiteIndex={currentSiteIndex}
          onSiteChange={handleSiteChange}
          onAddSite={handleAddSite}
          onUpdateSite={handleUpdateSite}
          onDeleteSite={handleDeleteSite}
        />

        {/* Form Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePreviousForm}
            disabled={currentFormIndex === 0}
            className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center">
            <span className="text-lg font-semibold mr-2">
              Form {currentFormIndex + 1} / {sites[currentSiteIndex].forms.length}
            </span>
            <button
              onClick={handleAddForm}
              className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <button
            onClick={handleNextForm}
            disabled={currentFormIndex === sites[currentSiteIndex].forms.length - 1}
            className="p-2 rounded-full bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Rest of the form content */}
        <form onSubmit={handleCalculate} className="space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <LanguageSelector
                selectedLanguage={voiceLanguage}
                onLanguageChange={setVoiceLanguage}
              />
            </div>
            <div>
              <select
                id="multiplierSelect"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1</option>
                <option value="1.1">1.1</option>
                <option value="1.2">1.2</option>
                <option value="1.3">1.3</option>
              </select>
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  id="fond"
                  value={fond}
                  onChange={(e) => setFond(e.target.value)}
                  placeholder="Fond"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <VoiceInputButton 
                  onVoiceInput={() => handleVoiceInputWithFeedback(setFond)}
                  showButton={voiceLanguage !== 'none'}
                  voiceLanguage={voiceLanguage}
                />
              </div>
              {errors.fond && <span className="text-red-500 text-sm">{errors.fond}</span>}
            </div>
            <div>
              <label htmlFor="solde_a_linstant" className="block text-sm font-medium text-gray-700 mb-1">
                Solde à l'instant
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="solde_a_linstant"
                  value={soldeALinstant}
                  onChange={(e) => setSoldeALinstant(e.target.value)}
                  placeholder="Solde à l'instant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <VoiceInputButton 
                  onVoiceInput={() => handleVoiceInputWithFeedback(setSoldeALinstant)}
                  showButton={voiceLanguage !== 'none'}
                  voiceLanguage={voiceLanguage}
                />
              </div>
              {errors.soldeALinstant && <span className="text-red-500 text-sm">{errors.soldeALinstant}</span>}
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  id="site"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="Site"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <VoiceInputButton 
                  onVoiceInput={() => handleVoiceInputWithFeedback(setSite, false)}
                  showButton={voiceLanguage !== 'none'}
                  voiceLanguage={voiceLanguage}
                />
              </div>
            </div>
            <div>
              <label htmlFor="solde_de_debut" className="block text-sm font-medium text-gray-700 mb-1">
                Solde de début
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="solde_de_debut"
                  value={soldeDeDebut}
                  onChange={(e) => setSoldeDeDebut(e.target.value)}
                  placeholder="Solde de début"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <VoiceInputButton 
                  onVoiceInput={() => handleVoiceInputWithFeedback(setSoldeDeDebut)}
                  showButton={voiceLanguage !== 'none'}
                  voiceLanguage={voiceLanguage}
                />
              </div>
              {errors.soldeDeDebut && <span className="text-red-500 text-sm">{errors.soldeDeDebut}</span>}
            </div>
          </div>

          {/* Tables */}
          <div className="space-y-6 mb-8"> {/* Add mb-8 here */}
            {/* Credit Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Crédit</h3>
                <button
                  type="button"
                  onClick={() => addRow('credit')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" /> {/* Delete button */}
                    <col className="w-[50px] sm:w-[70px]" /> {/* Total - even smaller */}
                    <col /> {/* Details - takes more space */}
                    <col className="w-[90px] sm:w-[110px]" /> {/* Client - smaller */}
                  </colgroup>
                  <tbody>
                    {creditRows.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeRow('credit', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.totalClient}
                            readOnly
                            className={totalInputClassName}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => handleDetailsChange(e, 'credit', index, 'details')}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('credit', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('credit', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('credit', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CreditPayee Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Crédit Payée</h3>
                <button
                  type="button"
                  onClick={() => addRow('creditPayee')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[50px] sm:w-[70px]" /> {/* Reduced width on mobile */}
                    <col />
                    <col className="w-[90px] sm:w-[110px]" />
                  </colgroup>
                  <tbody>
                    {creditPayeeRows.map((row: CreditPayeeRow, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <button
                            type="button"
                            onClick={() => removeRow('creditPayee', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <input
                            type="text"
                            value={row.totalPayee}
                            readOnly
                            className={totalInputClassName}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => handleDetailsChange(e, 'creditPayee', index, 'details')}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('creditPayee', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 p-1 sm:px-4 sm:py-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('creditPayee', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('creditPayee', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Depense Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Dépense</h3>
                <button
                  type="button"
                  onClick={() => addRow('depense')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[50px] sm:w-[70px]" /> {/* Reduced width on mobile */}
                    <col />
                    <col className="w-[90px] sm:w-[110px]" />
                  </colgroup>
                  <tbody>
                    {depenseRows.map((row, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => removeRow('depense', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.totalDepense}
                            readOnly
                            className={totalInputClassName}
                          />
                        </td>
                        <td className="p-2 border-l border-r border-gray-200">
                          <div className="relative w-full">
                            <textarea
                              value={row.details}
                              onChange={(e) => handleDetailsChange(e, 'depense', index, 'details')}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('depense', index, 'details', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('depense', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-1 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                                text-right
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('depense', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Retrait Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Retrait</h3>
                <button
                  type="button"
                  onClick={() => addRow('retrait')}
                  className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <colgroup>
                    <col className="w-[40px]" />
                    <col className="w-[80px]" />
                    <col className="w-[80px]" />
                    <col className="w-[120px]" />
                  </colgroup>
                  <tbody>
                    {retraitRows.map((row: RetraitRow, index: number) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2 border border-gray-200">
                          <button
                            type="button"
                            onClick={() => removeRow('retrait', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <input
                            type="text"
                            value={row.retraitPayee}
                            onChange={(e) => updateRow('retrait', index, 'retraitPayee', e.target.value)}
                            className={`w-full font-mono px-2 py-1 rounded ${
                              row.retraitPayee === 'OK' ? 'bg-gray-50' : ''
                            }`}
                            readOnly={row.retraitPayee === 'OK'}
                            maxLength={10}
                          />
                          {row.retraitPayee !== 'OK' && (
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'retraitPayee', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          )}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <div className="relative">
                            <textarea
                              value={row.retrait}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  updateRow('retrait', index, 'retrait', value)
                                }
                              }}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'retrait', value)
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <div className="relative">
                            <textarea
                              value={row.client}
                              onChange={(e) => updateRow('retrait', index, 'client', e.target.value)}
                              className={`
                                w-full 
                                min-h-[38px] 
                                resize-none 
                                overflow-hidden 
                                px-2 
                                py-1 
                                rounded
                                whitespace-normal
                                break-words
                                font-mono
                                text-base
                                leading-relaxed
                              `}
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto'
                                const newHeight = Math.max(38, e.currentTarget.scrollHeight)
                                e.currentTarget.style.height = `${newHeight}px`
                              }}
                              style={{
                                wordBreak: 'break-word',
                                wordWrap: 'break-word',
                                whiteSpace: 'pre-wrap'
                              }}
                            />
                            <VoiceInputButton 
                              onVoiceInput={() => handleVoiceInputWithFeedback(
                                (value) => updateRow('retrait', index, 'client', value),
                                false
                              )}
                              showButton={voiceLanguage !== 'none'}
                              voiceLanguage={voiceLanguage}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-6"> {/* Added space-y-6 for vertical spacing */}
            {/* Calculate Button and Result */}
            <div className="space-y-4"> {/* Added space-y-4 for vertical spacing */}
              <button
                type="submit"
                className="w-auto px-8 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 text-base font-medium mx-auto"
              >
                Calculate
              </button>
              
              {/* Result Display */}
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold mb-2">Result</h2>
                <p className="text-3xl font-bold text-blue-600">{result}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center justify-center gap-2"
              >
                <RotateCcw size={20} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this form?")) {
                    handleDeleteForm()
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </form>

        {/* History Slider */}
        <HistorySlider
          forms={sites[currentSiteIndex].forms}
          currentFormIndex={currentFormIndex}
          onFormSelect={(index: number, historicalForm?: Form) => {
            setCurrentFormIndex(index)
            if (historicalForm) {
              setMultiplier(historicalForm.multiplier)
              setFond(historicalForm.fond)
              setSoldeALinstant(historicalForm.soldeALinstant)
              setSoldeDeDebut(historicalForm.soldeDeDebut)
              setCreditRows(historicalForm.creditRows.map(row => ({...row})))
              setCreditPayeeRows(historicalForm.creditPayeeRows.map(row => ({...row})))
              setDepenseRows(historicalForm.depenseRows.map(row => ({...row})))
              setRetraitRows(historicalForm.retraitRows.map(row => ({...row})))
              setResult(historicalForm.result)
            } else {
              loadForm(sites[currentSiteIndex].forms[index])
            }
          }}
          siteColor={sites[currentSiteIndex].color || 'none'}
          removeRow={removeRow}
          updateRow={updateRow}
          handleVoiceInputWithFeedback={handleVoiceInputWithFeedback}
          voiceLanguage={voiceLanguage}
          addRow={addRow}  // Add this line
        />
      </div>
    </div>
  )
} 