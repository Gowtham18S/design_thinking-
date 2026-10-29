/**
 * Native Script Transliteration & Conjunction Mapper
 * Provides accurate native-script transliteration for proper nouns and
 * grammatical conjunction connectors across Indic and foreign languages.
 */

export class NativeScriptTransliteration {
  // Conjunction mapping for clause re-assembly
  private static readonly CONJUNCTIONS: Record<string, Record<string, string>> = {
    'but': {
      'ta': 'ஆனால்',
      'hi': 'लेकिन',
      'ml': 'പക്ഷേ',
      'kn': 'ಆದರೆ',
      'bn': 'কিন্তু',
      'te': 'కానీ',
      'mr': 'परंतु',
      'gu': 'પરંતુ',
      'pa': 'ਪਰ',
      'ur': 'لیکن',
      'es': 'pero',
      'fr': 'mais',
      'de': 'aber',
      'ru': 'но',
      'ar': 'لكن',
      'zh': '但是'
    },
    'because': {
      'ta': 'ஏனெனில்',
      'hi': 'क्योंकि',
      'ml': 'കാരണം',
      'kn': 'ಏಕೆಂದರೆ',
      'bn': 'কারণ',
      'te': 'ఎందుకంటే',
      'mr': 'कारण',
      'gu': 'કારણ કે',
      'pa': 'ਕਿਉਂਕਿ',
      'ur': 'کیونکہ',
      'es': 'porque',
      'fr': 'parce que',
      'de': 'weil',
      'ru': 'потому что',
      'ar': 'لأن',
      'zh': '因为'
    },
    'and': {
      'ta': 'மற்றும்',
      'hi': 'और',
      'ml': 'കൂടാതെ',
      'kn': 'ಮತ್ತು',
      'bn': 'এবং',
      'te': 'మరియు',
      'mr': 'आणि',
      'gu': 'અને',
      'pa': 'ਅਤੇ',
      'ur': 'اور',
      'es': 'y',
      'fr': 'et',
      'de': 'und',
      'ru': 'и',
      'ar': 'و',
      'zh': '和'
    }
  };

  // Transliterations of common proper nouns into native scripts
  private static readonly NAME_TRANSLITERATIONS: Record<string, Record<string, string>> = {
    'Gowtham': {
      'ta': 'கௌதம்',
      'hi': 'गौतम',
      'ml': 'ഗൗതം',
      'kn': 'ಗೌತಮ್',
      'te': 'గౌతమ్',
      'bn': 'গৌতম',
      'mr': 'गौतम',
      'gu': 'ગૌતમ',
      'pa': 'ਗੌਤਮ',
      'ur': 'گوتم'
    },
    'Sundar': {
      'ta': 'சுந்தர்',
      'hi': 'सुंदर',
      'ml': 'സുന്ദർ',
      'kn': 'ಸುಂದರ್',
      'te': 'సుందర్',
      'bn': 'সুন্দর',
      'mr': 'सुंदर',
      'gu': 'સુંદર',
      'pa': 'ਸੁੰਦਰ',
      'ur': 'سندر'
    },
    'Priya': {
      'ta': 'பிரியா',
      'hi': 'प्रिया',
      'ml': 'പ്രിയ',
      'kn': 'ಪ್ರಿಯಾ',
      'te': 'ప్రియా',
      'bn': 'প্রিয়া',
      'mr': 'प्रिया',
      'gu': 'પ્રિયા',
      'pa': 'ਪ੍ਰਿਆ',
      'ur': 'پریا'
    },
    'Free Fire': {
      'ta': 'ஃப்ரீ ஃபயர்',
      'hi': 'फ्री फायर',
      'te': 'ఫ్రీ ఫైర్',
      'ml': 'ഫ്രീ ഫയർ',
      'kn': 'ಫ್ರೀ ಫೈರ್',
      'bn': 'ফ্রি ফায়ার'
    }
  };

  /**
   * Get native conjunction for a target language
   */
  public static getConjunction(conjunction: string, targetLang: string): string {
    const table = this.CONJUNCTIONS[conjunction.toLowerCase()];
    if (table && table[targetLang]) {
      return table[targetLang];
    }
    return conjunction;
  }

  /**
   * Transliterate recognized proper nouns in text to native script
   */
  public static transliterateProperNouns(text: string, targetLang: string): string {
    let result = text;
    for (const [englishName, langMap] of Object.entries(this.NAME_TRANSLITERATIONS)) {
      if (langMap[targetLang]) {
        const nativeName = langMap[targetLang];
        const regex = new RegExp(`\\b${englishName}\\b`, 'g');
        result = result.replace(regex, nativeName);
      }
    }
    return result;
  }
}
