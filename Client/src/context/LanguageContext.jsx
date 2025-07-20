import React, { createContext, useState, useContext } from 'react';

const translations = {
  'en-US': {
    welcome: 'Welcome',
    convert: 'Convert',
    play: 'Play',
    stop: 'Stop',
    logout: 'Logout',
    enterText: 'Enter Text',
    results: 'Results',
    textEntered: 'Text Entered',
    keyWords: 'Key Words',
    signLanguage: 'Sign Language',
    animation: 'Animation',
    translatedText: 'Translated Text',
    sendAnotherMessage: 'Send another message'
  },
  'ta-IN': {
    welcome: 'வரவேற்கிறோம்',
    convert: 'மாற்று',
    play: 'இயக்கு',
    stop: 'நிறுத்து',
    logout: 'வெளியேறு',
    enterText: 'உரையை உள்ளிடவும்',
    results: 'முடிவுகள்',
    textEntered: 'உள்ளிடப்பட்ட உரை',
    keyWords: 'முக்கிய வார்த்தைகள்',
    signLanguage: 'சைகை மொழி',
    animation: 'அனிமேஷன்',
    translatedText: 'மொழிபெயர்க்கப்பட்ட உரை',
    sendAnotherMessage: 'மற்றொரு செய்தியை அனுப்பவும்'
  },
  'hi-IN': {
    welcome: 'स्वागत है',
    convert: 'परिवर्तित करें',
    play: 'चलाएं',
    stop: 'रोकें',
    logout: 'लॉग आउट',
    enterText: 'पाठ दर्ज करें',
    results: 'परिणाम',
    textEntered: 'दर्ज किया गया पाठ',
    keyWords: 'मुख्य शब्द',
    signLanguage: 'सांकेतिक भाषा',
    animation: 'एनिमेशन',
    translatedText: 'अनुवादित पाठ',
    sendAnotherMessage: 'दूसरा संदेश भेजें'
  },
  'kn-IN': {
    welcome: 'ಸ್ವಾಗತ',
    convert: 'ರೂಪಾಂತರಿಸಿ',
    play: 'ಪ್ಲೇ',
    stop: 'ನಿಲ್ಲಿಸಿ',
    logout: 'ಲಾಗ್ ಔಟ್',
    enterText: 'ಪಠ್ಯವನ್ನು ನಮೂದಿಸಿ',
    results: 'ಫಲಿತಾಂಶಗಳು',
    textEntered: 'ನಮೂದಿಸಿದ ಪಠ್ಯ',
    keyWords: 'ಪ್ರಮುಖ ಪದಗಳು',
    signLanguage: 'ಸೈನ್ ಭಾಷೆ',
    animation: 'ಆನಿಮೇಷನ್',
    translatedText: 'ಅನುವಾದಿತ ಪಠ್ಯ',
    sendAnotherMessage: 'ಮತ್ತೊಂದು ಸಂದೇಶವನ್ನು ಕಳುಹಿಸಿ'
  },
  'ml-IN': {
    welcome: 'സ്വാഗതം',
    convert: 'പരിവർത്തനം ചെയ്യുക',
    play: 'പ്ലേ',
    stop: 'നിർത്തുക',
    logout: 'ലോഗ് ഔട്ട്',
    enterText: 'വാചകം നൽകുക',
    results: 'ഫലങ്ങൾ',
    textEntered: 'നൽകിയ വാചകം',
    keyWords: 'പ്രധാന വാക്കുകൾ',
    signLanguage: 'സൈൻ ഭാഷ',
    animation: 'ആനിമേഷൻ',
    translatedText: 'വിവർത്തനം ചെയ്ത വാചകം',
    sendAnotherMessage: 'മറ്റൊരു സന്ദേശം അയയ്ക്കുക'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en-US');

  const translate = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 