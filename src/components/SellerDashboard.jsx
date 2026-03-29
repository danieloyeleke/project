import React, { useMemo } from "react";
import TrustBadge from "./TrustBadge";

const buildIdentitySet = (user) =>
  new Set(
    [
      user?.id,
      user?.userId,
      user?.user_id,
      user?.email,
      user?.username,
    ]
      .filter((v) => v != null && String(v).trim() !== "")
      .map((v) => String(v))
  );

const isMine = (alert, identitySet) =>
  [alert.sellerId, alert.sellerEmail]
    .filter((v) => v != null && String(v).trim() !== "")
    .some((v) => identitySet.has(String(v)));

export default function SellerDashboard({ alerts = [], user, onAck, onClear }) {
  const identitySet = useMemo(() => buildIdentitySet(user), [user]);
  const myAlerts = useMemo(
    () => alerts.filter((alert) => isMine(alert, identitySet)),
    [alerts, identitySet]
  );

  const pendingAlerts = myAlerts.filter((a) => a.status !== "acknowledged");

  return (
    <section className="seller-desk-page">
      <div className="seller-desk-shell">
        <div className="order-tracking-header">
          <div>
            <span className="detail-section-label">Seller Alert Center</span>
            <h2>Claims & Escrow Initiations</h2>
            <p>
              Real-time notifications when buyers lock karma on your listings. Everything stays
              in sync with escrow.
            </p>
          </div>
        </div>

        <div className="seller-alert-banner">
          <div>
            <strong>{pendingAlerts.length}</strong> open alerts
          </div>
          <div className="seller-alert-meta">
            <span className="pill pill-blue">Escrow locked</span>
            <span className="pill pill-green">Action needed</span>
          </div>
        </div>

        {myAlerts.length === 0 ? (
          <div className="empty-state">
            <p>No buyer has initiated a claim on your listings yet.</p>
          </div>
        ) : (
          <div className="seller-alert-grid">
            {myAlerts.map((alert) => (
              <div key={alert.id} className="checkout-card seller-alert-card">
                <div className="seller-alert-head">
                  <TrustBadge level="safe" />
                  <div>
                    <h4>{alert.itemTitle}</h4>
                    <p className="detail-meta-label">
                      Buyer: {alert.buyerName} • Delivery: {alert.deliveryMethod}
                    </p>
                  </div>
                  <span
                    className={`pill ${
                      alert.status === "acknowledged" ? "pill-green" : "pill-blue"
                    }`}
                  >
                    {alert.status === "acknowledged" ? "Acknowledged" : "Escrow Initiated"}
                  </span>
                </div>

                <div className="seller-alert-body">
                  <div>
                    <span className="detail-meta-label">Received</span>
                    <strong>
                      {new Date(alert.createdAt).toLocaleString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                  </div>
                  <p>
                    The buyer locked karma and selected <strong>{alert.deliveryMethod}</strong>.
                    Please prepare dispatch and upload a pre-shipment photo in the order tracker.
                  </p>
                </div>

                <div className="seller-alert-actions">
                  <button className="btn-primary" onClick={() => onAck?.(alert.id)}>
                    Mark as Acknowledged
                  </button>
                  <button className="btn-secondary" onClick={() => onClear?.(alert.id)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
