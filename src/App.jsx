import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import Auth from "./components/Auth";
import Marketplace from "./components/Marketplace";
import ListItem from "./components/ListItem";
import ItemDetail from "./components/ItemDetail";
import CheckoutEscrowConfirmation from "./components/CheckoutEscrowConfirmation";
import OrderStatusTracking from "./components/OrderStatusTracking";
import Profile from "./components/Profile";
import Social from "./components/Social";
import "./styles/App.css";

const getActiveOrderStorageKey = (user) =>
  `karma_active_order:${user?.id || user?.email || "guest"}`;

const readStoredOrder = (user) => {
  if (!user) return null;

  try {
    const rawValue = localStorage.getItem(getActiveOrderStorageKey(user));
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState("marketplace");
  const [selectedItem, setSelectedItem] = useState(null);
  const [checkoutState, setCheckoutState] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [marketplaceRefreshKey, setMarketplaceRefreshKey] = useState(0);

  const activeOrderStorageKey = useMemo(
    () => getActiveOrderStorageKey(user),
    [user]
  );

  useEffect(() => {
    localStorage.removeItem("karma_active_order");
  }, []);

  useEffect(() => {
    setActiveOrder(readStoredOrder(user));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (activeOrder) {
      localStorage.setItem(activeOrderStorageKey, JSON.stringify(activeOrder));
      return;
    }

    localStorage.removeItem(activeOrderStorageKey);
  }, [activeOrder, activeOrderStorageKey, user]);

  const openMarketplace = () => {
    setSelectedItem(null);
    setCheckoutState(null);
    setCurrentView("marketplace");
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    setCheckoutState(null);
    setCurrentView("item-detail");
  };

  const openCheckout = (draft) => {
    setCheckoutState(draft);
    setCurrentView("checkout");
  };

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
            <h1 onClick={openMarketplace}>
              <span className="logo-icon">♻</span>
              Karma Economy
            </h1>
          </div>

          <div className="nav-menu">
            <button
              className={currentView === "marketplace" ? "active" : ""}
              onClick={openMarketplace}
            >
              Marketplace
            </button>
            <button
              className={currentView === "social" ? "active" : ""}
              onClick={() => {
                setSelectedItem(null);
                setCheckoutState(null);
                setCurrentView("social");
              }}
            >
              Social
            </button>
            <button
              className={currentView === "profile" ? "active" : ""}
              onClick={() => {
                setSelectedItem(null);
                setCheckoutState(null);
                setCurrentView("profile");
              }}
            >
              Profile
            </button>
          </div>

          <div className="nav-actions">
            <button
              className={`btn-primary ${currentView === "list-item" ? "active" : ""}`}
              onClick={() => {
                setSelectedItem(null);
                setCheckoutState(null);
                setCurrentView("list-item");
              }}
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
        {currentView === "marketplace" && (
          <Marketplace
            onItemClick={openItemDetail}
            refreshKey={marketplaceRefreshKey}
          />
        )}
        {currentView === "item-detail" && selectedItem && (
          <ItemDetail
            item={selectedItem}
            onBack={openMarketplace}
            onStartCheckout={openCheckout}
          />
        )}
        {currentView === "checkout" && checkoutState?.item && (
          <CheckoutEscrowConfirmation
            item={checkoutState.item}
            deliveryMethod={checkoutState.deliveryMethod}
            onBack={() => setCurrentView("item-detail")}
            onConfirmed={(order) => {
              setActiveOrder(order);
              setMarketplaceRefreshKey((value) => value + 1);
              setCurrentView("order-tracking");
            }}
          />
        )}
        {currentView === "order-tracking" && activeOrder && (
          <OrderStatusTracking
            order={activeOrder}
            onBackToMarketplace={openMarketplace}
          />
        )}
        {currentView === "social" && <Social />}
        {currentView === "profile" && (
          <Profile
            activeOrder={activeOrder}
            onOpenOrderTracking={() => {
              if (activeOrder) {
                setCurrentView("order-tracking");
              }
            }}
          />
        )}
        {currentView === "list-item" && (
          <ListItem
            onBack={openMarketplace}
            onSuccess={() => {
              setMarketplaceRefreshKey((value) => value + 1);
              openMarketplace();
            }}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
