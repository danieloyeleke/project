import React from "react";
import TrustBadge from "./TrustBadge";

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

export default function ItemCard({ item, onClick, canAfford }) {
  const imageUrl = item.imageUrl || item.image_url;
  const karmaValue = item.karmaValue ?? item.karma_value ?? 0;
  const ownerName =
    item.owner?.fullName || item.owner?.full_name || item.owner?.username || "Unknown owner";
  const trustLevel = getTrustLevel(item);

  return (
    <div className={`item-card ${!canAfford ? "locked" : ""}`} onClick={() => onClick(item)}>
      <div className="item-image">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} />
        ) : (
          <div className="no-image">📦</div>
        )}
        <span className="item-condition">{item.condition}</span>
        <div className="item-trust-badge">
          <TrustBadge level={trustLevel} />
        </div>
      </div>

      <div className="item-info">
        <h3 className="item-title">{item.title}</h3>
        <p className="item-category">{item.category}</p>

        <div className="item-owner">
          <span className="owner-name">{ownerName}</span>
        </div>

        <div className="item-footer">
          <div className={`item-karma ${!canAfford ? "insufficient" : ""}`}>✨ {karmaValue}</div>
          {!canAfford && <span className="karma-warning">Not enough karma</span>}
        </div>
      </div>
    </div>
  );
}
