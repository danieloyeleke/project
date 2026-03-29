import React, { useEffect, useMemo, useState } from "react";
import EscrowTimer from "./EscrowTimer";
import OrderChat from "./OrderChat";
import { useAuth } from "../contexts/AuthContext";

const STATUS_FLOW = [
  { key: "Payment_Secured_Escrow", label: "Payment Secured in Escrow", color: "blue" },
  { key: "Awaiting_Dispatch", label: "Awaiting Dispatch", color: "green" },
  { key: "In_Transit", label: "In Transit", color: "green" },
  { key: "Received_Pending_Review", label: "Received / Pending Review", color: "green" },
  { key: "Funds_Released", label: "Funds Released", color: "blue" },
  { key: "Closed_Loop_Complete", label: "Closed Loop Complete", color: "gold" },
];

const getStatusIndex = (status) => {
  if (!status) return 0;
  const idx = STATUS_FLOW.findIndex((s) =>
    String(status).toLowerCase().includes(s.key.toLowerCase())
  );
  return idx === -1 ? 0 : idx;
};

export default function OrderStatusTracking({
  order,
  onBackToMarketplace,
  onSellerMarkShipped,
  onBuyerConfirmReceipt,
  onBuyerOpenDispute,
}) {
  const [trackingInput, setTrackingInput] = useState(order?.trackingNumber || "");
  const [issueNotes, setIssueNotes] = useState("");
  const [dispatchPhoto, setDispatchPhoto] = useState(null);
  const [dispatchPhotoPreview, setDispatchPhotoPreview] = useState(order?.preShipmentPhoto || "");
  const { user } = useAuth();

  const remainingSeconds = useMemo(() => {
    if (!order?.escrowReleaseAt) return 0;
    const releaseAt = new Date(order.escrowReleaseAt).getTime();
    return Math.max(0, Math.floor((releaseAt - Date.now()) / 1000));
  }, [order?.escrowReleaseAt]);

  const statusIndex = getStatusIndex(order?.status);
  const buyerName = order?.buyerName || "Buyer";
  const sellerName = order?.sellerName || "Seller";
  const sellerId =
    order?.sellerId ||
    order?.seller_id ||
    order?.item?.ownerId ||
    order?.item?.owner_id ||
    order?.item?.owner?.id;
  const buyerId =
    order?.buyerId ||
    order?.buyer_id ||
    order?.buyer?.id ||
    order?.userId ||
    order?.user_id;
  const isSeller = sellerId && user?.id ? String(user.id) === String(sellerId) : false;
  const currentUserRole = isSeller ? "seller" : "buyer";
  const currentUserName =
    user?.username || user?.fullName || user?.email || (isSeller ? sellerName : buyerName);
  const orderId = order?.id || order?._id || order?.orderId || "order";
  const itemId =
    order?.item?.id ||
    order?.item?._id ||
    order?.itemId ||
    order?.item_id ||
    order?.item?.externalId;

  const carbonSaved = order?.carbonSavedKg ?? Math.max(1, Math.round((order?.lockedKarma || 10) * 0.4));
  const pendingKarma = order?.lockedKarma ?? 0;

  useEffect(() => {
    setTrackingInput(order?.trackingNumber || "");
    if (order?.preShipmentPhoto) {
      setDispatchPhotoPreview(order.preShipmentPhoto);
    }
  }, [order?.trackingNumber, order?.preShipmentPhoto]);

  useEffect(() => {
    if (!dispatchPhoto) return;
    const objectUrl = URL.createObjectURL(dispatchPhoto);
    setDispatchPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [dispatchPhoto]);

  if (!order) return null;

  const statusLabel = STATUS_FLOW[statusIndex]?.label || "Payment Secured in Escrow";
  const isComplete = statusIndex >= getStatusIndex("Closed_Loop_Complete");
  const isDispute = /dispute/i.test(order.status || "");

  const canSellerDispatch = statusIndex <= getStatusIndex("Awaiting_Dispatch") && !isComplete && !isDispute;
  const canBuyerConfirm = statusIndex >= getStatusIndex("In_Transit") && !isComplete && !isDispute;

  const handleDispatch = () => {
    if (!dispatchPhoto && !dispatchPhotoPreview) {
      alert("Upload a pre-shipment photo before dispatching.");
      return;
    }
    onSellerMarkShipped?.(
      trackingInput.trim(),
      dispatchPhotoPreview || order?.preShipmentPhoto
    );
  };

  const handleBuyerConfirm = () => {
    onBuyerConfirmReceipt?.();
  };

  return (
    <section className="order-tracking-page">
      <div className="order-tracking-shell">
        <div className="order-tracking-header">
          <div>
            <span className="detail-section-label">Active Escrow</span>
            <h2>Dual-Perspective Order & Escrow Dashboard</h2>
            <p>A single source of truth synced for buyer and seller.</p>
          </div>

          <button className="back-btn" onClick={onBackToMarketplace}>
            Back to Marketplace
          </button>
        </div>

        <div className="dual-progress">
          {STATUS_FLOW.map((step, idx) => {
            const isActive = idx <= statusIndex;
            const colorClass = `progress-${step.color}`;
            return (
              <div
                key={step.key}
                className={`dual-progress-step ${isActive ? "active" : ""} ${colorClass}`}
              >
                <div className="dual-progress-dot" />
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="order-tracking-layout dual-panels">
          <div className="checkout-card dual-card buyer-card">
            <div className="dual-card-header">
              <span className="pill pill-blue">Buyer / Borrower</span>
              <span className="pill pill-green">Safe-Hold Escrow</span>
            </div>

            <div className="safe-hold">
              <div className="safe-hold-ring">🔒</div>
              <div>
                <h3>Funds Held Safely</h3>
                <p>{order.lockedKarma} Karma locked in escrow — not with the seller.</p>
              </div>
            </div>

            <div className="tracking-bar">
              <div className="tracking-bar-label">Logistics</div>
              <div className="tracking-bar-rail">
                <div
                  className="tracking-bar-fill"
                  style={{
                    width: `${(statusIndex / (STATUS_FLOW.length - 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="tracking-meta">
                <span className="pill pill-green">
                  {order.trackingNumber ? "In motion" : "Awaiting dispatch"}
                </span>
                <span className="pill pill-blue">Auto release in <EscrowTimer remainingSeconds={remainingSeconds} /></span>
              </div>
            </div>

            <div className="comparison-block">
              <div>
                <span className="detail-meta-label">Pre-shipment Photo</span>
                {dispatchPhotoPreview ? (
                  <img src={dispatchPhotoPreview} alt="Pre-shipment" className="evidence-photo" />
                ) : (
                  <div className="evidence-photo placeholder">Pending upload by seller</div>
                )}
              </div>
              <div className="carbon-meter">
                <div className="carbon-circle">
                  <span>{carbonSaved} kg</span>
                </div>
                <p>Carbon saved by reusing this item.</p>
              </div>
            </div>

            <div className="tracking-actions">
              <button
                className="btn-primary"
                disabled={!canBuyerConfirm}
                onClick={handleBuyerConfirm}
              >
                Confirm Receipt & Condition
              </button>
              <p className="action-warning">
                Confirming releases funds from escrow. If you do nothing, escrow auto-releases after 48 hours.
              </p>
              <button
                className="btn-secondary"
                disabled={isComplete || isDispute}
                onClick={() => onBuyerOpenDispute?.(issueNotes)}
              >
                Raise a Dispute
              </button>
              {!isComplete && !isDispute && (
                <textarea
                  className="checkout-textarea"
                  rows="2"
                  placeholder="Describe the issue (optional)"
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="checkout-card dual-card seller-card">
            <div className="dual-card-header">
              <span className="pill pill-blue">Seller / Lender</span>
              <span className="pill pill-gold">Payment Guaranteed</span>
            </div>

            <div className="guarantee-block">
              <div className="safe-hold-ring gold">✅</div>
              <div>
                <h3>Payment Guaranteed</h3>
                <p>{pendingKarma} Karma reserved in escrow. Release on buyer approval or auto after 48h.</p>
              </div>
            </div>

            <div className="logistics-block">
              <span className="detail-meta-label">Logistics Instructions</span>
              <p>{order.deliveryDetails || "Drop off at agreed hub or ship with provided label."}</p>

              <label className="checkout-label" htmlFor="trackingNumber">
                Tracking number (optional)
              </label>
              <input
                id="trackingNumber"
                className="checkout-input"
                placeholder="Add tracking or delivery confirmation"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
              />

              <label className="checkout-label" htmlFor="dispatchPhoto">
                Pre-shipment photo (required)
              </label>
              <input
                id="dispatchPhoto"
                type="file"
                accept="image/*"
                className="checkout-input"
                onChange={(e) => setDispatchPhoto(e.target.files?.[0] || null)}
              />
              {dispatchPhotoPreview && (
                <img src={dispatchPhotoPreview} alt="Pre-shipment preview" className="evidence-photo" />
              )}
            </div>

            <div className="tracking-actions">
              <button
                className="btn-primary"
                disabled={!canSellerDispatch}
                onClick={handleDispatch}
              >
                Mark as Dispatched
              </button>
              {order.shippedAt && (
                <p className="detail-meta-label">
                  Marked dispatched on {new Date(order.shippedAt).toLocaleString()}
                </p>
              )}
              <div className="karma-chip">
                Pending Karma Points to unlock: <strong>{pendingKarma}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="order-tracking-layout summary-block">
          <div className="checkout-card">
            <span className="detail-section-label">Order Summary</span>
            <div className="checkout-summary compact">
              {order.item?.imageUrl || order.item?.image_url ? (
                <img
                  src={order.item?.imageUrl || order.item?.image_url}
                  alt={order.item?.title}
                  className="checkout-summary-image"
                />
              ) : (
                <div className="checkout-summary-image checkout-summary-fallback">[No image]</div>
              )}

              <div className="checkout-summary-copy">
                <h3>{order.item?.title}</h3>
                <div className="checkout-summary-grid">
                  <div>
                    <span className="detail-meta-label">Seller</span>
                    <strong>{sellerName}</strong>
                  </div>
                  <div>
                    <span className="detail-meta-label">Buyer</span>
                    <strong>{buyerName}</strong>
                  </div>
                  <div>
                    <span className="detail-meta-label">Delivery Method</span>
                    <strong>{order.deliveryMethod}</strong>
                  </div>
                  <div>
                    <span className="detail-meta-label">Locked Karma</span>
                    <strong>{order.lockedKarma}</strong>
                  </div>
                  <div>
                    <span className="detail-meta-label">Current Status</span>
                    <strong>{statusLabel}</strong>
                  </div>
                  <div className="tracking-detail-span">
                    <span className="detail-meta-label">Delivery Details</span>
                    <strong>{order.deliveryDetails}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="checkout-card">
            <span className="detail-section-label">48-Hour Rule</span>
            <div className="tracking-status-card">
              <strong>Dispute Period Countdown</strong>
              <p>
                If the buyer does not confirm receipt within 48 hours of dispatch, escrow releases automatically to the seller unless a dispute is opened.
              </p>
              <div className="tracking-escrow-timer">
                <EscrowTimer remainingSeconds={remainingSeconds} />
              </div>
            </div>
          </div>
        </div>

        <div className="order-tracking-layout">
          <div className="checkout-card" style={{ width: "100%" }}>
            <OrderChat
              orderId={orderId}
              itemId={itemId}
              buyerId={buyerId}
              sellerId={sellerId}
              buyerName={buyerName}
              sellerName={sellerName}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
