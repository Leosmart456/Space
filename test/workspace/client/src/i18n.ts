import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Map language codes to display names (100+ languages with translations)
export const languageCodeToName: Record<string, string> = {
  "en": "English",
  "de": "Deutsch",
  "es": "Español",
  "fr": "Français",
  "it": "Italiano",
  "ja": "日本語",
  "ko": "한국어",
  "pt": "Português",
  "ru": "Русский",
  "th": "ไทย",
  "tr": "Türkçe",
  "zh": "中文",
  "ar": "العربية",
  "hi": "हिन्दी",
  "id": "Bahasa Indonesia",
  "nl": "Nederlands",
  "pl": "Polski",
  "sv": "Svenska",
  "vi": "Tiếng Việt",
  "uk": "Українська",
  "cs": "Čeština",
  "da": "Dansk",
  "fi": "Suomi",
  "el": "Ελληνικά",
  "he": "עברית",
  "hu": "Magyar",
  "no": "Norsk",
  "ro": "Română",
  "sk": "Slovenčina",
  "bg": "Български",
  "hr": "Hrvatski",
  "lt": "Lietuvių",
  "lv": "Latviešu",
  "sl": "Slovenščina",
  "sr": "Српски",
  "et": "Eesti",
  "is": "Íslenska",
  "mk": "Македонски",
  "sq": "Shqip",
  "bs": "Bosanski",
  "ca": "Català",
  "eu": "Euskara",
  "gl": "Galego",
  "cy": "Cymraeg",
  "mt": "Malti",
  "ga": "Gaeilge",
  "af": "Afrikaans",
  "sw": "Kiswahili",
  "am": "አማርኛ",
  "bn": "বাংলা",
  "gu": "ગુજરાતી",
  "kn": "ಕನ್ನಡ",
  "ml": "മലയാളം",
  "mr": "मराठी",
  "ne": "नेपाली",
  "or": "ଓଡ଼ିଆ",
  "pa": "ਪੰਜਾਬੀ",
  "si": "සිංහල",
  "ta": "தமிழ்",
  "te": "తెలుగు",
  "ur": "اردو",
  "fa": "فارسی",
  "ps": "پښتو",
  "ku": "Kurdî",
  "my": "မြန်မာ",
  "km": "ខ្មែរ",
  "lo": "ລາວ",
  "ms": "Bahasa Melayu",
  "tl": "Tagalog",
  "jv": "Basa Jawa",
  "az": "Azərbaycan",
  "kk": "Қазақ",
  "uz": "O'zbek",
  "hy": "Հայերեն",
  "ka": "ქართული",
  "mn": "Монгол",
  "be": "Беларуская",
  "lb": "Lëtzebuergesch",
  "fo": "Føroyskt",
  "fy": "Frysk",
  "gd": "Gàidhlig",
  "kl": "Kalaallisut",
  "mg": "Malagasy",
  "mi": "Māori",
  "ny": "Chichewa",
  "sm": "Gagana Samoa",
  "sn": "Shona",
  "so": "Soomaali",
  "st": "Sesotho",
  "su": "Basa Sunda",
  "tg": "Тоҷикӣ",
  "tk": "Türkmen",
  "tt": "Татар",
  "ug": "ئۇيغۇر",
  "yi": "ייִדיש",
  "yo": "Yorùbá",
  "zu": "isiZulu",
  "xh": "isiXhosa",
  "ig": "Igbo",
  "ha": "Hausa",
  "rw": "Kinyarwanda",
  "lg": "Luganda",
  "wo": "Wolof"
};

// Map display names to language codes
export const languageNameToCode: Record<string, string> = Object.entries(languageCodeToName).reduce((acc, [code, name]) => {
  acc[name] = code;
  return acc;
}, {} as Record<string, string>);

// Lazy load translation files
const loadLocaleData = async (locale: string) => {
  const data = await import(`./locales/${locale}/common.json`);
  return data.default;
};

// Custom backend plugin for lazy loading
const lazyLoadBackend = {
  type: 'backend' as const,
  init() {},
  read(language: string, namespace: string, callback: (err: Error | null, data?: any) => void) {
    // Normalize locale code (e.g., en-US -> en)
    const baseLocale = language.split('-')[0];
    
    loadLocaleData(baseLocale)
      .then((data) => {
        callback(null, data);
      })
      .catch((error) => {
        // If loading fails, try fallback
        if (baseLocale !== 'en') {
          loadLocaleData('en')
            .then((data) => {
              callback(null, data);
            })
            .catch((fallbackError) => {
              callback(fallbackError);
            });
        } else {
          callback(error);
        }
      });
  },
};

i18n
  .use(lazyLoadBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    
    // Disable Suspense to prevent hanging
    react: {
      useSuspense: false,
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
