'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, Languages, Plus, Edit2, Check, X, Trash2, Palette } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  VoiceLanguage, LanguageOption, Site
} from '@/types/calculator'
import { LANGUAGE_OPTIONS, MESSAGES } from '@/constants/calculator'
import { SiteColor } from '@/types/calculator'

export function VoiceFeedback({ 
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

export function VoiceInputButton({ 
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

export function LanguageSelector({ 
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

interface SiteCardProps {
  site: Site
  isDefault?: boolean
  onSelect: (siteId: string) => void
  onUpdateSite: (updatedSite: Site) => void
  onDeleteSite: () => void
}

export function SiteCard({ 
  site, 
  isDefault = false, 
  onSelect, 
  onUpdateSite,
  onDeleteSite 
}: SiteCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(site.name)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setEditedName(site.name)
  }, [site.name])

  if (!mounted) {
    return null
  }

  return (
    <div 
      className={`
        relative flex-shrink-0 w-[280px] p-4 rounded-lg shadow-lg
        transition-all duration-300 hover:shadow-xl cursor-pointer
        ${SITE_COLORS[site.color || 'none'].bg}
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
            <button onClick={() => {
              if (editedName.trim()) {
                onUpdateSite({ ...site, name: editedName.trim() })
                setIsEditing(false)
              }
            }} className="text-green-500 hover:text-green-700">
              <Check size={20} />
            </button>
            <button onClick={() => {
              setEditedName(site.name)
              setIsEditing(false)
            }} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">{site.name}</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 size={16} />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowColorPicker(!showColorPicker)
                }}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <Palette size={16} />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg z-50 flex gap-2">
                  {Object.entries(SITE_COLORS).map(([color, styles]) => (
                    <button
                      key={color}
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateSite({ ...site, color: color as SiteColor })
                        setShowColorPicker(false)
                      }}
                      className={`w-8 h-8 rounded-full ${styles.bg} ${styles.hover} border-2 border-gray-200 transition-all duration-200 transform hover:scale-110
                        ${site.color === color ? 'ring-2 ring-offset-2 ' + styles.ring : ''}
                      `}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {!isDefault && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteConfirm(true)
            }}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div 
        onClick={() => onSelect(site.id)}
        className="space-y-2"
      >
        <p>Forms: {site.forms.length}</p>
        <p className="font-semibold">
          Total: {site.forms.reduce((total, form) => {
            const result = parseFloat(form.result.replace('Total: ', '')) || 0
            return total + result
          }, 0).toFixed(1)}
        </p>
        <p className="text-sm text-gray-500">
          Updated {formatDistanceToNow(new Date(site.statistics.lastUpdated), { addSuffix: true })}
        </p>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-lg p-4">
          <p className="text-center mb-4">Are you sure you want to delete this site?</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteSite()
                setShowDeleteConfirm(false)
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteConfirm(false)
              }}
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

interface SiteCarouselProps {
  sites: Site[]
  currentSiteIndex: number
  onSiteChange: (index: number) => void
  onAddSite: () => void
  onUpdateSite: (siteIndex: number, updatedSite: Site) => void
  onDeleteSite: (siteIndex: number) => void
}

export function SiteCarousel({ 
  sites, 
  currentSiteIndex, 
  onSiteChange, 
  onAddSite,
  onUpdateSite,
  onDeleteSite
}: SiteCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleAddSite = () => {
    onAddSite()
    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollTo({
          left: carouselRef.current.scrollWidth,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  return (
    <div className="relative w-full overflow-hidden mb-8">
      <div 
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scroll-smooth"
      >
        {sites.map((site, index) => (
          <div key={site.id} className="snap-start">
            <SiteCard
              site={site}
              isDefault={index === 0}
              onSelect={() => onSiteChange(index)}
              onUpdateSite={(updatedSite) => onUpdateSite(index, updatedSite)}
              onDeleteSite={() => onDeleteSite(index)}
            />
          </div>
        ))}
        <div className="snap-start">
          <button
            onClick={handleAddSite}
            className="flex-shrink-0 w-[280px] h-[200px] bg-white rounded-lg shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4"
          >
            <div className="text-lg font-semibold text-gray-600">
              Total Sites: {sites.reduce((total, site) => {
                return total + site.forms.reduce((formTotal, form) => {
                  const result = parseFloat(form.result.replace('Total: ', '')) || 0
                  return formTotal + result
                }, 0)
              }, 0).toFixed(1)}
            </div>
            <Plus size={24} className="text-gray-400" />
            <span className="text-gray-600">Add New Site</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export const SITE_COLORS: { [key in SiteColor]: { bg: string; hover: string; ring: string } } = {
  none: { bg: 'bg-white', hover: 'hover:bg-gray-50', ring: 'ring-gray-200' },
  blue: { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', ring: 'ring-blue-300' },
  green: { bg: 'bg-green-100', hover: 'hover:bg-green-200', ring: 'ring-green-300' },
  yellow: { bg: 'bg-yellow-100', hover: 'hover:bg-yellow-200', ring: 'ring-yellow-300' },
  purple: { bg: 'bg-purple-100', hover: 'hover:bg-purple-200', ring: 'ring-purple-300' },
  red: { bg: 'bg-red-100', hover: 'hover:bg-red-200', ring: 'ring-red-300' }
}