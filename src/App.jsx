import GoogleLoginButton from './components/GoogleLoginButton';
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
import SellerDashboard from "./components/SellerDashboard";
import TransactionComplete from "./components/TransactionComplete";
import DisputeResolution from "./components/DisputeResolution";
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

const LoginPage = () => {
  return (
    <div className="login-container">
      <h1>Welcome Back</h1>
      {/* Your regular Email/Password form here */}
      <hr />
      <p>Or sign in with Google:</p>
      <GoogleLoginButton />
    </div>
  );
};

function AppContent() {
  const { user, loading, logout, refreshProfile } = useAuth();
  const [currentView, setCurrentView] = useState("marketplace");
  const [selectedItem, setSelectedItem] = useState(null);
  const [checkoutState, setCheckoutState] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [alertChannel, setAlertChannel] = useState(null);
  const [sellerAlerts, setSellerAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem("seller_alerts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
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

  useEffect(() => {
    try {
      localStorage.setItem("seller_alerts", JSON.stringify(sellerAlerts));
    } catch {
      // ignore storage failures
    }
  }, [sellerAlerts]);

  // Cross-tab realtime sync using BroadcastChannel (falls back to local state if unsupported)
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("seller_alerts_channel");
    setAlertChannel(channel);

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === "add-alert" && payload) {
        setSellerAlerts((prev) => [payload, ...prev]);
      }
      if (type === "update-alerts" && Array.isArray(payload)) {
        setSellerAlerts(payload);
      }
    };

    return () => channel.close();
  }, []);

  const syncAlerts = (updater) => {
    setSellerAlerts((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      alertChannel?.postMessage?.({ type: "update-alerts", payload: next });
      return next;
    });
  };

  const logSellerAlert = (draft) => {
    const sellerId =
      draft?.item?.owner?.id ||
      draft?.item?.ownerId ||
      draft?.item?.owner_id ||
      draft?.item?.ownerEmail ||
      draft?.item?.owner_email;

    if (!sellerId) return;

    const alert = {
      id: `${draft.item.id || draft.item._id || Date.now()}-${Date.now()}`,
      sellerId,
      itemTitle: draft.item.title,
      buyerName: user?.username || user?.fullName || user?.email || "Buyer",
      deliveryMethod: draft.deliveryMethod,
      createdAt: new Date().toISOString(),
      status: "initiated",
    };

    setSellerAlerts((prev) => [alert, ...prev]);
    alertChannel?.postMessage?.({ type: "add-alert", payload: alert });
  };

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
    logSellerAlert(draft);
    setCheckoutState(draft);
    setCurrentView("checkout");
  };

  const markOrderShipped = (trackingNumber, preShipmentPhoto) => {
    setActiveOrder((prev) =>
      prev
        ? {
            ...prev,
            status: "In_Transit",
            trackingNumber: trackingNumber || prev.trackingNumber || "Tracking pending",
            shippedAt: new Date().toISOString(),
            preShipmentPhoto: preShipmentPhoto || prev.preShipmentPhoto,
            escrowReleaseAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48-hour dispute window
          }
        : prev
    );
  };

  const markOrderReceived = () => {
    setActiveOrder((prev) =>
      prev
        ? {
            ...prev,
            status: "Completed / Closed_Loop_Complete",
            receivedAt: new Date().toISOString(),
            fundsReleasedAt: new Date().toISOString(),
          }
        : prev
    );
    refreshProfile?.(); // refresh balances/karma after release
    setCurrentView("transaction-complete");
  };

  const openOrderDispute = (reason) => {
    setActiveOrder((prev) =>
      prev
        ? {
            ...prev,
            status: "In Dispute",
            disputeReason: reason || "Issue reported by buyer",
            disputeOpenedAt: new Date().toISOString(),
          }
        : prev
    );
    setCurrentView("dispute");
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
              <img
                src="/karmaswap-logo.png"
                alt="Karmaswap logo"
                className="nav-logo"
              />
              Karmaswap Marketplace
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
              className={currentView === "seller" ? "active" : ""}
              onClick={() => {
                setSelectedItem(null);
                setCheckoutState(null);
                setCurrentView("seller");
              }}
            >
              Seller Desk
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
            onSellerMarkShipped={markOrderShipped}
            onBuyerConfirmReceipt={markOrderReceived}
            onBuyerOpenDispute={openOrderDispute}
          />
        )}
        {currentView === "transaction-complete" && activeOrder && (
          <TransactionComplete
            order={activeOrder}
            onBack={openMarketplace}
            onRate={(rating) =>
              setActiveOrder((prev) =>
                prev ? { ...prev, sellerRating: rating } : prev
              )
            }
          />
        )}
        {currentView === "dispute" && activeOrder && (
          <DisputeResolution
            order={activeOrder}
            onBack={openMarketplace}
            onSubmit={(payload) =>
              setActiveOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      disputeEvidence: payload,
                      status: "In Dispute",
                    }
                  : prev
              )
            }
          />
        )}
        {currentView === "social" && <Social />}
        {currentView === "seller" && (
          <SellerDashboard
            alerts={sellerAlerts}
            user={user}
            onAck={(id) =>
              syncAlerts((prev) =>
                prev.map((alert) =>
                  alert.id === id ? { ...alert, status: "acknowledged" } : alert
                )
              )
            }
            onClear={(id) => syncAlerts((prev) => prev.filter((alert) => alert.id !== id))}
          />
        )}
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
