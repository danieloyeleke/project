import React, { useMemo } from "react";
import EscrowTimer from "./EscrowTimer";

export default function OrderStatusTracking({ order, onBackToMarketplace }) {
  const remainingSeconds = useMemo(() => {
    if (!order?.escrowReleaseAt) return 0;
    const releaseAt = new Date(order.escrowReleaseAt).getTime();
    return Math.max(0, Math.floor((releaseAt - Date.now()) / 1000));
  }, [order?.escrowReleaseAt]);

  if (!order) return null;

  return (
    <section className="order-tracking-page">
      <div className="order-tracking-shell">
        <div className="order-tracking-header">
          <div>
            <span className="detail-section-label">Buyer View</span>
            <h2>Order Status & Tracking</h2>
            <p>
              Your karma is locked in escrow while the seller prepares this order for
              shipment or handoff.
            </p>
          </div>

          <button className="back-btn" onClick={onBackToMarketplace}>
            Back to Marketplace
          </button>
        </div>

        <div className="order-tracking-layout">
          <div className="checkout-card">
            <span className="detail-section-label">Current Status</span>
            <div className="tracking-status-card">
              <strong>{order.status}</strong>
              <p>
                The order is confirmed and waiting for the seller to ship, deliver, or
                schedule the meetup.
              </p>
            </div>

            <div className="tracking-escrow-timer">
              <span className="detail-meta-label">Escrow Countdown</span>
              <EscrowTimer remainingSeconds={remainingSeconds} />
            </div>

            <div className="tracking-timeline">
              <div className="tracking-step active">
                <span className="tracking-dot"></span>
                <div>
                  <strong>Escrow Locked</strong>
                  <p>{order.lockedKarma} Karma moved into protected escrow.</p>
                </div>
              </div>
              <div className="tracking-step active">
                <span className="tracking-dot"></span>
                <div>
                  <strong>Awaiting Shipment</strong>
                  <p>The seller has not completed the next delivery step yet.</p>
                </div>
              </div>
              <div className="tracking-step">
                <span className="tracking-dot"></span>
                <div>
                  <strong>Delivery Confirmation</strong>
                  <p>You will confirm receipt before karma releases to the seller.</p>
                </div>
              </div>
            </div>
          </div>

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
                    <strong>{order.sellerName}</strong>
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
                    <span className="detail-meta-label">Available Balance</span>
                    <strong>{order.availableKarmaAfter}</strong>
                  </div>
                  <div className="tracking-detail-span">
                    <span className="detail-meta-label">Delivery Details</span>
                    <strong>{order.deliveryDetails}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
