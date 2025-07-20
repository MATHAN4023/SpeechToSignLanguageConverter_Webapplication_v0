import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Attempting login...');
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Complete login response:', JSON.stringify(data, null, 2));

            if (response.ok) {
                console.log('Login successful, storing token and user data');
                if (data.token && data.user) {
                    console.log('User data before storing:', JSON.stringify(data.user, null, 2));
                    if (!data.user.username) {
                        console.error('Username missing in user data. Full user data:', JSON.stringify(data.user, null, 2));
                        setError('Server response missing username');
                        return;
                    }
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    console.log('Stored token:', data.token);
                    console.log('Stored user:', JSON.stringify(data.user, null, 2));
                    window.location.href = '/main';
                } else {
                    console.error('Invalid response format:', JSON.stringify(data, null, 2));
                    setError('Invalid server response');
                }
            } else {
                console.log('Login failed:', data.error);
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>Sign In</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button">Sign In</button>
                </form>
                <p className="auth-link">
                    Don't have an account? <a href="/signup">Sign Up</a>
                </p>
            </div>
        </div>
    );
};

export default SignIn; 