import type { LanguageOption } from '@/types/calculator'

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'none', label: 'No Voice Input', flag: '🔇' },
  { code: 'ar-SA', label: 'العربية', flag: '🇸🇦' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' }
]

export const MESSAGES = {
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
} as const 