import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Marketplace from './components/Marketplace';
import ListItem from './components/ListItem';
import ItemDetail from './components/ItemDetail';
import Profile from './components/Profile';
import Social from './components/Social';
import './styles/App.css';

function AppContent() {
  const { user, profile, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('marketplace');
  const [showListModal, setShowListModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <h1 onClick={() => setCurrentView('marketplace')}>
              <span className="logo-icon">♻️</span>
              Karma Economy
            </h1>
          </div>

          <div className="nav-menu">
            <button
              className={currentView === 'marketplace' ? 'active' : ''}
              onClick={() => setCurrentView('marketplace')}
            >
              Marketplace
            </button>
            <button
              className={currentView === 'social' ? 'active' : ''}
              onClick={() => setCurrentView('social')}
            >
              Social
            </button>
            <button
              className={currentView === 'profile' ? 'active' : ''}
              onClick={() => setCurrentView('profile')}
            >
              Profile
            </button>
          </div>

          <div className="nav-actions">
            {profile && (
              <div className="karma-display">
                <span className="karma-icon">✨</span>
                <span className="karma-amount">{profile.karma_balance}</span>
              </div>
            )}
            <button className="btn-primary" onClick={() => setShowListModal(true)}>
              List Item
            </button>
                      {user && (
                        <button
                          className="btn-secondary"
                              onClick={logout}>
                            Logout
                        </button>
                  )}

            {/* <button className="btn-secondary" onClick={signOut}>
              Logout
            </button> */}
          </div>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'marketplace' && (
          <Marketplace onItemClick={setSelectedItem} />
        )}
        {currentView === 'social' && <Social />}
        {currentView === 'profile' && <Profile />}
      </main>

      {showListModal && (
        <ListItem
          onClose={() => setShowListModal(false)}
          onSuccess={() => {
            setShowListModal(false);
            if (currentView === 'marketplace') {
              window.location.reload();
            }
          }}
        />
      )}

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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
