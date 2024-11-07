'use client'

import React, { useState, useCallback } from 'react'
import { Mic, Trash, Plus, Languages, ChevronRight, ChevronLeft, Edit2, Check, X, Trash2, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ErrorKeys = 'fond' | 'soldeALinstant' | 'soldeDeDebut' | 'credit' | 'creditPayee' | 'depense' | 'retrait'

type Errors = Record<ErrorKeys, string>

interface CreditRow {
  totalClient: string
  details: string
  client: string
}

interface CreditPayeeRow {
  totalPayee: string
  details: string
  client: string
}

interface DepenseRow {
  totalDepense: string
  details: string
  client: string
}

interface RetraitRow {
  retraitPayee: string
  retrait: string
  client: string
}

type RowField = {
  credit: keyof CreditRow
  creditPayee: keyof CreditPayeeRow
  depense: keyof DepenseRow
  retrait: keyof RetraitRow
}

type VoiceLanguage = 'none' | 'ar-SA' | 'fr-FR' | 'en-US'

interface LanguageOption {
  code: VoiceLanguage
  label: string
  flag: string
}

type Form = {
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
}

type Site = {
  id: string
  name: string
  forms: Form[]
  statistics: {
    lastUpdated: string
  }
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'none', label: 'No Voice Input', flag: '🔇' },
  { code: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' }
]

const MESSAGES = {
  'none': {
    listening: 'Listening...',
    speak: 'Please speak clearly',
    error: 'Voice recognition error. Please try again.'
  },
  'ar-SA': {
    listening: 'جاري الاستماع...',
    speak: 'تحدث بوضوح من فضلك',
    error: 'خطأ في التعرف على الصوت. حاول مرة أخرى'
  },
  'fr-FR': {
    listening: 'Écoute en cours...',
    speak: 'Parlez clairement s\'il vous plaît',
    error: 'Erreur de reconnaissance vocale. Veuillez réessayer.'
  },
  'en-US': {
    listening: 'Listening...',
    speak: 'Please speak clearly',
    error: 'Voice recognition error. Please try again.'
  }
}

function VoiceFeedback({ 
  isListening, 
  language 
}: { 
  isListening: boolean
  language: VoiceLanguage 
}) {
  if (!isListening) return null

  const messages = MESSAGES[language]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <p className="text-lg mb-3">{messages.listening}</p>
        <p className="text-sm text-gray-600 mb-3">
          {messages.speak}
        </p>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
          <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full delay-75" />
          <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full delay-150" />
        </div>
      </div>
    </div>
  )
}

function VoiceInputButton({ 
  onVoiceInput,
  showButton,
  voiceLanguage
}: { 
  onVoiceInput: () => void
  showButton: boolean
  voiceLanguage: VoiceLanguage
}) {
  if (!showButton || voiceLanguage === 'none') return null

  return (
    <button
      type="button"
      onClick={onVoiceInput}
      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      title="Click to use voice input"
    >
      <Mic size={20} />
    </button>
  )
}

