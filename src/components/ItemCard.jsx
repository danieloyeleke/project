import React from 'react';

export default function ItemCard({ item, onClick, canAfford }) {
  return (
    <div className="item-card" onClick={onClick}>
      <div className="item-image">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} />
        ) : (
          <div className="no-image">📦</div>
        )}
        <div className="item-condition">{item.condition}</div>
      </div>

      <div className="item-info">
        <h3 className="item-title">{item.title}</h3>
        <p className="item-category">{item.category}</p>

        {item.owner && (
          <div className="item-owner">
            <span className="owner-name">{item.owner.username}</span>
            {item.owner.location && (
              <span className="owner-location"> • {item.owner.location}</span>
            )}
          </div>
        )}

        <div className="item-footer">
          <div className={`item-karma ${!canAfford ? 'insufficient' : ''}`}>
            <span className="karma-icon">✨</span>
            <span className="karma-amount">{item.karma_value}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
