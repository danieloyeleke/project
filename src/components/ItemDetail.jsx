import React, { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import TrustBadge from "./TrustBadge";

const DELIVERY_METHODS = [
  {
    value: "meetup",
    label: "Meetup",
    description: "Coordinate a safe handoff in person.",
  },
  {
    value: "delivery",
    label: "Local Delivery",
    description: "Arrange dropoff within your area.",
  },
  {
    value: "shipping",
    label: "Shipping",
    description: "Send it through a tracked carrier.",
  },
];

const getTrustLevel = (item) => {
  const escrowProtected = Boolean(item.escrowProtected ?? item.escrow_protected);
  const sellerVerified = Boolean(
    item.sellerVerified ?? item.seller_verified ?? item.owner?.verified
  );
  const karmaValue = item.karmaValue ?? item.karma_value ?? 0;

  if (escrowProtected && sellerVerified && karmaValue >= 100) return "elite";
  if (sellerVerified) return "trusted";
  if (escrowProtected) return "safe";
  return "unverified";
};

const getOwnerName = (item) =>
  item?.owner?.fullName ||
  item?.owner?.full_name ||
  item?.owner?.username ||
  item?.ownerName ||
  item?.owner_name ||
  item?.ownerUsername ||
  item?.owner_username ||
  item?.ownerEmail ||
  "Unknown owner";

export default function ItemDetail({ item, onBack, onStartCheckout }) {
  const { user, profile } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState("meetup");
  const [error, setError] = useState("");

  const trustLevel = useMemo(() => getTrustLevel(item), [item]);
  const ownerName = useMemo(() => getOwnerName(item), [item]);
  const karmaBalance = profile?.karma_balance ?? profile?.karmaBalance ?? user?.karma_balance ?? 0;
  const karmaValue = item?.karmaValue ?? item?.karma_value ?? 0;
  const isOwner = Boolean(user && (item?.ownerId === user.id || item?.owner_id === user.id));
  const canAfford = karmaBalance >= karmaValue;

  const handleStartCheckout = () => {
    if (isOwner) {
      setError("You cannot start escrow on your own listing.");
      return;
    }

    if (!canAfford) {
      setError(`You need ${karmaValue - karmaBalance} more karma to continue.`);
      return;
    }

    setError("");
    onStartCheckout?.({
      item,
      deliveryMethod,
    });
  };

  if (!item) return null;

  return (
    <section className="item-detail-page">
      <div className="item-detail-shell">
        <button className="back-btn detail-back-btn" onClick={onBack}>
          Back to Marketplace
        </button>

        <div className="item-detail-layout">
          <div className="item-detail-hero">
            <div className="item-detail-media">
              {item.imageUrl || item.image_url ? (
                <img
                  src={item.imageUrl || item.image_url}
                  alt={item.title}
                  className="detail-image"
                />
              ) : (
                <div className="detail-image detail-image-fallback">[No image]</div>
              )}
            </div>

            <div className="item-detail-copy">
              <div className="item-detail-heading">
                <TrustBadge level={trustLevel} />
                <h2>{item.title}</h2>
                <p className="item-detail-description">{item.description}</p>
              </div>

              <div className="item-detail-meta">
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Condition</span>
                  <strong>{item.condition || "Not specified"}</strong>
                </div>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Category</span>
                  <strong>{item.category || "Other"}</strong>
                </div>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Karma Cost</span>
                  <strong>{karmaValue}</strong>
                </div>
              </div>

              <div className="detail-owner-card">
                <span className="detail-section-label">Owner</span>
                <strong>{ownerName}</strong>
                <p>{item?.owner?.location || item?.ownerLocation || "Location not shared"}</p>
              </div>
            </div>
          </div>

          <aside className="detail-action-panel">
            <div className="detail-escrow-card">
              <span className="detail-section-label">Escrow</span>
              <h3>Protected claim flow</h3>
              <p>
                Review your delivery method now, then confirm the escrow lock on the next
                screen before the seller can proceed.
              </p>

              <div className="detail-balance-row">
                <span>Your Karma</span>
                <strong>{karmaBalance}</strong>
              </div>

              <div className="delivery-picker">
                {DELIVERY_METHODS.map((method) => (
                  <label key={method.value} className="delivery-option detail-delivery-option">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={method.value}
                      checked={deliveryMethod === method.value}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                    />
                    <span className="delivery-option-copy">
                      <span className="delivery-label">{method.label}</span>
                      <span className="delivery-description">{method.description}</span>
                    </span>
                  </label>
                ))}
              </div>

              {error && <div className="error-message">{error}</div>}

              {isOwner ? (
                <div className="owner-notice">This is your item listing.</div>
              ) : (
                <>
                  {!canAfford && (
                    <div className="error-message">
                      You need {karmaValue - karmaBalance} more karma to start escrow.
                    </div>
                  )}

                  <button
                    className="escrow-btn detail-escrow-btn"
                    onClick={handleStartCheckout}
                    disabled={!canAfford}
                  >
                    Review & Lock Karma
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
