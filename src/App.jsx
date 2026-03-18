import React, { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./components/Auth";
import Marketplace from "./components/Marketplace";
import ListItem from "./components/ListItem";
import ItemDetail from "./components/ItemDetail";
import Profile from "./components/Profile";
import Social from "./components/Social";
import "./styles/App.css";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState("marketplace");
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <h1 onClick={() => setCurrentView("marketplace")}>
              <span className="logo-icon">♻</span>
              Karma Economy
            </h1>
          </div>

          <div className="nav-menu">
            <button
              className={currentView === "marketplace" ? "active" : ""}
              onClick={() => setCurrentView("marketplace")}
            >
              Marketplace
            </button>
            <button
              className={currentView === "social" ? "active" : ""}
              onClick={() => setCurrentView("social")}
            >
              Social
            </button>
            <button
              className={currentView === "profile" ? "active" : ""}
              onClick={() => setCurrentView("profile")}
            >
              Profile
            </button>
          </div>

          <div className="nav-actions">
            <button
              className={`btn-primary ${currentView === "list-item" ? "active" : ""}`}
              onClick={() => setCurrentView("list-item")}
            >
              List Item
            </button>
            <button className="btn-secondary" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === "marketplace" && <Marketplace onItemClick={setSelectedItem} />}
        {currentView === "social" && <Social />}
        {currentView === "profile" && <Profile />}
        {currentView === "list-item" && (
          <ListItem
            onBack={() => setCurrentView("marketplace")}
            onSuccess={() => setCurrentView("marketplace")}
          />
        )}
      </main>

      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaimed={() => {
            setSelectedItem(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
