import React, { useState } from "react";
import { createItem } from "../api/items";

const CATEGORIES = [
  "Clothing",
  "Books",
  "Electronics",
  "Home & Kitchen",
  "Sports & Outdoors",
  "Toys & Games",
  "Arts & Crafts",
  "Tools",
  "Furniture",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New", karma: 100 },
  { value: "like-new", label: "Like New", karma: 75 },
  { value: "good", label: "Good", karma: 50 },
  { value: "fair", label: "Fair", karma: 25 },
];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export default function ListItem({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    condition: "good",
    karmaValue: 50,
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file && file.size > MAX_FILE_SIZE) {
      setError("Image must be 2MB or smaller");
      return;
    }
    setError("");
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleConditionChange = (value) => {
    const cond = CONDITIONS.find((c) => c.value === value);
    setFormData({
      ...formData,
      condition: value,
      karmaValue: cond.karma,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createItem(formData, imageFile);

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to list item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>List Item</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="list-item-form">
          <div className="form-group">
            <label>Item Photo</label>
            {preview ? (
              <img src={preview} alt="preview" className="preview-img" />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageChange} />
            )}
          </div>

            <div className="form-group">
                    <input
                      required
                      placeholder="Item title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
            </div>

            <div className="form-group">
                    <textarea
                    
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
              </div>


              <div className="form-group">
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
              </div>

              <div className="form-group">
          <select
            value={formData.condition}
            onChange={(e) => handleConditionChange(e.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
              </div>

               
          <div className="karma-box">
            Karma Value: <strong>{formData.karmaValue}</strong>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn-primary" disabled={loading}>
            {loading ? "Listing..." : "List Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
