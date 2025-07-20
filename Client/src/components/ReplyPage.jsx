import React, { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './ReplyPage.css'; // We'll create this CSS file next

const HIGHLIGHT_COLOR = '#ffb300'; // Amber for highlight

const ReplyPage = () => {
  const location = useLocation();
  const { originalMessage, translatedMessage, signAsset, keywords = [], selectedLanguage, replyText } = location.state || {};
  const { translate } = useLanguage();
  const [currentKeywordIdx, setCurrentKeywordIdx] = useState(0);
  const videoRef = useRef(null);

  // Support for multiple keywords/videos (if signAsset is an array)
  const isMultiVideo = Array.isArray(signAsset);
  const videoList = isMultiVideo ? signAsset : [signAsset];

  console.log("[ReplyPage] Received state:", location.state);
  console.log("[ReplyPage] Original Message:", originalMessage);
  console.log("[ReplyPage] Translated Message:", translatedMessage);
  console.log("[ReplyPage] Sign Asset raw:", signAsset);

  // Assuming Django's STATIC_URL is '/static/' and assets are in the 'avatar' directory
  // served at the root of STATIC_URL as configured in Server/A2SL/urls.py.
  const DJANGO_BASE = "http://localhost:8000";
  const getSignAssetPath = (asset) =>
    asset
      ? `${DJANGO_BASE}/static/${asset
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`
      : null;
  console.log("[ReplyPage] Constructed Sign Asset Path:", getSignAssetPath(videoList[currentKeywordIdx]));

  const handleVideoEnded = () => {
    if (currentKeywordIdx < videoList.length - 1) {
      setCurrentKeywordIdx(currentKeywordIdx + 1);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.load();
        if (videoRef.current) videoRef.current.play();
      }, 100);
    }
  };

  if (!originalMessage || !signAsset) {
    // Handle cases where state is not passed correctly or is missing
    return (
      <div className="reply-page-container error-page">
        <h2>Oops! Something went wrong.</h2>
        <p>We couldn't display the sign language reply. Please try again.</p>
        <Link to="/main" className="back-link">Go back to Main Page</Link>
      </div>
    );
  }

  return (
    <div className="reply-page-container modern-bg">
      <div className="reply-card">
        <header className="reply-header">
          <h1>{translate('signLanguage')} {translate('results')}</h1>
        </header>
        <div className="reply-content">
          {/* Reply Text Section */}
          <div className="reply-text-box">
            <p className="reply-label">{translate('results')}:</p>
            <div className="reply-text-value">
              {replyText || (translatedMessage && translatedMessage !== originalMessage ? translatedMessage : originalMessage)}
            </div>
          </div>

          {/* Sign Animation Section */}
          <div className="sign-display">
            <p className="label">{translate('signLanguage')} {translate('animation')}:</p>
            {videoList[currentKeywordIdx] && videoList[currentKeywordIdx].endsWith('.mp4') ? (
              <video
                ref={videoRef}
                controls
                width="500"
                className="sign-video"
                onEnded={handleVideoEnded}
                autoPlay
              >
                <source src={getSignAssetPath(videoList[currentKeywordIdx])} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={getSignAssetPath(videoList[currentKeywordIdx])}
                alt={`Sign for ${originalMessage}`}
                className="sign-image"
              />
            )}
          </div>

          {/* Keywords Section - always below animation */}
          {keywords.length > 0 && (
            <div className="keywords-section" style={{ marginTop: '2rem' }}>
              <h3>{translate('keyWords')}:</h3>
              <div className="keywords-list pop-style">
                {keywords.map((word, idx) => (
                  <span
                    key={idx}
                    className={`keyword-chip pop-chip${idx === currentKeywordIdx ? ' highlighted pop' : ''}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Page Style Button */}
          <Link to="/main" className="main-gradient-btn back-link">{translate('sendAnotherMessage')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ReplyPage; 