function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange 
}: { 
  selectedLanguage: VoiceLanguage
  onLanguageChange: (lang: VoiceLanguage) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Languages size={20} />
        <span>{LANGUAGE_OPTIONS.find(lang => lang.code === selectedLanguage)?.flag}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 ${
                selectedLanguage === lang.code ? 'bg-gray-50' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SiteCard({ 
  site, 
  isDefault = false, 
  onSelect, 
  onUpdateSite,
  onDeleteSite 
}: {
  site: Site
  isDefault?: boolean
  onSelect: (siteId: string) => void
  onUpdateSite: (updatedSite: Site) => void
  onDeleteSite: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(site.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdateSite({ ...site, name: editedName.trim() })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedName(site.name)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (isDefault) {
      alert("Cannot delete the default site")
      return
    }
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDeleteSite()
    setShowDeleteConfirm(false)
  }

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const calculateTotalForSite = () => {
    return site.forms.reduce((sum, form) => {
      const resultString = form.result.replace('Total: ', '').trim()
      const formTotal = parseFloat(resultString)
      
      if (!isNaN(formTotal)) {
        return sum + formTotal
      }
      return sum
    }, 0).toFixed(1)
  }

  return (
    <div 
      className={`
        relative min-w-[300px] p-6 rounded-lg shadow-lg
        transition-all duration-300 hover:shadow-xl
        ${isDefault ? 'bg-blue-50' : 'bg-white'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="px-2 py-1 border rounded"
              autoFocus
            />
            <button onClick={handleSave} className="text-green-500 hover:text-green-700">
              <Check size={20} />
            </button>
            <button onClick={handleCancel} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{site.name}</h3>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
        
        {!isEditing && !isDefault && (
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Delete site"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div 
        className="space-y-2 cursor-pointer"
        onClick={() => !isEditing && !showDeleteConfirm && onSelect(site.id)}
      >
        <p>Forms: {site.forms.length}</p>
        <p className="font-semibold">Total: {calculateTotalForSite()}</p>
        <p className="text-sm text-gray-500">
          Updated {getTimeAgo(site.statistics.lastUpdated)}
        </p>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-lg p-4">
          <p className="text-center mb-4">Are you sure you want to delete this site?</p>
          <div className="flex gap-2">
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SiteCarousel({ 
  sites, 
  currentSiteIndex, 
  onSiteChange, 
  onAddSite,
  onUpdateSite,
  onDeleteSite
}: {
  sites: Site[]
  currentSiteIndex: number
  onSiteChange: (index: number) => void
  onAddSite: () => void
  onUpdateSite: (siteIndex: number, updatedSite: Site) => void
  onDeleteSite: (siteIndex: number) => void
}) {
  const calculateTotalAllSites = () => {
    return sites.reduce((total, site) => {
      const siteTotal = site.forms.reduce((formTotal, form) => {
        const resultString = form.result.replace('Total: ', '').trim()
        const formValue = parseFloat(resultString)
        return formTotal + (isNaN(formValue) ? 0 : formValue)
      }, 0)
      return total + siteTotal
    }, 0).toFixed(1)
  }

  return (
    <div className="relative w-full overflow-hidden mb-8">
      <div className="flex items-center space-x-4 p-4 overflow-x-auto">
        {sites.map((site, index) => (
          <SiteCard
            key={site.id}
            site={site}
            isDefault={index === 0}
            onSelect={() => onSiteChange(index)}
            onUpdateSite={(updatedSite) => onUpdateSite(index, updatedSite)}
            onDeleteSite={() => onDeleteSite(index)}
          />
        ))}
        <div
          onClick={onAddSite}
          className="min-w-[300px] h-[200px] bg-white rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center p-6"
        >
          <div className="text-lg font-semibold text-gray-600 mb-4">Total Sites: {calculateTotalAllSites()}</div>
          <Plus size={24} className="text-gray-400 mb-2" />
          <span className="text-gray-600">Add New Site</span>
        </div>
      </div>
    </div>
  )
}

export default function CalculatorWithSiteCarousel() {
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
  const [isListening, setIsListening] = useState(false)
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('none')
  const [sites, setSites] = useState<Site[]>([
    {
      id: '1',
      name: 'Default Site',
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
        multiplier: '1.1'
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
  ])
  const [currentSiteIndex, setCurrentSiteIndex] = useState(0)
  const [currentFormIndex, setCurrentFormIndex] = useState(0)
  const [timestamp, setTimestamp] = useState(new Date().toISOString())

  const processVoiceInput = (transcript: string, isNumberField: boolean = true): string => {
    if (!isNumberField) {
      return transcript.trim()
    }

    const numberWords: { [key: string]: string } = {
      'zéro': '0', 'un': '1', 'deux': '2', 'trois': '3', 'quatre': '4',
      'cinq': '5', 'six': '6', 'sept': '7', 'huit': '8', 'neuf': '9',
      'dix': '10', 'onze': '11', 'douze': '12', 'treize': '13', 'quatorze': '14',
      'quinze': '15', 'seize': '16', 'vingt': '20', 'trente': '30',
      'quarante': '40', 'cinquante': '50', 'soixante': '60',
      'soixante-dix': '70', 'quatre-vingt': '80', 'quatre-vingt-dix': '90',
      'cent': '100', 'cents': '100', 'mille': '1000',
      'صفر': '0', 'واحد': '1', 'اثنين': '2', 'ثلاثة': '3', 'اربعة': '4',
      'خمسة': '5', 'ستة': '6', 'سبعة': '7', 'ثمانية': '8', 'تسعة': '9',
      'عشرة': '10', 'عشرين': '20', 'ثلاثين': '30', 'اربعين': '40',
      'خمسين': '50', 'ستين': '60', 'سبعين': '70', 'ثمانين': '80',
      'تسعين': '90', 'مية': '100', 'الف': '1000'
    }

    let processed = transcript.toLowerCase().trim()

    const corrections: { [key: string]: string } = {
      'virgule': '.', 'point': '.', 'plus': '+', 'et': '+', 'euro': '', 'euros': '',
      'zéros': 'zéro', 'OK': 'ok', 'فاصلة': '.', 'نقطة': '.', 'زائد': '+',
      'و': '+', 'دينار': '', 'دنانير': '', 'موافق': 'ok', 'نعم': 'ok'
    }

    const arabicToEnglishNumbers: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    }

    const matches = processed.match(/(\w+)\s+cents?/g)
    if (matches) {
      matches.forEach(match => {
        const [number] = match.split(/\s+/)
        if (numberWords[number]) {
          const value = parseInt(numberWords[number]) * 100
          processed = processed.replace(match, value.toString())
        }
      })
    }

    Object.entries(arabicToEnglishNumbers).forEach(([arabic, english]) => {
      processed = processed.replace(new RegExp(arabic, 'g'), english)
    })

    Object.entries(corrections).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(key, 'g'), value)
    })

    Object.entries(numberWords).forEach(([word, digit]) => {
      processed = processed.replace(new RegExp(`\\b${word}\\b`, 'g'), digit)
    })

    processed = processed.replace(/(\d+)[.,](\d+)/g, '$1.$2')
    processed = processed.replace(/(\d+)\s*\+\s*(\d+)/g, '$1+$2')

    if (processed.includes('+')) {
      return processed
    }

    processed = processed.replace(/[^\d.+]/g, '')

    return processed
  }

  const handleVoiceInput = useCallback((callback: (value: string) => void, isNumberField: boolean = true) => {
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
  }, [voiceLanguage])

  const handleVoiceInputWithFeedback = useCallback((
    callback: (value: string) => void,
    isNumberField: boolean = true
  ) => {
    setIsListening(true)
    handleVoiceInput((value: string) => {
      if (isNumberField) {
        callback(value)
      } else {
        callback(value)
      }
      setIsListening(false)
    }, isNumberField)
  }, [handleVoiceInput])

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

  const calculateRowTotal = (strInput: string) => {
    const numbers = strInput.split('+').map(num => parseFloat(num.trim())).filter(num => !isNaN(num))
    return numbers.reduce((acc, num) => acc + num, 0)
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

  const removeRow = (tableType: 'credit' | 'creditPayee' | 'depense' | 'retrait', index: number) => {
    switch (tableType) {
      case 'credit':
        if (creditRows.length > 1) {
          const newRows = [...creditRows]
          newRows.splice(index, 1)
          setCreditRows(newRows)
        }
        break
      case 'creditPayee':
        if (creditPayeeRows.length > 1) {
          const newRows = [...creditPayeeRows]
          newRows.splice(index, 1)
          setCreditPayeeRows(newRows)
        }
        break
      case 'depense':
        if (depenseRows.length > 1) {
          const newRows = [...depenseRows]
          newRows.splice(index, 1)
          setDepenseRows(newRows)
        }
        break
      case 'retrait':
        if (retraitRows.length > 1) {
          const newRows = [...retraitRows]
          newRows.splice(index, 1)
          setRetraitRows(newRows)
        }
        break
    }
  }

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
          newCreditRows[index].totalClient = calculateRowTotal(value).toFixed(1)
        }
        setCreditRows(newCreditRows)
        break
      case 'creditPayee':
        const newCreditPayeeRows = [...creditPayeeRows]
        ;(newCreditPayeeRows[index] as any)[field] = value
        if (field === 'details') {
          newCreditPayeeRows[index].totalPayee = calculateRowTotal(value).toFixed(1)
        }
        setCreditPayeeRows(newCreditPayeeRows)
        break
      case 'depense':
        const newDepenseRows = [...depenseRows]
        ;(newDepenseRows[index] as any)[field] = value
        if (field === 'details') {
          newDepenseRows[index].totalDepense = calculateRowTotal(value).toFixed(1)
        }
        setDepenseRows(newDepenseRows)
        break
      case 'retrait':
        const newRetraitRows = [...retraitRows]
        ;(newRetraitRows[index] as any)[field] = value
        setRetraitRows(newRetraitRows)
        break
    }
  }

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

    // Update the current form with the new result
    const updatedForms = [...sites[currentSiteIndex].forms]
    updatedForms[currentFormIndex] = {
      ...updatedForms[currentFormIndex],
      result: newResult,
      timestamp: new Date().toISOString(),
      creditRows,
      creditPayeeRows,
      depenseRows,
      retraitRows,
      fond,
      soldeALinstant,
      soldeDeDebut,
      site,
      multiplier
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
    checkClientBalances()
  }

  const checkClientBalances = () => {
    const newCreditRows = [...creditRows]
    const retraitMap = new Map()

    retraitRows.forEach(row => {
      const clientName = row.client.trim()
      if (clientName) {
        retraitMap.set(clientName, (retraitMap.get(clientName) || 0) + parseFloat(row.retrait || '0'))
      }
    })

    newCreditRows.forEach((row, index) => {
      const clientName = row.client.trim()
      if (!clientName) return

      const creditTotal = parseFloat(row.totalClient) || 0
      const retraitTotal = retraitMap.get(clientName) || 0

      const details = row.details.split('+').map(d => d.trim())

      if (creditTotal === retraitTotal) {
        newCreditRows[index].details = `<span class="line-through">${row.details}</span>`
        newCreditRows[index].totalClient = '0'
      } else if (creditTotal < retraitTotal) {
        newCreditRows[index].details = `<span class="line-through">${row.details}</span>`
        const rest = retraitTotal - creditTotal
        if (confirm(`Le crédit est inférieur au retrait pour ${clientName}. Voulez-vous ajouter le reste (${rest.toFixed(1)}) au crédit payé?`)) {
          setCreditPayeeRows([...creditPayeeRows, { totalPayee: rest.toFixed(1), details: rest.toFixed(1), client: clientName }])
        }
        newCreditRows[index].totalClient = '0'
      } else {
        let remainingRetrait = retraitTotal
        const sortedDetails = details.map(d => parseFloat(d)).sort((a, b) => a - b)
        const newDetails = sortedDetails.map(detail => {
          if (remainingRetrait >= detail) {
            remainingRetrait -= detail
            return `<span class="line-through">${detail.toFixed(1)}</span>`
          } else if (remainingRetrait > 0) {
            const strikethrough = remainingRetrait.toFixed(1)
            const remaining = (detail - remainingRetrait).toFixed(1)
            remainingRetrait = 0
            return `<span class="line-through">${strikethrough}</span> + ${remaining}`
          } else {
            return detail.toFixed(1)
          }
        })
        newCreditRows[index].details = newDetails.join(' + ')
        newCreditRows[index].totalClient = (creditTotal - retraitTotal).toFixed(1)
      }
    })

    setCreditRows(newCreditRows)
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
    setVoiceLanguage('none')
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

  const handleAddSite = () => {
    const newSite: Site = {
      id: (sites.length + 1).toString(),
      name: `New Site ${sites.length + 1}`,
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
        site: `New Site ${sites.length + 1}`,
        multiplier: '1.1'
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
    setSites([...sites, newSite])
    setCurrentSiteIndex(sites.length)
    setCurrentFormIndex(0)
    loadForm(newSite.forms[0])
  }

  const handleUpdateSite = (siteIndex: number, updatedSite: Site) => {
    const newSites = [...sites]
    newSites[siteIndex] = updatedSite
    setSites(newSites)
  }

  const handleDeleteSite = (siteIndex: number) => {
    if (siteIndex === 0) {
      alert("Cannot delete the default site")
      return
    }
    const newSites = sites.filter((_, index) => index !== siteIndex)
    setSites(newSites)
    if (currentSiteIndex >= siteIndex) {
      setCurrentSiteIndex(currentSiteIndex - 1)
    }
  }

  const handleSiteChange = (index: number) => {
    setCurrentSiteIndex(index)
    setCurrentFormIndex(0)
    loadForm(sites[index].forms[0])
  }

  const loadForm = (form: Form) => {
    if (!form) return

    setMultiplier(form.multiplier)
    setFond(form.fond)
    setSoldeALinstant(form.soldeALinstant)
    setSite(form.site)
    setSoldeDeDebut(form.soldeDeDebut)
    setCreditRows(form.creditRows)
    setCreditPayeeRows(form.creditPayeeRows)
    setDepenseRows(form.depenseRows)
    setRetraitRows(form.retraitRows)
    setResult(form.result)
  }

  const handlePreviousForm = () => {
    if (currentFormIndex > 0) {
      setCurrentFormIndex(currentFormIndex - 1)
      loadForm(sites[currentSiteIndex].forms[currentFormIndex - 1])
    }
  }

  const handleNextForm = () => {
    if (currentFormIndex < sites[currentSiteIndex].forms.length - 1) {
      setCurrentFormIndex(currentFormIndex + 1)
      loadForm(sites[currentSiteIndex].forms[currentFormIndex + 1])
    }
  }

  const handleAddForm = () => {
    const newForm: Form = {
      id: (sites[currentSiteIndex].forms.length + 1).toString(),
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
      multiplier: '1.1'
    }
    const updatedSite = {
      ...sites[currentSiteIndex],
      forms: [...sites[currentSiteIndex].forms, newForm],
      statistics: {
        ...sites[currentSiteIndex].statistics,
        lastUpdated: new Date().toISOString()
      }
    }
    handleUpdateSite(currentSiteIndex, updatedSite)
    setCurrentFormIndex(updatedSite.forms.length - 1)
    loadForm(newForm)
  }

  const handleDeleteForm = () => {
    if (sites[currentSiteIndex].forms.length === 1) {
      alert("Cannot delete the last form")
      return
    }
    const updatedForms = sites[currentSiteIndex].forms.filter((_, index) => index !== currentFormIndex)
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

  return (
    <div className="container mx-auto bg-white rounded-3xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-12">
      <SiteCarousel
        sites={sites}
        currentSiteIndex={currentSiteIndex}
        onSiteChange={handleSiteChange}
        onAddSite={handleAddSite}
        onUpdateSite={handleUpdateSite}
        onDeleteSite={handleDeleteSite}
      />

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

      <VoiceFeedback isListening={isListening} language={voiceLanguage} />
      <div id="timestamp" className="text-center mb-4 text-xl text-gray-600">{timestamp}</div>
      <form onSubmit={handleCalculate} className="space-y-6">
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
                type="number"
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
            <label htmlFor="solde_a_linstant" className="block text-sm font-medium text-gray-700 mb-1">Solde à l'instant</label>
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
            <label htmlFor="solde_de_debut" className="block text-sm font-medium text-gray-700 mb-1">Solde de début</label>
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

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Crédit</label>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2">Total Client</th>
                  <th className="border border-gray-300 px-4 py-2">Détailles</th>
                  <th className="border border-gray-300 px-4 py-2">Client</th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {creditRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => removeRow('credit', index)} className="text-red-500 hover:text-red-700">
                        <Trash size={20} />
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={row.totalClient}
                        readOnly
                        className="w-full px-2 py-1 border-none bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.details}
                          onChange={(e) => updateRow('credit', index, 'details', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('credit', index, 'details', value),
                            true
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.client}
                          onChange={(e) => updateRow('credit', index, 'client', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('credit', index, 'client', value),
                            false
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => addRow('credit')} className="text-green-500 hover:text-green-700">
                        <Plus size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.credit && <span className="text-red-500 text-sm">{errors.credit}</span>}
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Crédit Payée</label>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2">Total Payée</th>
                  <th className="border border-gray-300 px-4 py-2">Détailles</th>
                  <th className="border border-gray-300 px-4 py-2">Client</th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {creditPayeeRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => removeRow('creditPayee', index)} className="text-red-500 hover:text-red-700">
                        <Trash size={20} />
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={row.totalPayee}
                        readOnly
                        className="w-full px-2 py-1 border-none bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.details}
                          onChange={(e) => updateRow('creditPayee', index, 'details', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('creditPayee', index, 'details', value),
                            true
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.client}
                          onChange={(e) => updateRow('creditPayee', index, 'client', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('creditPayee', index, 'client', value),
                            false
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => addRow('creditPayee')} className="text-green-500 hover:text-green-700">
                        <Plus size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.creditPayee && <span className="text-red-500 text-sm">{errors.creditPayee}</span>}
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Dépense</label>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2">Total Dépense</th>
                  <th className="border border-gray-300 px-4 py-2">Détailles</th>
                  <th className="border border-gray-300 px-4 py-2">Client</th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {depenseRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => removeRow('depense', index)} className="text-red-500 hover:text-red-700">
                        <Trash size={20} />
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={row.totalDepense}
                        readOnly
                        className="w-full px-2 py-1 border-none bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.details}
                          onChange={(e) => updateRow('depense', index, 'details', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('depense', index, 'details', value),
                            true
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.client}
                          onChange={(e) => updateRow('depense', index, 'client', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('depense', index, 'client', value),
                            false
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => addRow('depense')} className="text-green-500 hover:text-green-700">
                        <Plus size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.depense && <span className="text-red-500 text-sm">{errors.depense}</span>}
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Retrait</label>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2">Retrait Payée</th>
                  <th className="border border-gray-300 px-4 py-2">Retrait</th>
                  <th className="border border-gray-300 px-4 py-2">Client</th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {retraitRows.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => removeRow('retrait', index)} className="text-red-500 hover:text-red-700">
                        <Trash size={20} />
                      </button>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.retraitPayee}
                          onChange={(e) => updateRow('retrait', index, 'retraitPayee', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('retrait', index, 'retraitPayee', value),
                            true
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.retrait}
                          onChange={(e) => updateRow('retrait', index, 'retrait', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('retrait', index, 'retrait', value),
                            true
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={row.client}
                          onChange={(e) => updateRow('retrait', index, 'client', e.target.value)}
                          className="w-full px-2 py-1 pr-8 border-none"
                        />
                        <VoiceInputButton 
                          onVoiceInput={() => handleVoiceInputWithFeedback(
                            (value: string) => updateRow('retrait', index, 'client', value),
                            false
                          )}
                          showButton={voiceLanguage !== 'none'}
                          voiceLanguage={voiceLanguage}
                        />
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button type="button" onClick={() => addRow('retrait')} className="text-green-500 hover:text-green-700">
                        <Plus size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row justify-between mt-2">
              <div>
                <strong>Total Retrait: </strong>
                <span id="totalRetrait">
                  {retraitRows.reduce((total, row) => total + parseFloat(row.retrait || '0'), 0).toFixed(1)}
                </span>
              </div>
              <div>
                <strong>Total Retrait Payée: </strong>
                <span id="totalRetraitPayee">
                  {retraitRows.reduce((total, row) => {
                    if (row.retraitPayee === 'OK') {
                      return total + parseFloat(row.retrait || '0')
                    }
                    return total + parseFloat(row.retraitPayee || '0')
                  }, 0).toFixed(1)}
                </span>
              </div>
            </div>
            {errors.retrait && <span className="text-red-500 text-sm">{errors.retrait}</span>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-6">
          <button type="submit" className="w-full sm:w-auto mb-2 sm:mb-0 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Calcule
          </button>
          <div className="flex-grow text-center">
            <h2 id="res" className="text-2xl sm:text-3xl font-bold text-green-600">{result}</h2>
          </div>
          <div className="flex space-x-2">
            <button type="button" onClick={handleReset} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              <RotateCcw size={20} />
            </button>
            <button type="button" onClick={handleDeleteForm} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}