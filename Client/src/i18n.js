import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Text to Sign Language": "Text to Sign Language",
      "Enter text here": "Enter text here",
      "Convert": "Convert",
      "Results": "Results",
      "Text entered:": "Text entered:",
      "Key words:": "Key words:",
      "Sign Language Animation": "Sign Language Animation",
      "Play Animation": "Play Animation",
      "Playing...": "Playing...",
      "Logout": "Logout"
    }
  },
  ta: {
    translation: {
      "Text to Sign Language": "உரை முதல் கை மொழி",
      "Enter text here": "உரையை இங்கே உள்ளிடவும்",
      "Convert": "மாற்று",
      "Results": "முடிவுகள்",
      "Text entered:": "உள்ளிடப்பட்ட உரை:",
      "Key words:": "முக்கிய சொற்கள்:",
      "Sign Language Animation": "கை மொழி அனிமேஷன்",
      "Play Animation": "அனிமேஷனை இயக்கவும்",
      "Playing...": "இயக்கப்படுகிறது...",
      "Logout": "வெளியேறு"
    }
  },
  hi: {
    translation: {
      "Text to Sign Language": "पाठ से सांकेतिक भाषा",
      "Enter text here": "यहाँ पाठ दर्ज करें",
      "Convert": "परिवर्तित करें",
      "Results": "परिणाम",
      "Text entered:": "दर्ज किया गया पाठ:",
      "Key words:": "मुख्य शब्द:",
      "Sign Language Animation": "सांकेतिक भाषा एनीमेशन",
      "Play Animation": "एनीमेशन चलाएँ",
      "Playing...": "चल रहा है...",
      "Logout": "लॉग आउट"
    }
  },
  kn: {
    translation: {
      "Text to Sign Language": "ಪಠ್ಯದಿಂದ ಸಂಜ್ಞಾ ಭಾಷೆ",
      "Enter text here": "ಇಲ್ಲಿ ಪಠ್ಯವನ್ನು ನಮೂದಿಸಿ",
      "Convert": "ಮಾಱ്ಱು",
      "Results": "ಫಲಿತಾಂಶಗಳು",
      "Text entered:": "ನಮೂದಿಸಿದ ಪಠ್ಯ:",
      "Key words:": "ಮುಖ್ಯ ಪದಗಳು:",
      "Sign Language Animation": "ಸಂಜ್ಞಾ ಭಾಷೆ ಅನಿಮೇಶನ್",
      "Play Animation": "ಅನಿಮೇಶನ್ ಪ್ಲೇ ಮಾಡಿ",
      "Playing...": "ಪ್ಲೇ ಆಗುತ್ತಿದೆ...",
      "Logout": "ಲಾಗ್ ಔಟ್"
    }
  },
  ml: {
    translation: {
      "Text to Sign Language": "വാചകത്തിൽ നിന്ന് സൈൻ ഭാഷയിലേക്ക്",
      "Enter text here": "വാചകം ഇവിടെ നൽകുക",
      "Convert": "മാറ്റുക",
      "Results": "ഫലങ്ങൾ",
      "Text entered:": "നൽകിയ വാചകം:",
      "Key words:": "പ്രധാന വാക്കുകൾ:",
      "Sign Language Animation": "സൈൻ ഭാഷ അനിമേഷൻ",
      "Play Animation": "അനിമേഷൻ പ്ലേ ചെയ്യുക",
      "Playing...": "പ്ലേ ചെയ്യുന്നു...",
      "Logout": "ലോഗ് ഔട്ട്"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 