import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaMicrophoneSlash, FaSignOutAlt, FaGlobe, FaExchangeAlt } from "react-icons/fa";
import "../App.css";
import "./MainScreen.css";
import "../i18n";
import { useLanguage } from "../context/LanguageContext";

// Add your supported languages here
const LANGUAGES = [
  { code: "en-US", label: "English", icon: "🇺🇸" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", icon: "🇮🇳" },
  { code: "hi-IN", label: "हिंदी (Hindi)", icon: "🇮🇳" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)", icon: "🇮🇳" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)", icon: "🇮🇳" }
];

// Translation mappings for common words
const TRANSLATIONS = {
  "ta-IN": {
    "hello": "வணக்கம்",
    "welcome": "வரவேற்கிறோம்",
    "thank you": "நன்றி",
    "good": "நல்ல",
    "morning": "காலை",
    "night": "இரவு",
    "food": "உணவு",
    "water": "தண்ணீர்",
    "help": "உதவி",
    "please": "தயவு செய்து"
  },
  "hi-IN": {
    "hello": "नमस्ते",
    "welcome": "स्वागत है",
    "thank you": "धन्यवाद",
    "good": "अच्छा",
    "morning": "सुप्रभात",
    "night": "रात",
    "food": "भोजन",
    "water": "पानी",
    "help": "मदद",
    "please": "कृपया"
  },
  "kn-IN": {
    "hello": "ನಮಸ್ಕಾರ",
    "welcome": "ಸ್ವಾಗತ",
    "thank you": "ಧನ್ಯವಾದ",
    "good": "ಒಳ್ಳೆಯ",
    "morning": "ಬೆಳಗ್ಗೆ",
    "night": "ರಾತ್ರಿ",
    "food": "ಆಹಾರ",
    "water": "ನೀರು",
    "help": "ಸಹಾಯ",
    "please": "ದಯವಿಟ್ಟು"
  },
  "ml-IN": {
    "hello": "ഹലോ",
    "welcome": "സ്വാഗതം",
    "thank you": "നന്ദി",
    "good": "നല്ല",
    "morning": "രാവിലെ",
    "night": "രാത്രി",
    "food": "ഭക്ഷണം",
    "water": "വെള്ളം",
    "help": "സഹായം",
    "please": "ദയവായി"
  }
};

