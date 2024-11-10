'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, Trash, Plus, Languages, ChevronRight, ChevronLeft, Edit2, Check, X, Trash2, RotateCcw, Book } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  type ErrorKeys, type Errors, type CreditRow, type CreditPayeeRow, type DepenseRow,
  type RetraitRow, type RowField, type VoiceLanguage, type LanguageOption, type Form, type Site,
  type Messages, type MessageContent, SiteColor
} from '@/types/calculator'

// Import the components from shared
import { 
  VoiceFeedback, 
  VoiceInputButton, 
  LanguageSelector, 
  SiteCarousel,
  SITE_COLORS 
} from '@/components/calculator/shared'

// Import constants
import { LANGUAGE_OPTIONS, MESSAGES } from '@/constants/calculator'

// Import the useLocalStorage hook
import { useLocalStorage } from '@/hooks/useLocalStorage'

// Import the HistorySlider component
import { HistorySlider } from '@/components/calculator/HistorySlider'

// Add this function before handleVoiceInput
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

export function CalculatorWithSiteManagement() {
  // All hooks at the top
  const [mounted, setMounted] = useState(false)
  const [timestamp, setTimestamp] = useState('')
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
  const [sites, setSites] = useLocalStorage<Site[]>('calculator-management-sites', [
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
        multiplier: '1.1'
      }],
      statistics: {
        lastUpdated: new Date().toISOString()
      }
    }
  ])
  const [currentSiteIndex, setCurrentSiteIndex] = useLocalStorage('management-current-site-index', 0)
  const [currentFormIndex, setCurrentFormIndex] = useLocalStorage('management-current-form-index', 0)
  const [isClient, setIsClient] = useState(false)

  // useEffect hooks
  useEffect(() => {
    setMounted(true)
    setTimestamp(new Date().toISOString())
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Define handleVoiceInput first
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
    // Save current form state before switching sites
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
      result,
      calculationHistory: updatedForms[currentFormIndex].calculationHistory || []
    }

    const updatedCurrentSite = {
      ...sites[currentSiteIndex],
      forms: updatedForms
    }
    handleUpdateSite(currentSiteIndex, updatedCurrentSite)

    // Then switch sites
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

  // Early return after all hooks
  if (!mounted) {
    return null
  }

  return (
    <div className={`container mx-auto rounded-3xl shadow-lg p-2 sm:p-8 mt-2 sm:mt-12 mb-20 max-w-full sm:max-w-7xl ${SITE_COLORS[sites[currentSiteIndex].color].bg}`}>
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

      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
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
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Crédit Payée</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
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
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Dépense</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
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
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">Retrait</label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
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
              {errors.retrait && <span className="text-red-500 text-sm">{errors.retrait}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Calculate
          </button>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              <RotateCcw size={20} className="inline-block mr-2" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleDeleteForm}
              className="flex-1 sm:flex-none px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Delete Form
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Result</h2>
          <p className="text-xl">{result}</p>
        </div>
      </form>

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
        siteColor={sites[currentSiteIndex].color}
      />
    </div>
  )
}