import React, { useEffect, useMemo, useState } from "react";
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
  escrowId: item.escrowId ?? item.escrow_id,
});

export default function Marketplace({ onItemClick, refreshKey = 0 }) {
  const { profile, user } = useAuth();
  const karmaBalance = profile?.karma_balance ?? profile?.karmaBalance ?? user?.karma_balance ?? 0;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchItems();
  }, [filter, refreshKey]);

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
              onClick={() => onItemClick?.(item)}
              canAfford={karmaBalance >= item.karmaValue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
