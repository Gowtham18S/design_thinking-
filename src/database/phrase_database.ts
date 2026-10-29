import type { PhraseItem } from '../types';

export const OFFLINE_PRESET_PHRASES: PhraseItem[] = [
  // 🗣️ GREETINGS & DAILY CONVERSATION
  {
    id: 'gr_1',
    category: 'travel',
    english: 'How are you',
    translations: {
      en: 'How are you',
      ta: 'எப்படி இருக்கிறாய்?',
      te: 'ఎలా ఉన్నారు?',
      ml: 'സുഖമാണോ?',
      bn: 'আপনি কেমন আছেন?',
      mr: 'तुम्ही कसे आहात?',
      gu: 'તમે કેમ છો?',
      pa: 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?',
      ur: 'آپ کیسے ہیں؟'
    },
    phonetics: {
      en: 'How are you',
      ta: 'Eppadi irukkiraai?',
      te: 'Ela unnaaru?',
      ml: 'Sukhamano?',
      bn: 'Apni kemon achen?',
      mr: 'Tumhi kase ahat?',
      gu: 'Tame kem cho?',
      pa: 'Tusi kive ho?',
      ur: 'Aap kaise hain?'
    }
  },
  {
    id: 'gr_2',
    category: 'travel',
    english: 'Hello',
    translations: {
      en: 'Hello',
      ta: 'வணக்கம்',
      te: 'నమస్కారం',
      ml: 'നമസ്കാരം',
      bn: 'হ্যালো',
      mr: 'नमस्कार',
      gu: 'નમસ્તે',
      pa: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ',
      ur: 'السلام علیکم'
    },
    phonetics: {
      en: 'Hello',
      ta: 'Vanakkam',
      te: 'Namaskaram',
      ml: 'Namaskaram',
      bn: 'Hello',
      mr: 'Namaskar',
      gu: 'Namaste',
      pa: 'Sat Sri Akal',
      ur: 'Assalam-o-Alaikum'
    }
  },
  {
    id: 'gr_3',
    category: 'travel',
    english: 'Thank you',
    translations: {
      en: 'Thank you',
      ta: 'நன்றி',
      te: 'ధన్యవాదాలు',
      ml: 'നന്ദി',
      bn: 'ধন্যবাদ',
      mr: 'धन्यवाद',
      gu: 'આભાર',
      pa: 'ਧੰਨਵਾਦ',
      ur: 'شکریہ'
    },
    phonetics: {
      en: 'Thank you',
      ta: 'Nandri',
      te: 'Dhanyavaadalu',
      ml: 'Nandi',
      bn: 'Dhanyabaad',
      mr: 'Dhanyavaad',
      gu: 'Aabhar',
      pa: 'Dhanvaad',
      ur: 'Shukriya'
    }
  },
  {
    id: 'gr_4',
    category: 'travel',
    english: 'Good morning',
    translations: {
      en: 'Good morning',
      ta: 'காலை வணக்கம்',
      te: 'శుభోదయం',
      ml: 'സുപ്രഭാതം',
      bn: 'শুভ সকাল',
      mr: 'शुभ सकाळ',
      gu: 'શુભ સવાર',
      pa: 'ਸ਼ੁਭ ਸਵੇਰ',
      ur: 'صبح بخیر'
    },
    phonetics: {
      en: 'Good morning',
      ta: 'Kaalai vanakkam',
      te: 'Shubhodayam',
      ml: 'Suprabhatham',
      bn: 'Shuvo shokal',
      mr: 'Shubha sakal',
      gu: 'Shubh savar',
      pa: 'Shubh saver',
      ur: 'Subah ba-khair'
    }
  },
  {
    id: 'gr_5',
    category: 'travel',
    english: 'Where is the station',
    translations: {
      en: 'Where is the station',
      ta: 'நிலையம் எங்கே?',
      te: 'స్టేషన్ ఎక్కడ ఉంది?',
      ml: 'സ്റ്റേഷൻ എവിടെയാണ്?',
      bn: 'স্টেশনটি কোথায়?',
      mr: 'स्टेशन कुठे आहे?',
      gu: 'સ્ટેશન ક્યાં છે?',
      pa: 'ਸਟੇਸ਼ਨ ਕਿੱਥੇ ਹੈ?',
      ur: 'سٹیشن کہاں ہے؟'
    },
    phonetics: {
      en: 'Where is the station',
      ta: 'Nilayam engge?',
      te: 'Station ekkada undi?',
      ml: 'Station evideyaanu?',
      bn: 'Station kothay?',
      mr: 'Station kuthe ahe?',
      gu: 'Station kya che?',
      pa: 'Station kithe hai?',
      ur: 'Station kahan hai?'
    }
  },

  // 🚨 EMERGENCY
  {
    id: 'em_1',
    category: 'emergency',
    english: 'I need help',
    translations: {
      en: 'I need help',
      ta: 'எனக்கு உதவி வேண்டும்',
      te: 'నాకు సహాయం కావాలి',
      ml: 'എനിക്ക് സഹായം വേണം',
      bn: 'আমার সাহায্য দরকার',
      mr: 'मला मदतीची गरज आहे',
      gu: 'મને મદદની જરૂર છે',
      pa: 'ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ',
      ur: 'मुझे मदद चाहिये'
    },
    phonetics: {
      en: 'I need help',
      ta: 'Enakku udhavi vaendum',
      te: 'Naaku sahaayam kaavaali',
      ml: 'Enikku sahaayam venam',
      bn: 'Amar sahajjo dorkar',
      mr: 'Mala madatichi garaj ahe',
      gu: 'Mane madadni jarur che',
      pa: 'Mainu madad chahidi hai',
      ur: 'Mujhe madad chahiye'
    }
  },
  {
    id: 'em_2',
    category: 'emergency',
    english: 'Call an ambulance',
    translations: {
      en: 'Call an ambulance',
      ta: 'ஆம்புலன்ஸை அழைக்கவும்',
      te: 'అంబులెన్స్ పిలవండి',
      ml: 'ആംബുലൻസ് വിളിക്കൂ',
      bn: 'অ্যাম্বুলেন্স ডাকুন',
      mr: 'ॲम्बुलन्स बोलवा',
      gu: 'એમ્બ્યુલન્સ બોલાવો',
      pa: 'ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ',
      ur: 'ایمبولینس بلاؤ'
    },
    phonetics: {
      en: 'Call an ambulance',
      ta: 'Ambulance-ai azhaikkavum',
      te: 'Ambulance pilavandi',
      ml: 'Ambulance vilippoo',
      bn: 'Ambulance dakun',
      mr: 'Ambulance bolva',
      gu: 'Ambulance bolavo',
      pa: 'Ambulance bulao',
      ur: 'Ambulance bulao'
    }
  },
  {
    id: 'em_3',
    category: 'emergency',
    english: 'I am injured',
    translations: {
      en: 'I am injured',
      ta: 'எனக்கு காயம் ஏற்பட்டுள்ளது',
      te: 'నేను గాయపడ్డాను',
      ml: 'എനിക്ക് പരിക്കേറ്റിട്ടുണ്ട്',
      bn: 'আমি আহত',
      mr: 'मी जखमी आहे',
      gu: 'હું ઈજાગ્રસ્ત છું',
      pa: 'ਮੈਂ ਜ਼ਖਮੀ ਹਾਂ',
      ur: 'میں زخمی ہوں'
    },
    phonetics: {
      en: 'I am injured',
      ta: 'Enakku kaayam erpattulladhu',
      te: 'Nenu gaayapaddaanu',
      ml: 'Enikku parikkettittundu',
      bn: 'Ami aahoto',
      mr: 'Mi jakhami ahe',
      gu: 'Hu ijagrast chu',
      pa: 'Main zakhmi haan',
      ur: 'Main zakhmi hoon'
    }
  },
  {
    id: 'em_4',
    category: 'emergency',
    english: 'I am lost',
    translations: {
      en: 'I am lost',
      ta: 'நான் வழி தவறிவிட்டேன்',
      te: 'నేను దారి తప్పిపోయాను',
      ml: 'ഞാൻ വഴി തെറ്റി',
      bn: 'আমি হারিয়ে গেছি',
      mr: 'मी हरवलो आहे',
      gu: 'હું ખોવાઈ ગયો છું',
      pa: 'ਮੈਂ ਗੁਆਚ ਗਿਆ ਹਾਂ',
      ur: 'میں کھو گیا ہوں'
    },
    phonetics: {
      en: 'I am lost',
      ta: 'Naan vazhi thavari vittaen',
      te: 'Nenu daari thappipoyaanu',
      ml: 'Njan vazhi thetti',
      bn: 'Ami harikye gechi',
      mr: 'Mi haravlo ahe',
      gu: 'Hu khovai gayo chu',
      pa: 'Main guach gaya haan',
      ur: 'Main kho gaya hoon'
    }
  },
  {
    id: 'em_6',
    category: 'emergency',
    english: 'I need a hospital',
    translations: {
      en: 'I need a hospital',
      ta: 'எனக்கு மருத்துவமனை தேவை',
      te: 'నాకు ఆసుపత్రి కావాలి',
      ml: 'എനിക്ക് ഒരു ആശുപത്രി വേണം',
      bn: 'আমার হাসপাতাল দরকার',
      mr: 'मला रुग्णालय हवे आहे',
      gu: 'મને હોસ્પિટલની જરૂર છે',
      pa: 'ਮੈਨੂੰ ਹਸਪਤਾਲ ਚਾਹੀਦਾ ਹੈ',
      ur: 'مجھے ہسپتال چاہئے'
    },
    phonetics: {
      en: 'I need a hospital',
      ta: 'Enakku maruthuvamanai thevai',
      te: 'Naaku aasupathri kaavaali',
      ml: 'Enikku oru aashupathri venam',
      bn: 'Amar hospital dorkar',
      mr: 'Mala rugnalay have ahe',
      gu: 'Mane hospitalni jarur che',
      pa: 'Mainu hospital chahida hai',
      ur: 'Mujhe hospital chahiye'
    }
  },
  {
    id: 'em_7',
    category: 'emergency',
    english: 'Please call the police',
    translations: {
      en: 'Please call the police',
      ta: 'தயவுசெய்து காவல்துறையை அழைக்கவும்',
      te: 'దయచేసి పోలీసులను పిలవండి',
      ml: 'ദയവായി പൊലീസിനെ വിളിക്കൂ',
      bn: 'দয়া করে পুলিশ ডাকুন',
      mr: 'कृपया पोलिसांना बोलवा',
      gu: 'કૃપા કરીને પોલીસને બોલાવો',
      pa: 'ਕਿਰਪਾ ਕਰਕੇ ਪੁਲਿਸ ਨੂੰ ਬੁਲਾਓ',
      ur: 'براہ کرم پولیس کو بلاؤ'
    },
    phonetics: {
      en: 'Please call the police',
      ta: 'Thayavuseidhu kaavalthuraiyai azhaikkavum',
      te: 'Dayachesi policulanu pilavandi',
      ml: 'Dayavaayi policine vilippoo',
      bn: 'Doya kore police dakun',
      mr: 'Kripaya policanna bolva',
      gu: 'Kripa karine policene bolavo',
      pa: 'Kirpa karke police nu bulao',
      ur: 'Barae karam police ko bulao'
    }
  },

  // 🏥 HEALTHCARE
  {
    id: 'hc_1',
    category: 'healthcare',
    english: 'I have pain',
    translations: {
      en: 'I have pain',
      ta: 'எனக்கு வலி இருக்கிறது',
      te: 'నాకు నొప్పిగా ఉంది',
      ml: 'എനിക്ക് വേദനയുണ്ട്',
      bn: 'আমার ব্যথা করছে',
      mr: 'मला दुखत आहे',
      gu: 'મને દુખાવો થાય છે',
      pa: 'ਮੈਨੂੰ ਦਰਦ ਹੋ ਰਿਹਾ ਹੈ',
      ur: 'مجھے درد ہو رہا ہے'
    },
    phonetics: {
      en: 'I have pain',
      ta: 'Enakku vali irukkiradhu',
      te: 'Naaku noppiga undi',
      ml: 'Enikku vedhanayundu',
      bn: 'Amar byatha korche',
      mr: 'Mala dukhat ahe',
      gu: 'Mane dukhavo thay che',
      pa: 'Mainu dard ho reha hai',
      ur: 'Mujhe dard ho raha hai'
    }
  },
  {
    id: 'hc_2',
    category: 'healthcare',
    english: 'I have a fever',
    translations: {
      en: 'I have a fever',
      ta: 'எனக்கு காய்ச்சல் உள்ளது',
      te: 'నాకు జ్వరం ఉంది',
      ml: 'എനിക്ക് പനിയുണ്ട്',
      bn: 'আমার জ্বর হয়েছে',
      mr: 'मला ताप आला आहे',
      gu: 'મને તાવ આવે છે',
      pa: 'ਮੈਨੂੰ ਬੁਖ਼ਾਰ ਹੈ',
      ur: 'مجھے بخار ہے'
    },
    phonetics: {
      en: 'I have a fever',
      ta: 'Enakku kaaichal ulladhu',
      te: 'Naaku jvaram undi',
      ml: 'Enikku paniyundu',
      bn: 'Amar jor hoyeche',
      mr: 'Mala tap ala ahe',
      gu: 'Mane tav ave che',
      pa: 'Mainu bukhar hai',
      ur: 'Mujhe bukhar hai'
    }
  },
  {
    id: 'hc_3',
    category: 'healthcare',
    english: 'I need a doctor',
    translations: {
      en: 'I need a doctor',
      ta: 'எனக்கு மருத்துவர் தேவை',
      te: 'నాకు డాక్టర్ కావాలి',
      ml: 'എനിക്ക് ഒരു ഡോക്ടറെ വേണം',
      bn: 'আমার একজন ডাক্তার দরকার',
      mr: 'मला डॉक्टर हवे आहेत',
      gu: 'મને ડૉક્ટરની જરૂર છે',
      pa: 'ਮੈਨੂੰ ਡਾਕਟਰ ਦੀ ਲੋੜ ਹੈ',
      ur: 'مجھے ڈاکٹر چاہئے'
    },
    phonetics: {
      en: 'I need a doctor',
      ta: 'Enakku maruthuvar thevai',
      te: 'Naaku doctor kaavaali',
      ml: 'Enikku oru doctore venam',
      bn: 'Amar ekjon doctor dorkar',
      mr: 'Mala doctor have ahet',
      gu: 'Mane doctorni jarur che',
      pa: 'Mainu doctor di lor hai',
      ur: 'Mujhe doctor chahiye'
    }
  },
  {
    id: 'hc_4',
    category: 'healthcare',
    english: 'I need medicine',
    translations: {
      en: 'I need medicine',
      ta: 'எனக்கு மருந்து தேவை',
      te: 'నాకు మందులు కావాలి',
      ml: 'എനിക്ക് മരുന്ന് വേണം',
      bn: 'আমার ওষুধ দরকার',
      mr: 'मला औषध हवे आहे',
      gu: 'મને દવાની જરૂર છે',
      pa: 'ਮੈਨੂੰ ਦਵਾਈ ਚਾਹੀਦੀ ਹੈ',
      ur: 'مجھے دوا چاہئے'
    },
    phonetics: {
      en: 'I need medicine',
      ta: 'Enakku marundhu thevai',
      te: 'Naaku mandulu kaavaali',
      ml: 'Enikku marunnu venam',
      bn: 'Amar osud dorkar',
      mr: 'Mala aushadh have ahe',
      gu: 'Mane davani jarur che',
      pa: 'Mainu dawai chahidi hai',
      ur: 'Mujhe dawa chahiye'
    }
  }
];

