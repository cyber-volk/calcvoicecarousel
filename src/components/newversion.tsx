'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  Mic, Trash, Plus, Languages, ChevronRight, ChevronLeft, 
  Edit2, Check, X, Trash2, RotateCcw, Book, Clock, Palette 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Import shared types and components
import { Form, Site, SiteColor, CreditRow, CreditPayeeRow, DepenseRow, RetraitRow, RowField, ErrorKeys, Errors, VoiceLanguage } from '@/types/calculator'
import { HistorySlider } from '@/components/calculator/HistorySlider'
import { 
  SITE_COLORS, 
  VoiceFeedback, 
  VoiceInputButton, 
  LanguageSelector,
  SiteCarousel 
} from '@/components/calculator/shared'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { processVoiceInput } from '@/utils/voice-processing'
import { MESSAGES } from '@/constants/calculator'

// Remove all the duplicate type definitions since we're importing them

export default function NewVersionCalculator() {
  // All state hooks
  const [mounted, setMounted] = useState(false)
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
  const [isClient, setIsClient] = useState(false)

  // LocalStorage hooks
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
        calculationHistory: [] // Initialize empty calculation history
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
  ])
  const [currentSiteIndex, setCurrentSiteIndex] = useLocalStorage('current-site-index', 0)
  const [currentFormIndex, setCurrentFormIndex] = useLocalStorage('current-form-index', 0)

  // useEffect for initialization
  useEffect(() => {
    setMounted(true)
  }, [])

  // useEffect for isClient
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Voice input handlers
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
  }, [voiceLanguage])

  const handleVoiceInputWithFeedback = useCallback((
    callback: (value: string) => void,
    isNumberField: boolean = true
  ) => {
    handleVoiceInput((value: string) => {
      callback(value)
      setIsListening(false)
    }, isNumberField)
  }, [handleVoiceInput])

  // Input validation
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

  // Row management functions
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

  // Form management functions
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
      multiplier: multiplier
    }

    // Update the current form with the new calculation history
    const updatedForms = [...sites[currentSiteIndex].forms]
    updatedForms[currentFormIndex] = {
      ...updatedForms[currentFormIndex],
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

  // Site management functions
  const handleAddSite = () => {
    const newSite: Site = {
      id: (sites.length + 1).toString(),
      name: `New Site ${sites.length + 1}`,
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

  // Form navigation functions
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
          multiplier: '1.1'
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

  if (!mounted) {
    return null
  }

  return (
    <div className={`container mx-auto rounded-3xl shadow-lg p-2 sm:p-8 mt-2 sm:mt-12 mb-20 max-w-full sm:max-w-7xl ${SITE_COLORS[sites[currentSiteIndex]?.color || 'none'].bg}`}>
      {/* Add timestamp at the top */}
      <div className="text-center mb-6">
        <p className="text-lg text-gray-600">
          {new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </p>
      </div>

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
        <div className="space-y-6">
          {/* Credit Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-medium text-gray-700">Crédit</label>
              <button
                type="button"
                onClick={() => addRow('credit')}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2"></th>
                    <th className="border border-gray-300 px-4 py-2">Total Client</th>
                    <th className="border border-gray-300 px-4 py-2">Détailles</th>
                    <th className="border border-gray-300 px-4 py-2">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {creditRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow('credit', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="text"
                          value={row.totalClient}
                          readOnly
                          className="w-full bg-gray-50"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.details}
                            onChange={(e) => updateRow('credit', index, 'details', e.target.value)}
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('credit', index, 'details', value))}
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
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('credit', index, 'client', value), false)}
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

          {/* Credit Payee Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-medium text-gray-700">Crédit Payée</label>
              <button
                type="button"
                onClick={() => addRow('creditPayee')}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2"></th>
                    <th className="border border-gray-300 px-4 py-2">Total Payée</th>
                    <th className="border border-gray-300 px-4 py-2">Détailles</th>
                    <th className="border border-gray-300 px-4 py-2">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {creditPayeeRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow('creditPayee', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="text"
                          value={row.totalPayee}
                          readOnly
                          className="w-full bg-gray-50"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.details}
                            onChange={(e) => updateRow('creditPayee', index, 'details', e.target.value)}
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('creditPayee', index, 'details', value))}
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
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('creditPayee', index, 'client', value), false)}
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-medium text-gray-700">Dépense</label>
              <button
                type="button"
                onClick={() => addRow('depense')}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2"></th>
                    <th className="border border-gray-300 px-4 py-2">Total Dépense</th>
                    <th className="border border-gray-300 px-4 py-2">Détailles</th>
                    <th className="border border-gray-300 px-4 py-2">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {depenseRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow('depense', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <input
                          type="text"
                          value={row.totalDepense}
                          readOnly
                          className="w-full bg-gray-50"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.details}
                            onChange={(e) => updateRow('depense', index, 'details', e.target.value)}
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('depense', index, 'details', value))}
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
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('depense', index, 'client', value), false)}
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-lg font-medium text-gray-700">Retrait</label>
              <button
                type="button"
                onClick={() => addRow('retrait')}
                className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2"></th>
                    <th className="border border-gray-300 px-4 py-2">Retrait Payée</th>
                    <th className="border border-gray-300 px-4 py-2">Retrait</th>
                    <th className="border border-gray-300 px-4 py-2">Client</th>
                  </tr>
                </thead>
                <tbody>
                  {retraitRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow('retrait', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash size={16} />
                        </button>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.retraitPayee}
                            onChange={(e) => updateRow('retrait', index, 'retraitPayee', e.target.value)}
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('retrait', index, 'retraitPayee', value))}
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
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('retrait', index, 'retrait', value))}
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
                            className="w-full"
                          />
                          <VoiceInputButton 
                            onVoiceInput={() => handleVoiceInputWithFeedback((value) => updateRow('retrait', index, 'client', value), false)}
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            Calculate
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Reset
            </button>
            <button
              type="button"
              onClick={handleDeleteForm}
              className="flex-1 sm:flex-none px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <Trash2 size={20} />
              Delete Form
            </button>
          </div>
        </div>

        {/* Result Display */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Result</h2>
          <p className="text-3xl font-bold text-blue-600">{result}</p>
        </div>
      </form>

      {/* History Slider */}
      <HistorySlider
        forms={sites[currentSiteIndex].forms}
        currentFormIndex={currentFormIndex}
        onFormSelect={(index: number, historicalForm?: Form) => {
          setCurrentFormIndex(index)
          if (historicalForm) {
            // Load the historical form data
            setMultiplier(historicalForm.multiplier)
            setFond(historicalForm.fond)
            setSoldeALinstant(historicalForm.soldeALinstant)
            setSoldeDeDebut(historicalForm.soldeDeDebut)
            setCreditRows(historicalForm.creditRows.map((row: CreditRow) => ({...row})))
            setCreditPayeeRows(historicalForm.creditPayeeRows.map((row: CreditPayeeRow) => ({...row})))
            setDepenseRows(historicalForm.depenseRows.map((row: DepenseRow) => ({...row})))
            setRetraitRows(historicalForm.retraitRows.map((row: RetraitRow) => ({...row})))
            setResult(historicalForm.result)
          } else {
            loadForm(sites[currentSiteIndex].forms[index])
          }
        }}
        siteColor={sites[currentSiteIndex].color || 'none'}
      />
    </div>
  )
}
