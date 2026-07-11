const fs = require('fs');
const path = require('path');

// Read the English template
const enTemplate = JSON.parse(fs.readFileSync(path.join(__dirname, 'en/common.json'), 'utf8'));

// Language configurations with proper native names
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
  
  // Major world languages (continuing to 100)
  "zh": "中文",        // Chinese
  "ar": "العربية",    // Arabic
  "hi": "हिन्दी",     // Hindi
  "id": "Bahasa Indonesia", // Indonesian
  "nl": "Nederlands",  // Dutch
  "pl": "Polski",      // Polish
  "sv": "Svenska",     // Swedish
  "vi": "Tiếng Việt",  // Vietnamese
  "uk": "Українська",  // Ukrainian
  "cs": "Čeština",     // Czech
  "da": "Dansk",       // Danish
  "fi": "Suomi",       // Finnish
  "el": "Ελληνικά",    // Greek
  "he": "עברית",       // Hebrew
  "hu": "Magyar",      // Hungarian
  "no": "Norsk",       // Norwegian
  "ro": "Română",      // Romanian
  "sk": "Slovenčina",  // Slovak
  "bg": "Български",   // Bulgarian
  "hr": "Hrvatski",    // Croatian
  "lt": "Lietuvių",    // Lithuanian
  "lv": "Latviešu",    // Latvian
  "sl": "Slovenščina", // Slovenian
  "sr": "Српски",      // Serbian
  "et": "Eesti",       // Estonian
  "is": "Íslenska",    // Icelandic
  "mk": "Македонски",  // Macedonian
  "sq": "Shqip",       // Albanian
  "bs": "Bosanski",    // Bosnian
  "ca": "Català",      // Catalan
  "eu": "Euskara",     // Basque
  "gl": "Galego",      // Galician
  "cy": "Cymraeg",     // Welsh
  "mt": "Malti",       // Maltese
  "ga": "Gaeilge",     // Irish
  "af": "Afrikaans",   // Afrikaans
  "sw": "Kiswahili",   // Swahili
  "am": "አማርኛ",       // Amharic
  "bn": "বাংলা",       // Bengali
  "gu": "ગુજરાતી",     // Gujarati
  "kn": "ಕನ್ನಡ",       // Kannada
  "ml": "മലയാളം",      // Malayalam
  "mr": "मराठी",       // Marathi
  "ne": "नेपाली",      // Nepali
  "or": "ଓଡ଼ିଆ",       // Odia
  "pa": "ਪੰਜਾਬੀ",      // Punjabi
  "si": "සිංහල",       // Sinhala
  "ta": "தமிழ்",       // Tamil
  "te": "తెలుగు",      // Telugu
  "ur": "اردو",        // Urdu
  "fa": "فارسی",       // Persian
  "ps": "پښتو",        // Pashto
  "ku": "Kurdî",       // Kurdish
  "my": "မြန်မာ",      // Burmese
  "km": "ខ្មែរ",       // Khmer
  "lo": "ລາວ",         // Lao
  "ms": "Bahasa Melayu", // Malay
  "tl": "Tagalog",     // Tagalog
  "jv": "Basa Jawa",   // Javanese
  "az": "Azərbaycan",  // Azerbaijani
  "kk": "Қазақ",       // Kazakh
  "uz": "O'zbek",      // Uzbek
  "hy": "Հայերեն",     // Armenian
  "ka": "ქართული",     // Georgian
  "mn": "Монгол",      // Mongolian
  "be": "Беларуская",  // Belarusian
  "lb": "Lëtzebuergesch", // Luxembourgish
  "fo": "Føroyskt",    // Faroese
  "fy": "Frysk",       // Frisian
  "gd": "Gàidhlig",    // Scottish Gaelic
  "kl": "Kalaallisut", // Greenlandic
  "mg": "Malagasy",    // Malagasy
  "mi": "Māori",       // Maori
  "mn": "Монгол",      // Mongolian
  "ne": "नेपाली",      // Nepali
  "ny": "Chichewa",    // Chichewa
  "sm": "Gagana Samoa", // Samoan
  "sn": "Shona",       // Shona
  "so": "Soomaali",    // Somali
  "st": "Sesotho",     // Southern Sotho
  "su": "Basa Sunda",  // Sundanese
  "tg": "Тоҷикӣ",      // Tajik
  "tk": "Türkmen",     // Turkmen
  "tt": "Татар",       // Tatar
  "ug": "ئۇيغۇر",      // Uyghur
  "yi": "ייִדיש",      // Yiddish
  "yo": "Yorùbá",      // Yoruba
  "zu": "isiZulu"      // Zulu
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
