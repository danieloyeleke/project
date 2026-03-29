import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, requestPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedUsername = username.trim();
    const trimmedFullName = fullName.trim();
    const trimmedLocation = location.trim();

    try {
      if (isLogin) {
        const result = await signIn(trimmedEmail, trimmedPassword);
        if (!result?.success) {
          setError(result?.error || "Login failed");
        }
      } else {
        if (
          !trimmedUsername ||
          !trimmedFullName ||
          !trimmedLocation ||
          !trimmedEmail ||
          !trimmedPassword
        ) {
          throw new Error("Please fill in all fields");
        }
        if (trimmedPassword.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (trimmedPassword !== trimmedConfirmPassword) {
          throw new Error("Passwords do not match");
        }
        const result = await signUp(
          trimmedEmail,
          trimmedPassword,
          trimmedUsername,
          trimmedFullName,
          trimmedLocation
        );
        if (!result?.success) {
          setError(result?.error || "Registration failed");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Enter your email to receive a reset link");
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(trimmedEmail);
      if (result?.success) {
        setMessage("Password reset link sent. Check your inbox.");
      } else {
        setError(result?.error || "Unable to send reset email");
      }
    } catch (err) {
      setError(err.message || "Unable to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        throw new Error("Missing Google credential");
      }

      const result = await signInWithGoogle(credential);
      if (!result?.success) {
        setError(result?.error || "Google authentication failed");
      }
    } catch (err) {
      setError(err?.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <img
            src="/karmaswap-logo.png"
            alt="Karmaswap logo"
            className="auth-logo"
          />
          <h1>Karmaswap</h1>
          <p>Trade items, earn karma, build community</p>
        </div>

        <div className="auth-tabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required={!isLogin}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {isLogin && (
            <div className="helper-row">
              <button
                type="button"
                className="link-btn"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
          </button>

          {!isLogin && (
            <>
              <div className="auth-divider">
                <span />
                <p>or</p>
                <span />
              </div>
              <div className="google-btn-container">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in was cancelled.")}
                  useOneTap
                />
              </div>
            </>
          )}
        </form>

        {!isLogin && (
          <div className="signup-bonus">
            New members start with 25 karma points!
          </div>
        )}
      </div>
    </div>
  );
}