const MainScreen = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [words, setWords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [user, setUser] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [specialReply, setSpecialReply] = useState(null);
  const { language, setLanguage, translate } = useLanguage();
  const navigate = useNavigate();
  const [showResponse, setShowResponse] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [currentKeywordIdx, setCurrentKeywordIdx] = useState(0);
  const videoPlayerRef = useRef(null);

  // Set default language to English on component mount
  useEffect(() => {
    if (!language) {
      setLanguage("en-US");
    }
  }, [language, setLanguage]);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token);
    console.log("Raw user data from localStorage:", userData);
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log("Parsed user data from localStorage:", parsedUser);
        
        if (parsedUser) {
          // If username is missing, try to get it from the server
          if (!parsedUser.username && token) {
            console.log("Username missing, fetching from server");
            fetch('http://localhost:5000/api/verify', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
              .then(response => {
                console.log("Verify response status:", response.status);
                return response.json();
              })
              .then(data => {
                console.log("Verify response data:", data);
                if (data.user) {
                  console.log("Setting user from server response:", data.user);
                  localStorage.setItem('user', JSON.stringify(data.user));
                  setUser(data.user);
                } else {
                  console.error("No user data in verify response");
                }
              })
              .catch(error => console.error("Error fetching user data:", error));
          } else {
            console.log("Setting user from localStorage:", parsedUser);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      console.log("No user data in localStorage");
    }

    // Get CSRF token from Django
    fetch("http://localhost:8000/get-csrf-token/", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setCsrfToken(data.csrfToken))
      .catch((error) => console.error("Error fetching CSRF token:", error));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSpecialReply(null);
    try {
      const response = await fetch("http://localhost:8000/api/text-to-sign-reply/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.special_reply) {
        setSpecialReply({
          text: data.reply_text,
          video: data.reply_video,
        });
        setWords([]);
      } else {
        setWords(data.words || []);
        setSpecialReply(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRecord = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = language;

    recognition.onresult = (event) => {
      setText(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const playVideos = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentKeywordIdx(0);
    const videoPlayer = videoPlayerRef.current;
    const videoSources = words.map(word => {
      const encodedWord = encodeURIComponent(word);
      return `http://localhost:8000/static/${encodedWord}.mp4`;
    });
    let currentIndex = 0;
    const playNextVideo = () => {
      if (currentIndex >= videoSources.length) {
        setIsPlaying(false);
        return;
      }
      setCurrentKeywordIdx(currentIndex);
      videoPlayer.src = videoSources[currentIndex];
      videoPlayer.onerror = (error) => {
        console.error("Error playing video:", error);
        currentIndex++;
        playNextVideo();
      };
      videoPlayer.onended = () => {
        currentIndex++;
        playNextVideo();
      };
      videoPlayer.play().catch(error => {
        console.error("Error playing video:", error);
        currentIndex++;
        playNextVideo();
      });
    };
    playNextVideo();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/signin";
  };

  const translateText = (text, targetLang) => {
    if (targetLang === "en-US") return text;
    // Split on spaces and punctuation
    const words = text.match(/\b\w+\b/g) || [];
    const translatedWords = words.map(word => {
      const translation = TRANSLATIONS[targetLang]?.[word.toLowerCase()];
      return translation || word;
    });
    return translatedWords.join(' ');
  };

  const handleLanguageSelect = (langCode) => {
    setSelectedLanguage(langCode);
    setShowLanguageDropdown(false);
    // Translate the current text
    const translated = translateText(text, langCode);
    setTranslatedText(translated);
  };

  // Update translation when text changes
  useEffect(() => {
    if (text) {
      const translated = translateText(text, selectedLanguage);
      setTranslatedText(translated);
    } else {
      setTranslatedText("");
    }
  }, [text, selectedLanguage]);

  const handleShowResponse = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/get-sign-response/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.reply_text && data.reply_video) {
        navigate('/reply', {
          state: {
            originalMessage: text,
            signAsset: data.reply_video
          }
        });
      } else {
        console.error('Invalid response data:', data);
      }
    } catch (error) {
      console.error('Error getting sign response:', error);
    }
  };

  return (
    <div className="app">
      <div className="split left">
        <div className="card">
          <h2>{translate('signLanguage')}</h2>
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-group">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={translate('enterText')}
                className="text-input"
              />
              <button
                type="button"
                onClick={handleRecord}
                className="mic-button"
              >
                <FaMicrophone />
              </button>
            </div>
            <button type="submit" className="convert-button">
              {translate('convert')}
            </button>
          </form>

          {/* Translation Box */}
          <div className="translation-box">
            <div className="translation-header">
              <div className="language-selector">
                <span className="selected-language">
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.icon} 
                  {LANGUAGES.find(l => l.code === selectedLanguage)?.label}
                </span>
                <button 
                  className="language-dropdown-button"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                >
                  <FaGlobe />
                </button>
              </div>
              {showLanguageDropdown && (
                <div className="language-dropdown-menu">
                  {LANGUAGES.map(lang => (
                    <div
                      key={lang.code}
                      className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                      onClick={() => handleLanguageSelect(lang.code)}
                    >
                      <span className="language-icon">{lang.icon}</span>
                      <span className="language-label">{lang.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="translation-content">
              <div className="original-text">
                <p className="label">Original Text:</p>
                <p className="text">{text}</p>
              </div>
              <div className="translated-text">
                <p className="label">Translated Text:</p>
                <p className="text">{translatedText || "Enter text to translate..."}</p>
              </div>
            </div>
          </div>

          <div className="results">
            <h3>{translate('results')}</h3>
            <div className="text-display">
              <p className="label">{translate('textEntered')}:</p>
              <p className="value">{text}</p>
            </div>
            <div className="keywords">
              <p className="label">{translate('keyWords')}:</p>
              <ul>
                {words.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="split right">
        <div className="card">
          <h2>{translate('animation')}</h2>
          <div className="video-container">
            {specialReply ? (
              <div className="special-reply">
                <h2>{specialReply.text}</h2>
                <video width="600" height="350" controls autoPlay>
                  <source src={`http://localhost:8000/static/${specialReply.video}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <>
                <video
                  id="videoPlayer"
                  ref={videoPlayerRef}
                  width="600"
                  height="350"
                  preload="auto"
                />
                <button
                  onClick={playVideos}
                  disabled={isPlaying}
                  className={`play-button ${isPlaying ? "playing" : ""}`}
                >
                  {isPlaying ? translate('stop') : translate('play')}
                </button>
                {/* --- Keywords below video --- */}
                {words.length > 0 && (
                  <div className="keywords-section" style={{ marginTop: '1.2rem', textAlign: 'center' }}>
                    <h3 style={{ color: '#4e54c8', fontWeight: 600, fontSize: '1.1rem' }}>Keywords:</h3>
                    <div className="keywords-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                      {words.map((word, idx) => (
                        <span
                          key={idx}
                          className={`keyword-chip${idx === currentKeywordIdx && isPlaying ? ' highlighted pop' : ''}`}
                          style={{
                            display: 'inline-block',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            background: idx === currentKeywordIdx && isPlaying ? '#ffb300' : '#f3f6fa',
                            color: idx === currentKeywordIdx && isPlaying ? '#fff' : '#4e54c8',
                            fontWeight: idx === currentKeywordIdx && isPlaying ? 700 : 500,
                            fontSize: '1rem',
                            border: idx === currentKeywordIdx && isPlaying ? '1.5px solid #ffb300' : '1px solid #e0e0e0',
                            boxShadow: idx === currentKeywordIdx && isPlaying ? '0 2px 8px rgba(255,179,0,0.15)' : 'none',
                            transition: 'all 0.2s',
                            animation: idx === currentKeywordIdx && isPlaying ? 'popIn 0.4s' : 'none',
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                    {/* See Response button aligned below keywords */}
                    {!showResponse && (
                      <button
                        onClick={handleShowResponse}
                        className="see-response-btn"
                        style={{
                          marginTop: '2rem',
                          display: 'block',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          padding: '0.8rem 2rem',
                          background: 'linear-gradient(90deg, #4e54c8 0%, #8f94fb 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          boxShadow: '0 2px 8px rgba(78,84,200,0.08)',
                          cursor: 'pointer',
                          transition: 'background 0.3s',
                        }}
                      >
                        See Response
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="split right user-profile-split">
        <div className="card user-profile-card">
          <div className="user-profile-top">
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <h3>{user?.username || translate('welcome')}</h3>
              <p className="user-email">{user?.email || ''}</p>
            </div>
          </div>
          <div className="language-selector-container">
            <div className="language-selector">
              <FaGlobe className="globe-icon" />
              <select
                value={language || "en-US"}
                onChange={e => setLanguage(e.target.value)}
                className="language-dropdown"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="user-profile-bottom">
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> {translate('logout')}
            </button>
          </div>
        </div>
      </div>
      {showResponse && responseData && (
        <div className="response-section">
          <h2>Response: {responseData.reply_text}</h2>
          <video width="600" height="350" controls autoPlay>
            <source src={`http://localhost:8000/static/${responseData.reply_video}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default MainScreen;
