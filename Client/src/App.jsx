import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import SignIn from './components/Auth/SignIn'
import SignUp from './components/Auth/SignUp'
import MainScreen from './components/MainScreen'
import ResponsePage from './components/ResponsePage'

function App() {
  const [text, setText] = useState('')
  const [words, setWords] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      console.log('Checking token:', token)
      
      if (token) {
        try {
          console.log('Verifying token...')
          const API_URL = import.meta.env.VITE_API_URL;
          const response = await fetch(`${API_URL}/api/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          console.log('Token verification response:', data)
          
          if (data.user) {
            console.log('Token valid, user authenticated')
            console.log('User data from verification:', data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            setIsAuthenticated(true)
          } else {
            console.log('Token invalid, clearing storage')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('Token verification error:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setIsAuthenticated(false)
        }
      } else {
        console.log('No token found')
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    }

    verifyToken()
  }, [])

  useEffect(() => {
    // Get CSRF token from Django
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/api/get-csrf-token/`, {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(error => console.error('Error fetching CSRF token:', error))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API_URL}/api/animation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: `sen=${encodeURIComponent(text)}`,
      })
      const data = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(data, 'text/html')
      const wordElements = doc.querySelectorAll('#list li')
      const extractedWords = Array.from(wordElements).map(li => li.textContent)
      setWords(extractedWords)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleRecord = () => {
    const recognition = new window.webkitSpeechRecognition()
    recognition.lang = 'en-IN'

    recognition.onresult = (event) => {
      setText(event.results[0][0].transcript)
    }
    recognition.start()
  }

  const playVideos = () => {
    if (isPlaying) return

    setIsPlaying(true)
    const videoPlayer = document.getElementById('videoPlayer')
    const videoSources = words.map(word => {
      // Handle words with spaces and special characters
      const encodedWord = encodeURIComponent(word)
      const API_URL = import.meta.env.VITE_API_URL;
      return `${API_URL}/static/${encodedWord}.mp4`
    })
    let currentIndex = 0

    const playNextVideo = () => {
      if (currentIndex >= videoSources.length) {
        setIsPlaying(false)
        return
      }

      videoPlayer.src = videoSources[currentIndex]
      videoPlayer.onerror = (error) => {
        console.error('Error playing video:', error)
        currentIndex++
        playNextVideo()
      }
      videoPlayer.onended = () => {
        currentIndex++
        playNextVideo()
      }
      videoPlayer.play().catch(error => {
        console.error('Error playing video:', error)
        currentIndex++
        playNextVideo()
      })
    }

    playNextVideo()
  }

  const PrivateRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>
    }

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to signin')
      return <Navigate to="/signin" replace />
    }

    return children
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/signin" 
          element={
            isAuthenticated ? 
              <Navigate to="/main" replace /> : 
              <SignIn />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
              <Navigate to="/main" replace /> : 
              <SignUp />
          } 
        />
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <MainScreen />
            </PrivateRoute>
          }
        />
        <Route
          path="/response"
          element={
            <PrivateRoute>
              <ResponsePage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  )
}

export default App
