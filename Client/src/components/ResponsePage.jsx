import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import React from "react";

const ResponsePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { response } = location.state || {};
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch CSRF token on mount
  React.useEffect(() => {
    const fetchCsrf = async () => {
      try {
        const res = await fetch(`${API_URL}/api/get-csrf-token/`, {
          credentials: "include"
        });
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (e) {
        setCsrfToken("");
      }
    };
    fetchCsrf();
  }, []);

  // Play all videos in sequence for the response keywords
  const playVideos = async () => {
    if (isPlaying || isLoading) return;
    setIsLoading(true);

    try {
      // Fetch keywords from backend
      const res = await fetch(`${API_URL}/animation/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
        },
        credentials: "include",
        body: `sen=${encodeURIComponent(response)}`,
      });
      const htmlText = await res.text();
      console.log("Backend /animation/ response:", htmlText);
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const wordElements = doc.querySelectorAll("#list li");
      const extracted = Array.from(wordElements).map(li => li.textContent.trim());
      console.log("Extracted keywords:", extracted);
      setKeywords(extracted);
      setIsLoading(false);

      if (!extracted.length) return;
      setIsPlaying(true);
      let currentIndex = 0;

      const playNext = () => {
        if (currentIndex >= extracted.length) {
          setIsPlaying(false);
          return;
        }
        const encodedWord = encodeURIComponent(extracted[currentIndex]);
        const videoUrl = `${API_URL}/static/${encodedWord}.mp4`;
        console.log("Trying to play video:", videoUrl);
        videoRef.current.src = videoUrl;
        videoRef.current.onended = () => {
          currentIndex++;
          playNext();
        };
        videoRef.current.onerror = () => {
          console.error("Video error for:", videoUrl);
          currentIndex++;
          playNext();
        };
        videoRef.current.play().catch((err) => {
          console.error("Play error for:", videoUrl, err);
          currentIndex++;
          playNext();
        });
      };

      playNext();
    } catch (e) {
      setIsLoading(false);
      setIsPlaying(false);
      setKeywords([]);
      console.error("Error in playVideos:", e);
    }
  };

  if (!response) {
    return (
      <div className="card">
        <h2>No response to show.</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="response-results-page" style={{ minHeight: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a093b" }}>
      <div className="card" style={{ width: 600, padding: 32, margin: 0, boxShadow: "0 4px 32px #0002", borderRadius: 20 }}>
        <h2 style={{ textAlign: "center", color: "#b388ff" }}>Sign Language Results</h2>
        <div style={{ margin: "2rem 0", textAlign: "center" }}>
          <h3>Results:</h3>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{
              background: "#7c4dff",
              color: "#fff",
              padding: "0.5rem 2rem",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 24,
              boxShadow: "0 2px 12px #7c4dff44"
            }}>
              {response}
            </span>
          </div>
          {/* Show keywords as pills below the Results text */}
          {/* <div style={{ margin: "1rem 0", display: "flex", justifyContent: "center", gap: "1rem" }}>
            {isLoading ? (
              <span style={{ color: '#fff' }}>Loading keywords...</span>
            ) : (
              keywords.map((word, idx) => (
                <span
                  key={idx}
                  style={{
                    background: idx === 0 ? "linear-gradient(90deg, #ffb300, #ff9800)" : "#fff",
                    color: idx === 0 ? "#fff" : "#7c4dff",
                    borderRadius: 16,
                    padding: "0.3rem 1.2rem",
                    fontWeight: 600,
                    fontSize: "1rem",
                    boxShadow: "0 2px 8px #7c4dff33"
                  }}
                >
                  {word}
                </span>
              ))
            )}
          </div> */}
        </div>
        <div style={{ margin: "2rem 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3>SIGN LANGUAGE ANIMATION:</h3>
          <video ref={videoRef} width="400" height="300" controls style={{ borderRadius: 12, background: "#222" }} />
          <button
            onClick={playVideos}
            disabled={isPlaying || isLoading}
            style={{
              marginTop: 16,
              padding: "0.5rem 2rem",
              background: "linear-gradient(90deg, #7c4dff, #b388ff)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 18,
              cursor: isPlaying || isLoading ? "not-allowed" : "pointer"
            }}
          >
            {isPlaying ? "Playing..." : isLoading ? "Loading..." : "Play"}
          </button>
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            marginTop: 32,
            padding: "1rem",
            background: "linear-gradient(90deg, #7c4dff, #b388ff)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 18,
            cursor: "pointer"
          }}
        >
          Send another message
        </button>
      </div>
    </div>
  );
};

export default ResponsePage; 