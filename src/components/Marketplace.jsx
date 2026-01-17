import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ItemCard from './ItemCard';

export default function Marketplace({ onItemClick }) {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          owner:profiles!items_owner_id_fkey(username, location, avatar_url)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', 'Clothing', 'Books', 'Electronics', 'Home & Kitchen', 'Sports & Outdoors', 'Other'];

  return (
    <div className="marketplace">
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
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>No items found</p>
          <p className="empty-hint">Be the first to list something!</p>
        </div>
      ) : (
        <div className="items-grid">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              canAfford={profile && profile.karma_balance >= item.karma_value}
            />
          ))}
        </div>
      )}
    </div>
  );
}
