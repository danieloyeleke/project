import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ItemCard from "./ItemCard";
import { getItems } from "../api/items";

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
});

export default function Marketplace({ onItemClick }) {
  const { profile } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

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

  const searchedItems = items.filter(
    (item) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const closeModal = () => setSelectedItem(null);

  const handleEscrowStart = (item) => {
    console.log("Start escrow for:", item.id);
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
              onClick={() => {
                setSelectedItem(item);
                onItemClick?.(item);
              }}
              canAfford={profile?.karma_balance >= item.karmaValue}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="item-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ?
            </button>

            {selectedItem.imageUrl ? (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="modal-image"
              />
            ) : (
              <div className="no-image modal-image">??</div>
            )}

            <div className="modal-content">
              <h2>{selectedItem.title}</h2>

              <p className="modal-description">{selectedItem.description}</p>

              <div className="modal-meta">
                <span>
                  <strong>Condition:</strong> {selectedItem.condition}
                </span>
                <span>
                  <strong>Category:</strong> {selectedItem.category}
                </span>
                <span>
                  <strong>Karma:</strong> ? {selectedItem.karmaValue}
                </span>
              </div>

              <div className="modal-owner">
                <h4>Owner</h4>
                <p>
                  {selectedItem.owner?.fullName ||
                    selectedItem.ownerEmail ||
                    "Unknown owner"}
                </p>
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
      )}
    </div>
  );
}