export const PHRASE_BUILDER_COMPONENTS: {
  persons: Array<Record<string, string>>;
  actions: Array<Record<string, string>>;
  objects: Array<Record<string, string>>;
  locations: Array<Record<string, string>>;
} = {
  persons: [
    { en: 'I', ta: 'நான்', hi: 'मैं', ml: 'ഞാൻ', te: 'నేను', kn: 'ನಾನು', bn: 'আমি', mr: 'मी', gu: 'હું', pa: 'ਮੈਂ', ur: 'میں' }
  ],
  actions: [
    { en: 'need', ta: 'தேவை', hi: 'चाहिए', ml: 'വേണം', te: 'కావాలి', kn: 'ಬೇಕು', bn: 'দরকার', mr: 'हवे', gu: 'જરૂર', pa: 'ਲੋੜ', ur: 'چاہئے' },
    { en: 'want', ta: 'வேண்டும்', hi: 'चाहता हूँ', ml: 'വേണം', te: 'కావాలి', kn: 'ಬೇಕು', bn: 'চাই', mr: 'पाहिजे', gu: 'જોઈએ', pa: 'ਚਾਹੀਦਾ', ur: 'چاہتا ہوں' }
  ],
  objects: [
    { en: 'water', ta: 'தண்ணீர்', hi: 'पानी', ml: 'വെള്ളം', te: 'నీళ్ళు', kn: 'ನೀರು', bn: 'জল', mr: 'पाणी', gu: 'પાણી', pa: 'ਪਾਣੀ', ur: 'پانی' },
    { en: 'help', ta: 'உதவி', hi: 'मदद', ml: 'സഹായം', te: 'సహాయం', kn: 'ಸಹಾಯ', bn: 'সাহায্য', mr: 'मदत', gu: 'મદદ', pa: 'ਮਦਦ', ur: 'مدد' },
    { en: 'medicine', ta: 'மருந்து', hi: 'दवाई', ml: 'മരുന്ന്', te: 'మందులు', kn: 'ಔಷಧ', bn: 'ওষুধ', mr: 'औषध', gu: 'દવા', pa: 'ਦਵਾਈ', ur: 'دوا' }
  ],
  locations: [
    { en: 'here', ta: 'இங்கே', hi: 'यहाँ', ml: 'ഇവിടെ', te: 'ఇక్కడ', kn: 'இಲ್ಲಿ', bn: 'এখানে', mr: 'येथे', gu: 'અહીં', pa: 'ਇੱਥੇ', ur: 'یہاں' },
    { en: 'hospital', ta: 'மருத்துவமனையில்', hi: 'अस्पताल में', ml: 'ആശുപത്രിയിൽ', te: 'ఆసుపత్రిలో', kn: 'ಆಸ್ಪತ್ರೆಯಲ್ಲಿ', bn: 'হাসপাতালে', mr: 'रुग्णालयात', gu: 'હોસ્પિટલમાં', pa: 'ਹਸਪਤਾਲ ਵਿਚ', ur: 'ہسپتال میں' }
  ]
};
