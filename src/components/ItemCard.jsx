import React from "react";

export default function ItemCard({ item, onClick, canAfford }) {
  const imageUrl = item.imageUrl || item.image_url;
  const karmaValue =
    item.karmaValue != null ? item.karmaValue : item.karma_value;

  return (
    <div
      className={`item-card ${!canAfford ? "locked" : ""}`}
      onClick={() => onClick(item)}
    >
      <div className="item-image-wrapper">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} className="item-image" />
        ) : (
          <div className="no-image">??</div>
        )}

        <span className="item-condition">{item.condition}</span>
      </div>

      <div className="item-content">
        <h3 className="item-title">{item.title}</h3>
        <p className="item-category">{item.category}</p>

        {item.owner && (
          <div className="item-owner">
            <span className="owner-name">{item.owner.fullName}</span>
          </div>
        )}

        <div className="item-footer">
          <div className={`karma-badge ${!canAfford ? "insufficient" : ""}`}>
            ? {karmaValue}
          </div>

          {!canAfford && <span className="karma-warning">Not enough karma</span>}
        </div>
      </div>
    </div>
  );
}
