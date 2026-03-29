import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
    const navigate = useNavigate();

    const handleGoogleSuccess = async (response) => {
        try {
            // 1. Send the Google Token to your Spring Boot Backend
            const res = await axios.post('http://localhost:8080/api/auth/google', {
                credential: response.credential 
            });

            // 2. Save the JWT (token) your Backend generated
            localStorage.setItem('token', res.data.token);
            
            console.log("Login Successful:", res.data);

            // 3. Redirect the user to the home or dashboard page
            navigate('/dashboard'); 
        } catch (error) {
            console.error("Backend Authentication Error:", error.response?.data || error.message);
            alert("Failed to authenticate with the server.");
        }
    };

    return (
        <div className="google-btn-container">
            <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => console.log('Google Login Failed')}
                useOneTap // Optional: shows a small popup for easier login
            />
        </div>
    );
};

export default GoogleLoginButton;