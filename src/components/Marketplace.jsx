import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ItemCard from "./ItemCard";
import { claimItem, getItems } from "../api/items";

const API_ORIGIN = "http://localhost:8080";

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
};

const normalizeItem = (item) => ({
  ...item,
  imageUrl: normalizeImageUrl(item.imageUrl || item.image_url),
  karmaValue: item.karmaValue != null ? item.karmaValue : item.karma_value,
  escrowId: item.escrowId ?? item.escrow_id,
});

const getOwnerName = (item) =>
  item?.owner?.fullName ||
  item?.owner?.full_name ||
  item?.owner?.username ||
  item?.ownerName ||
  item?.owner_name ||
  item?.ownerUsername ||
  item?.owner_username ||
  "";

export default function Marketplace({ onItemClick }) {
  const { profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [escrowItem, setEscrowItem] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("meetup");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState("");

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getItems(filter);
      const list = Array.isArray(res) ? res : res?.data || [];
      const availableItems = list
        .map(normalizeItem)
        .filter((item) => String(item.status || "").toUpperCase() === "AVAILABLE");
      setItems(availableItems);
    } catch (e) {
      console.error("Failed to fetch items", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const searchedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  );

  const filteredItems =
    filter === "all"
      ? searchedItems
      : searchedItems.filter((item) => item.category === filter);

  const categories = [
    "all",
    "Clothing",
    "Books",
    "Electronics",
    "Home & Kitchen",
    "Sports & Outdoors",
    "Other",
  ];

  const closePreviewModal = () => setSelectedItem(null);

  const closeEscrowModal = () => {
    setEscrowItem(null);
    setDeliveryMethod("meetup");
    setClaimError("");
  };

  const handleEscrowStart = (item) => {
    setSelectedItem(null);
    setEscrowItem(item);
    setDeliveryMethod("meetup");
    setClaimError("");
  };

  const handleCardClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
      return;
    }
    setSelectedItem(item);
  };

  const handleConfirmClaim = async () => {
    if (!escrowItem) return;

    setClaimLoading(true);
    setClaimError("");
    try {
      await claimItem(escrowItem.id, deliveryMethod);
      closeEscrowModal();
      await fetchItems();
    } catch (err) {
      console.error(err);
      setClaimError(err.response?.data?.message || "Failed to claim item");
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat === "all" ? "All Items" : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>No available items</p>
          <p className="empty-hint">Be the first to list something!</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
              canAfford={profile?.karma_balance >= item.karmaValue}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={closePreviewModal}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closePreviewModal}>
              x
            </button>

            <div className="preview-body">
              <div className="preview-image-section">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="preview-image"
                  />
                ) : (
                  <div className="no-image preview-image">[No image]</div>
                )}
              </div>

              <div className="preview-info">
                <h2 className="preview-title">{selectedItem.title}</h2>
                <p className="preview-description">{selectedItem.description}</p>

                <div className="preview-meta">
                  <span>
                    <strong>Condition:</strong> {selectedItem.condition}
                  </span>
                  <span>
                    <strong>Category:</strong> {selectedItem.category}
                  </span>
                  <span>
                    <strong>Karma:</strong> {selectedItem.karmaValue}
                  </span>
                </div>

                <div className="preview-owner">
                  <h4>Owner</h4>
                  <p>{getOwnerName(selectedItem) || selectedItem.ownerEmail || "Unknown owner"}</p>
                </div>

                <button
                  className="escrow-btn"
                  disabled={profile?.karma_balance < selectedItem.karmaValue}
                  onClick={() => handleEscrowStart(selectedItem)}
                >
                  Start Escrow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {escrowItem && (
        <div className="modal-overlay" onClick={closeEscrowModal}>
          <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeEscrowModal}>
              x
            </button>

            <h2>Choose Delivery Method</h2>

            <div className="claim-summary">
              {escrowItem.imageUrl ? (
                <img src={escrowItem.imageUrl} alt={escrowItem.title} />
              ) : (
                <div className="no-image">[No image]</div>
              )}

              <div>
                <h3>{escrowItem.title}</h3>
                <p>{escrowItem.description}</p>
                <p>
                  <strong>Karma:</strong> {escrowItem.karmaValue}
                </p>
              </div>
            </div>

            <div className="delivery-options">
              {[
                { value: "meetup", label: "Meetup" },
                { value: "delivery", label: "Delivery" },
                { value: "shipping", label: "Shipping" },
              ].map((method) => (
                <label key={method.value} className="delivery-option">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={method.value}
                    checked={deliveryMethod === method.value}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  />
                  <span className="delivery-label">{method.label}</span>
                </label>
              ))}
            </div>

            {claimError && <div className="error-message">{claimError}</div>}

            <button
              className="confirm-claim btn-primary"
              onClick={handleConfirmClaim}
              disabled={claimLoading}
            >
              {claimLoading ? "Claiming..." : "Confirm Claim"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
