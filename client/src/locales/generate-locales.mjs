import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the English template
const enTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, 'en/common.json'), 'utf8'));

// Language configurations with proper native names (100 total)
const languages = {
  // Existing languages (11)
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
  
  // Additional major world languages (continuing to 100)
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

// Create locale file for each language
Object.keys(languages).forEach(langCode => {
  const localeDir = path.join(__dirname, langCode);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }
  
  const filePath = path.join(localeDir, 'common.json');
  
  // Only create if doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(enTemplate, null, 2) + '\n', 'utf8');
    console.log(`Created: ${langCode}/common.json`);
  } else {
    console.log(`Skipped: ${langCode}/common.json (already exists)`);
  }
});

console.log('\n✅ Locale files generated successfully!');
console.log(`Total languages: ${Object.keys(languages).length}`);
