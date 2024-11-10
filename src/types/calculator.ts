// Export all shared types
export type VoiceLanguage = 'none' | 'ar-SA' | 'fr-FR' | 'en-US'

export interface LanguageOption {
  code: VoiceLanguage
  label: string
  flag: string
}

export interface MessageContent {
  listening: string
  speak: string
  error: string
}

export type Messages = Record<VoiceLanguage, MessageContent>

export type ErrorKeys = 'fond' | 'soldeALinstant' | 'soldeDeDebut' | 'credit' | 'creditPayee' | 'depense' | 'retrait'
export type Errors = Record<ErrorKeys, string>

export interface CreditRow {
  totalClient: string
  details: string
  client: string
}

export interface CreditPayeeRow {
  totalPayee: string
  details: string
  client: string
}

export interface DepenseRow {
  totalDepense: string
  details: string
  client: string
}

export interface RetraitRow {
  retraitPayee: string
  retrait: string
  client: string
}

export type RowField = {
  credit: keyof CreditRow
  creditPayee: keyof CreditPayeeRow
  depense: keyof DepenseRow
  retrait: keyof RetraitRow
}

export type Form = {
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

export type SiteColor = 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'none'

export interface Site {
  id: string
  name: string
  color: SiteColor
  forms: Form[]
  statistics: {
    lastUpdated: string
  }
}