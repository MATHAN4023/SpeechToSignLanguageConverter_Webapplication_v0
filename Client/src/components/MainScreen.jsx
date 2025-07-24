import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaSignOutAlt,
  FaGlobe,
  FaExchangeAlt,
  FaVolumeUp,
} from "react-icons/fa";
import "../App.css";
import "./MainScreen.css";
import "../i18n";
import { useLanguage } from "../context/LanguageContext";

// Add your supported languages here
const LANGUAGES = [
  { code: "en", label: "English", icon: "🇺🇸" },
  { code: "ta", label: "தமிழ் (Tamil)", icon: "🇮🇳" },
  { code: "hi", label: "हिंदी (Hindi)", icon: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", icon: "🇮🇳" },
  { code: "ml", label: "മലയാളം (Malayalam)", icon: "🇮🇳" },
];

const MainScreen = () => {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [words, setWords] = useState([]);
  const [videoSequence, setVideoSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [user, setUser] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [response, setResponse] = useState("");
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const { language, setLanguage, translate } = useLanguage();
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPlayResponse, setShowPlayResponse] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const GEMINI_API_KEY = "AIzaSyDK6GQyvB5xTcV9SP1-xPK4eTizov5IN7M"; // Get from https://makersuite.google.com/app/apikey
  const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent";
  const API_URL = import.meta.env.VITE_API_URL;

  // Set default language to English on component mount
  useEffect(() => {
    if (!language) {
      setLanguage("en");
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
            fetch(`${API_URL}/api/verify`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((response) => {
                console.log("Verify response status:", response.status);
                return response.json();
              })
              .then((data) => {
                console.log("Verify response data:", data);
                if (data.user) {
                  console.log("Setting user from server response:", data.user);
                  localStorage.setItem("user", JSON.stringify(data.user));
                  setUser(data.user);
                } else {
                  console.error("No user data in verify response");
                }
              })
              .catch((error) =>
                console.error("Error fetching user data:", error)
              );
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
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get-csrf-token/`, {
          credentials: "include",
        });
        const data = await response.json();
        console.log("CSRF token received:", data);
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure we have a CSRF token
      if (!csrfToken) {
        const tokenResponse = await fetch(`${API_URL}/api/get-csrf-token/`, {
          credentials: "include",
        });
        const tokenData = await tokenResponse.json();
        setCsrfToken(tokenData.csrfToken);
      }

      // If text is empty, clear words and return
      if (!text.trim()) {
        setWords([]);
        setVideoSequence([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/animation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: `sen=${encodeURIComponent(text)}`,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Animation request failed:", response.status, errorText);
        setWords([]);
        setVideoSequence([]);
        return;
      }

      // Parse the HTML response
      const htmlText = await response.text();
      console.log("Received HTML response:", htmlText); // Debug log

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const wordElements = doc.querySelectorAll("#list li");

      if (wordElements.length === 0) {
        console.error("No keywords found in response");
        setWords([]);
        setVideoSequence([]);
        return;
      }

      const extractedWords = Array.from(wordElements).map((li) =>
        li.textContent.trim()
      );
      console.log("Extracted words:", extractedWords); // Debug log

      // Update state with extracted words
      setWords(extractedWords);
      setVideoSequence(extractedWords);
    } catch (error) {
      console.error("Error:", error);
      setWords([]);
      setVideoSequence([]);
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
    const videoPlayer = document.getElementById("videoPlayer");
    const videoSources = videoSequence.map((item) => {
      const encoded = encodeURIComponent(item);
      return `${API_URL}/static/${encoded}.mp4`;
    });
    let currentIndex = 0;

    const playNextVideo = () => {
      if (currentIndex >= videoSources.length) {
        setIsPlaying(false);
        return;
      }
      videoPlayer.src = videoSources[currentIndex];
      videoPlayer.onerror = () => {
        currentIndex++;
        playNextVideo();
      };
      videoPlayer.onended = () => {
        currentIndex++;
        playNextVideo();
      };
      videoPlayer.play().catch(() => {
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

  const translateText = async (text, targetLang) => {
    console.log("Starting translation:", { text, targetLang });
    if (!text.trim()) return ""; // Return empty string if no text
    if (targetLang === "en") return text; // No translation needed for English

    try {
      // First, get the CSRF token if we don't have it
      if (!csrfToken) {
        console.log("Fetching CSRF token...");
        const tokenResponse = await fetch(`${API_URL}/api/get-csrf-token/`, {
          credentials: "include",
        });
        const tokenData = await tokenResponse.json();
        console.log("CSRF token received:", tokenData);
        setCsrfToken(tokenData.csrfToken);
      }

      const apiUrl = `${API_URL}/api/translate/`;
      console.log("Making translation request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          text: text,
          target_language: targetLang,
        }),
      });

      console.log("Translation response status:", response.status);
      const responseText = await response.text();
      console.log("Translation response text:", responseText);

      if (!response.ok) {
        let errorMessage = `Translation failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Error parsing response:", e);
        throw new Error("Invalid response from server");
      }

      if (!data.translated_text) {
        throw new Error("No translation received");
      }

      console.log("Translation successful:", data);
      return data.translated_text;
    } catch (error) {
      console.error("Translation error:", error);
      // Return original text if translation fails
      return text;
    }
  };

  const handleLanguageSelect = async (langCode) => {
    console.log("Language selected:", langCode);
    setSelectedLanguage(langCode);
    setShowLanguageDropdown(false);

    // Translate the current text
    if (text) {
      console.log("Translating text:", text);
      const translated = await translateText(text, langCode);
      console.log("Translated text:", translated);
      setTranslatedText(translated);
    }
  };

  // Update translation when text changes
  useEffect(() => {
    const updateTranslation = async () => {
      if (text && selectedLanguage !== "en") {
        console.log("Text changed, updating translation:", {
          text,
          selectedLanguage,
        });
        const translated = await translateText(text, selectedLanguage);
        console.log("Updated translation:", translated);
        setTranslatedText(translated);
      } else {
        setTranslatedText(text);
      }
    };

    updateTranslation();
  }, [text, selectedLanguage]);

  const speakText = (text) => {
    console.log("Attempting to speak text:", text);
    console.log("Selected language:", selectedLanguage);

    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      alert(
        "Text-to-speech is not supported in your browser. Please try a different browser."
      );
      return;
    }

    if (isSpeaking) {
      console.log("Stopping current speech");
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text) {
      console.log("No text to speak");
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      // List of supported languages for speech
      const supportedLanguages = ["en", "hi"];

      // If the selected language is not supported, use English
      if (!supportedLanguages.includes(selectedLanguage)) {
        console.log(
          `Language ${selectedLanguage} not supported for speech, using English`
        );
        utterance.lang = "en-US";
      } else {
        // For supported languages
        const languageMap = {
          en: "en-US",
          hi: "hi-IN",
        };
        utterance.lang = languageMap[selectedLanguage];
      }

      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices);

      // Find the appropriate voice
      let selectedVoice = voices.find(
        (voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase()
      );

      if (!selectedVoice) {
        // If no exact match, try to find a voice that includes the language code
        selectedVoice = voices.find((voice) =>
          voice.lang
            .toLowerCase()
            .includes(utterance.lang.toLowerCase().split("-")[0])
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(
          "Using voice:",
          selectedVoice.name,
          "with language:",
          selectedVoice.lang
        );
      } else {
        console.log("No suitable voice found");
        alert("No suitable voice found. Please try a different browser.");
        return;
      }

      // Set rate and pitch for better pronunciation
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1.0; // Normal pitch

      utterance.onstart = () => {
        console.log("Speech started");
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log("Speech ended");
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        setIsSpeaking(false);
        alert(
          "Error occurred while trying to speak the text. Please try again."
        );
      };

      window.speechSynthesis.speak(utterance);
      console.log("Speech synthesis started with language:", utterance.lang);
    } catch (error) {
      console.error("Error in speech synthesis:", error);
      alert(
        "Error occurred while trying to speak the text. Please try again or use a different browser."
      );
    }
  };

  // Add this useEffect to handle voice loading
  useEffect(() => {
    if (window.speechSynthesis) {
      // Load voices when they become available
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("All available voices:", voices);

        // Log supported language voices
        const supportedVoices = voices.filter(
          (voice) =>
            voice.lang.toLowerCase().includes("en") ||
            voice.lang.toLowerCase().includes("hi")
        );
        console.log("Available supported voices:", supportedVoices);
      };

      window.speechSynthesis.onvoiceschanged = loadVoices;

      // Initial load
      loadVoices();
    }
  }, []);

  const getTalkBackResponse = async (userInput) => {
    try {
      console.log("Sending request to Gemini API with input:", userInput);
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a friendly and empathetic sign language learning assistant. Respond naturally like a human friend, not a robot. 
              Keep responses short and engaging. Show personality and emotion. 
              When appropriate, mention that you can show how to sign something.
              Current user message: ${userInput}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error response:", errorText);
        throw new Error(`Gemini API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API response:", data);

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        console.error("Unexpected Gemini API response structure:", data);
        throw new Error("Invalid response structure from Gemini API");
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log("Extracted response text:", responseText);
      return responseText;
    } catch (error) {
      console.error("Error in getTalkBackResponse:", error);
      return null;
    }
  };

  const handleResponse = async () => {
    if (!text) {
      setResponse("Hi! What would you like to learn?");
      return;
    }

    setIsLoadingResponse(true);
    setShowPlayResponse(false);
    try {
      // Get the animation words
      if (!csrfToken) {
        const tokenResponse = await fetch(`${API_URL}/api/get-csrf-token/`, {
          credentials: "include",
        });
        const tokenData = await tokenResponse.json();
        setCsrfToken(tokenData.csrfToken);
      }

      const animationResponse = await fetch(
        `${API_URL}/api/animation/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": csrfToken,
          },
          credentials: "include",
          body: `sen=${encodeURIComponent(text)}`,
        }
      );

      if (!animationResponse.ok) {
        throw new Error(
          `Animation request failed: ${animationResponse.status}`
        );
      }

      const animationData = await animationResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(animationData, "text/html");
      const wordElements = doc.querySelectorAll("#list li");
      const extractedWords = Array.from(wordElements).map(
        (li) => li.textContent
      );

      // Improved response logic
      let responseText = "";
      const lowerText = text.toLowerCase().trim();
      // Only match greetings if the text is exactly a greeting (not if it just contains 'hi' etc.)
      const greetingPatterns = [
        /^hi[!. ]*$/i,
        /^hello[!. ]*$/i,
        /^hey[!. ]*$/i,
        /^hi there[!. ]*$/i,
        /^hello there[!. ]*$/i,
      ];
      const isGreeting = greetingPatterns.some((pattern) =>
        pattern.test(lowerText)
      );

      if (
        lowerText.includes("my name is") ||
        lowerText.includes("i am") ||
        lowerText.includes("i'm")
      ) {
        const nameMatch = text.match(/(?:my name is|i am|i'm)\s+([a-zA-Z]+)/i);
        if (nameMatch && nameMatch[1]) {
          responseText = `Hi ${nameMatch[1]}! Let me show you how to sign your name.`;
        }
      } else if (isGreeting) {
        responseText = "Hi there!";
      } else if (lowerText.includes("good morning")) {
        responseText = "Good morning, have a nice day!";
      } else if (lowerText.includes("good night")) {
        responseText = "Good night, sleep well!";
      } else if (lowerText.includes("good afternoon")) {
        responseText = "Good afternoon, have a nice day!";
      } else if (lowerText.includes("good evening")) {
        responseText = "Good evening, have a nice day!";
      } else if (lowerText.includes("how are you")) {
        responseText = "I'm good, thank you!";
      } else if (lowerText.includes("nice to meet you")) {
        responseText = "Nice to meet you too!";
      } else if (lowerText.includes("thank") || lowerText.includes("thanks")) {
        responseText = "You're welcome!";
      } else if (lowerText.includes("thank you very much")) {
        responseText = "You're very welcome!";
      } else if (
        lowerText.includes("goodbye") ||
        lowerText.includes("bye") ||
        lowerText.includes("see you later") ||
        lowerText.includes("talk to you later")
      ) {
        responseText = "Goodbye!";
      } else if (lowerText.includes("happy birthday")) {
        responseText = "Thank you!";
      } else if (lowerText.includes("what is your name")) {
        responseText = "I'm your sign language assistant!";
      } else if (
        lowerText.includes("who created you") ||
        lowerText.includes("who made you")
      ) {
        responseText = "I was created to help teach sign language!";
      } else if (lowerText.includes("how old are you")) {
        responseText = "I'm as old as the internet 😉";
      } else if (lowerText.includes("where are you from")) {
        responseText = "I'm from the world of technology!";
      } else if (lowerText.includes("can you help me")) {
        responseText = "Of course! I'm here to help you learn.";
      } else if (lowerText.includes("what can you do")) {
        responseText = "I can help you learn to sign common phrases!";
      } else if (lowerText.includes("i love you")) {
        responseText = "I love you too ❤️";
      } else if (
        lowerText.includes("tell me a joke") ||
        lowerText.includes("make me laugh")
      ) {
        responseText =
          "Why did the computer go to the doctor? Because it had a virus! 😄";
      } else if (lowerText.includes("another joke")) {
        responseText = "What do you call fake spaghetti? An impasta!";
      } else if (lowerText.includes("are you a robot")) {
        responseText = "Kind of! I'm a smart assistant.";
      } else if (lowerText.includes("do you speak english")) {
        responseText = "Yes, I understand and respond in English.";
      } else if (lowerText.includes("how do you sign")) {
        responseText = "Let me show you how to sign that.";
      } else if (lowerText.includes("teach me something")) {
        responseText = "Sure! Let's start with the alphabet.";
      } else if (lowerText.includes("i want to learn")) {
        responseText = "Great! Learning sign language is fun and useful.";
      } else if (lowerText.includes("i'm learning")) {
        responseText = "That's wonderful! Keep going!";
      } else if (lowerText.includes("what is sign language")) {
        responseText =
          "Sign language is a way of communicating using hand gestures and body language.";
      } else if (
        lowerText.includes("i'm sad") ||
        lowerText.includes("i am sad")
      ) {
        responseText =
          "I'm here for you. Want to learn something new to feel better?";
      } else if (
        lowerText.includes("i'm happy") ||
        lowerText.includes("i am happy")
      ) {
        responseText = "That's great to hear! 😊";
      } else if (lowerText.includes("i feel lonely")) {
        responseText = "You're not alone. I'm always here to chat!";
      } else if (lowerText.includes("i'm bored")) {
        responseText = "Let's learn something fun together!";
      } else if (lowerText.includes("i'm excited")) {
        responseText = "Yay! Let's keep that energy going!";
      } else if (lowerText.includes("i'm tired")) {
        responseText = "Take a short break. Then let's continue learning!";
      } else if (lowerText.includes("i'm hungry")) {
        responseText = "Go grab a snack, I'll be here!";
      } else if (lowerText.includes("do you like me")) {
        responseText = "Of course I do! 💙";
      } else if (lowerText.includes("can we be friends")) {
        responseText = "Absolutely! We're friends now 😊";
      } else if (lowerText.includes("sing a song")) {
        responseText = "🎵 La la la... I wish I had a good voice!";
      } else if (lowerText.includes("teach me the alphabet")) {
        responseText = "Sure! Let's start with A, B, C...";
      } else if (lowerText.includes("teach me numbers")) {
        responseText = "Okay! One, Two, Three... let's sign together.";
      } else if (lowerText.includes("show me how to sign hello")) {
        responseText = "Here's how you sign 'Hello' 👋";
      } else if (lowerText.includes("how do i sign love")) {
        responseText = "To sign 'Love', cross your arms over your chest.";
      } else if (lowerText.includes("i love coding")) {
        responseText = "That's awesome! Coding and signing go well together.";
      } else if (lowerText.includes("i'm a student")) {
        responseText = "Perfect time to pick up sign language!";
      } else if (lowerText.includes("i'm a teacher")) {
        responseText = "That's wonderful! Sharing knowledge is powerful.";
      } else if (lowerText.includes("what time is it")) {
        responseText = "Time to learn something new! 😉";
      } else if (lowerText.includes("what day is it")) {
        responseText = "Every day is a good day to sign!";
      } else if (lowerText.includes("i'm nervous")) {
        responseText = "It's okay to be nervous. Just take your time.";
      } else if (lowerText.includes("i'm scared")) {
        responseText = "You're brave for starting something new!";
      } else if (lowerText.includes("do you believe in god")) {
        responseText = "I respect all beliefs and I'm here to support you.";
      } else if (lowerText.includes("do you have emotions")) {
        responseText = "Not like humans, but I care about your journey!";
      } else if (lowerText.includes("what's up")) {
        responseText = "Just ready to teach you some signs!";
      } else if (lowerText.includes("long time no see")) {
        responseText = "I missed you! Ready to learn?";
      } else if (lowerText.includes("do you miss me")) {
        responseText = "Yes! I'm glad you're back!";
      } else if (lowerText.includes("have a nice day")) {
        responseText = "You too! 😊";
      } else if (lowerText.includes("merry christmas")) {
        responseText = "Merry Christmas to you too!";
      } else if (lowerText.includes("happy new year")) {
        responseText = "Happy New Year! 🎉";
      } else if (lowerText.includes("happy diwali")) {
        responseText = "Happy Diwali! 🪔";
      } else if (lowerText.includes("happy pongal")) {
        responseText = "Happy Pongal! 🌾";
      } else {
        // Use Gemini API for unmatched responses
        try {
          console.log("[Gemini API] Calling Gemini for:", text);
          const response = await fetch(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are a friendly sign language learning assistant. Respond naturally and informatively. If the user asks a factual question, answer it directly and clearly. If the user asks about sign language, explain and offer to show the sign. Current user message: ${text}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 100,
                },
              }),
            }
          );

          const rawData = await response.text();
          let data;
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            console.error("[Gemini API] Failed to parse JSON:", rawData);
            throw new Error("Invalid response from Gemini API");
          }
          console.log("[Gemini API] Full response:", data);

          if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0].text
          ) {
            responseText = data.candidates[0].content.parts[0].text.trim();
          } else if (data.promptFeedback && data.promptFeedback.blockReason) {
            responseText = `Sorry, Gemini could not answer: ${data.promptFeedback.blockReason}`;
          } else {
            responseText =
              "Sorry, I couldn't find an answer. Please try rephrasing your question.";
          }
        } catch (error) {
          console.error("[Gemini API] Error getting Gemini response:", error);
          responseText =
            "Sorry, there was a problem getting an answer. Please try again later.";
        }
      }

      setResponse(responseText);
      setWords(extractedWords);
      // Navigate to the new response page with state
      navigate("/response", {
        state: { response: responseText, words: extractedWords },
      });
    } catch (error) {
      console.error("Error in handleResponse:", error);
      setResponse("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const speakResponse = (text) => {
    if (isPlayingResponse) {
      window.speechSynthesis.cancel();
      setIsPlayingResponse(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingResponse(true);
    };

    utterance.onend = () => {
      setIsPlayingResponse(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsPlayingResponse(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayResponse = () => {
    if (response) {
      // First play the audio response
      speakResponse(response);

      // Then get the sign language video for the response
      const fetchResponseVideo = async () => {
        try {
          // Ensure we have a CSRF token
          if (!csrfToken) {
            const tokenResponse = await fetch(`${API_URL}/api/get-csrf-token/`, {
              credentials: "include",
            });
            const tokenData = await tokenResponse.json();
            setCsrfToken(tokenData.csrfToken);
          }

          // Get the animation words for the response
          const animationResponse = await fetch(
            `${API_URL}/api/animation/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-CSRFToken": csrfToken,
              },
              credentials: "include",
              body: `sen=${encodeURIComponent(response)}`,
            }
          );

          if (!animationResponse.ok) {
            throw new Error(
              `Animation request failed: ${animationResponse.status}`
            );
          }

          const animationData = await animationResponse.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(animationData, "text/html");
          const wordElements = doc.querySelectorAll("#list li");
          const extractedWords = Array.from(wordElements).map(
            (li) => li.textContent
          );

          // Set the words and play the videos
          setWords(extractedWords);
          playVideos();
        } catch (error) {
          console.error("Error fetching response video:", error);
        }
      };

      fetchResponseVideo();
    }
  };

  return (
    <div className="app">
      <div className="split left">
        <div className="card">
          <h2>{translate("signLanguage")}</h2>
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-group">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={translate("enterText")}
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
              {translate("convert")}
            </button>
          </form>

          {/* Translation Box */}
          <div className="translation-box">
            <div className="translation-header">
              <div className="language-selector">
                <span className="selected-language">
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.icon}
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.label}
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
                  {LANGUAGES.map((lang) => (
                    <div
                      key={lang.code}
                      className={`language-option ${
                        selectedLanguage === lang.code ? "selected" : ""
                      }`}
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
                <div className="translated-text-container">
                  <p className="text">
                    {translatedText || "Enter text to translate..."}
                  </p>
                  {translatedText && (
                    <button
                      className={`speak-button ${isSpeaking ? "speaking" : ""}`}
                      onClick={() => speakText(translatedText)}
                      title={isSpeaking ? "Stop speaking" : "Speak text"}
                    >
                      <FaVolumeUp />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="results">
            <h3>{translate("results")}</h3>
            <div className="text-display">
              <p className="label">{translate("textEntered")}:</p>
              <p className="value">{text}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="split right">
        <div className="card">
          <h2>{translate("animation")}</h2>
          <div className="video-container">
            <video id="videoPlayer" width="600" height="350" preload="auto" />
            <div className="button-container">
              <button
                onClick={playVideos}
                disabled={isPlaying}
                className={`play-button ${isPlaying ? "playing" : ""}`}
              >
                {isPlaying ? translate("stop") : translate("play")}
              </button>
              <button
                onClick={handleResponse}
                disabled={isLoadingResponse}
                className={`play-button ${isLoadingResponse ? "loading" : ""}`}
              >
                {isLoadingResponse ? "Processing..." : "Response"}
              </button>
            </div>
          </div>
          <br /><br />
          <div className="keywords">
            <p className="label">{translate("keyWords")}:</p>
            <ul>
              {words.map((word, index) => (
                <li key={index}>{word}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="split right user-profile-split">
        <div className="card user-profile-card">
          <div className="user-profile-top">
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="user-details">
              <h3>{user?.username || translate("welcome")}</h3>
              <p className="user-email">{user?.email || ""}</p>
            </div>
          </div>
          <div className="language-selector-container">
            <div className="language-selector">
              <FaGlobe className="globe-icon" />
              <select
                value={language || "en"}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-dropdown"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="user-profile-bottom">
            <button onClick={handleLogout} className="logout-button">
              <FaSignOutAlt /> {translate("logout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
