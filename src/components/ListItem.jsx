import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  'Clothing',
  'Books',
  'Electronics',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Toys & Games',
  'Arts & Crafts',
  'Tools',
  'Furniture',
  'Other'
];

const CONDITIONS = [
  { value: 'new', label: 'New', karma: 100 },
  { value: 'like-new', label: 'Like New', karma: 75 },
  { value: 'good', label: 'Good', karma: 50 },
  { value: 'fair', label: 'Fair', karma: 25 }
];

export default function ListItem({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    condition: 'good',
    karmaValue: 50
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConditionChange = (condition) => {
    const conditionData = CONDITIONS.find(c => c.value === condition);
    setFormData({
      ...formData,
      condition,
      karmaValue: conditionData.karma
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase
        .from('items')
        .insert({
          owner_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          karma_value: formData.karmaValue,
          image_url: imageUrl,
          status: 'available'
        });

      if (insertError) throw insertError;

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>List an Item</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="list-item-form">
          <div className="form-group">
            <label htmlFor="image">Item Photo</label>
            <div className="image-upload">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button
                    type="button"
                    className="change-image"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label htmlFor="image" className="upload-label">
                  <div className="upload-placeholder">
                    <span>📷</span>
                    <p>Click to upload photo</p>
                  </div>
                </label>
              )}
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Item Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What are you listing?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the item..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => handleConditionChange(e.target.value)}
              >
                {CONDITIONS.map(cond => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="karma-suggestion">
            <div className="karma-label">Suggested Karma Value</div>
            <div className="karma-value-display">
              <span className="karma-amount">{formData.karmaValue}</span>
              <span className="karma-text">karma points</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              value={formData.karmaValue}
              onChange={(e) => setFormData({ ...formData, karmaValue: parseInt(e.target.value) })}
              className="karma-slider"
            />
            <div className="karma-hint">
              Adjust based on item value and demand
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Listing...' : 'List Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
