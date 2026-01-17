import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { profile, user } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('my-items');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [itemsResult, claimedResult, transactionsResult] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('items')
          .select('*')
          .eq('claimed_by', user.id)
          .order('claimed_at', { ascending: false }),
        supabase
          .from('transactions')
          .select(`
            *,
            item:items(title, image_url),
            giver:profiles!transactions_giver_id_fkey(username),
            receiver:profiles!transactions_receiver_id_fkey(username)
          `)
          .or(`giver_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      setMyItems(itemsResult.data || []);
      setClaimedItems(claimedResult.data || []);
      setTransactions(transactionsResult.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} />
          ) : (
            <div className="avatar-placeholder">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1>{profile.username}</h1>
          {profile.full_name && <p className="full-name">{profile.full_name}</p>}
          {profile.location && <p className="location">📍 {profile.location}</p>}
          {profile.bio && <p className="bio">{profile.bio}</p>}
        </div>

        <div className="karma-stats">
          <div className="stat-card primary">
            <div className="stat-value">{profile.karma_balance}</div>
            <div className="stat-label">Available Karma</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{profile.total_karma_earned}</div>
            <div className="stat-label">Total Earned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{profile.total_karma_spent}</div>
            <div className="stat-label">Total Spent</div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={activeTab === 'my-items' ? 'active' : ''}
          onClick={() => setActiveTab('my-items')}
        >
          My Listings ({myItems.length})
        </button>
        <button
          className={activeTab === 'claimed' ? 'active' : ''}
          onClick={() => setActiveTab('claimed')}
        >
          Claimed ({claimedItems.length})
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      <div className="profile-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'my-items' && (
              <div className="items-list">
                {myItems.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't listed any items yet</p>
                  </div>
                ) : (
                  myItems.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-row-image">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} />
                        ) : (
                          <div className="no-image">📦</div>
                        )}
                      </div>
                      <div className="item-row-info">
                        <h4>{item.title}</h4>
                        <p>{item.category} • {item.condition}</p>
                      </div>
                      <div className="item-row-status">
                        <span className={`status-badge ${item.status}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="item-row-karma">
                        ✨ {item.karma_value}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'claimed' && (
              <div className="items-list">
                {claimedItems.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't claimed any items yet</p>
                  </div>
                ) : (
                  claimedItems.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-row-image">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} />
                        ) : (
                          <div className="no-image">📦</div>
                        )}
                      </div>
                      <div className="item-row-info">
                        <h4>{item.title}</h4>
                        <p>{item.category} • {item.condition}</p>
                      </div>
                      <div className="item-row-karma">
                        ✨ {item.karma_value}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="activity-list">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <p>No activity yet</p>
                  </div>
                ) : (
                  transactions.map(transaction => (
                    <div key={transaction.id} className="activity-item">
                      <div className="activity-icon">
                        {transaction.giver_id === user.id ? '📤' : '📥'}
                      </div>
                      <div className="activity-info">
                        <p>
                          {transaction.giver_id === user.id ? (
                            <>Gave <strong>{transaction.item.title}</strong> to {transaction.receiver.username}</>
                          ) : (
                            <>Received <strong>{transaction.item.title}</strong> from {transaction.giver.username}</>
                          )}
                        </p>
                        <span className="activity-time">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`activity-karma ${transaction.giver_id === user.id ? 'earned' : 'spent'}`}>
                        {transaction.giver_id === user.id ? '+' : '-'}{transaction.karma_amount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
