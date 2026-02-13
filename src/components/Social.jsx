import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';

export default function Social() {
  const { user, profile } = useAuth();
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [friendsItems, setFriendsItems] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [giftModal, setGiftModal] = useState(null);
  const [giftAmount, setGiftAmount] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchSocialData();
    }
  }, [user]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      const [followingResult, followersResult, usersResult] = await Promise.all([
        supabase
          .from('follows')
          .select('*, following:profiles!follows_following_id_fkey(id, username, location, karma_balance)')
          .eq('follower_id', user.id),
        supabase
          .from('follows')
          .select('*, follower:profiles!follows_follower_id_fkey(id, username, location, karma_balance)')
          .eq('following_id', user.id),
        supabase
          .from('profiles')
          .select('id, username, location, karma_balance')
          .neq('id', user.id)
          .limit(10)
      ]);

      setFollowing(followingResult.data || []);
      setFollowers(followersResult.data || []);

      const followingIds = (followingResult.data || []).map(f => f.following_id);
      const suggested = (usersResult.data || []).filter(u => !followingIds.includes(u.id));
      setSuggestedUsers(suggested);

      if (followingIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('items')
          .select(`
            *,
            owner:profiles!items_owner_id_fkey(username, location)
          `)
          .in('owner_id', followingIds)
          .eq('status', 'available')
          .order('created_at', { ascending: false })
          .limit(20);

        setFriendsItems(itemsData || []);
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;
      await fetchSocialData();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;
      await fetchSocialData();
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handleGiftKarma = async () => {
    if (!giftModal || !giftAmount) return;

    const amount = parseInt(giftAmount);
    if (amount <= 0 || amount > profile.karma_balance) {
      alert('Invalid amount');
      return;
    }

    try {
      const { error: giftError } = await supabase
        .from('karma_gifts')
        .insert({
          giver_id: user.id,
          receiver_id: giftModal.id,
          amount,
          message: giftMessage
        });

      if (giftError) throw giftError;

      await supabase
        .from('profiles')
        .update({
          karma_balance: supabase.raw(`karma_balance - ${amount}`)
        })
        .eq('id', user.id);

      await supabase
        .from('profiles')
        .update({
          karma_balance: supabase.raw(`karma_balance + ${amount}`)
        })
        .eq('id', giftModal.id);

      setGiftModal(null);
      setGiftAmount('');
      setGiftMessage('');
      await fetchSocialData();
    } catch (error) {
      console.error('Error gifting karma:', error);
      alert('Failed to gift karma');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="social-page">
      <div className="social-tabs">
        <button
          className={activeTab === 'feed' ? 'active' : ''}
          onClick={() => setActiveTab('feed')}
        >
          Friends Feed
        </button>
        <button
          className={activeTab === 'following' ? 'active' : ''}
          onClick={() => setActiveTab('following')}
        >
          Following ({following.length})
        </button>
        <button
          className={activeTab === 'followers' ? 'active' : ''}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({followers.length})
        </button>
        <button
          className={activeTab === 'discover' ? 'active' : ''}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
      </div>

      <div className="social-content">
        {activeTab === 'feed' && (
          <div className="friends-feed">
            {friendsItems.length === 0 ? (
              <div className="empty-state">
                <p>No items from friends yet</p>
                <p className="empty-hint">Follow some users to see their listings here!</p>
              </div>
            ) : (
              <div className="items-grid">
                {friendsItems.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-image">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} />
                      ) : (
                        <div className="no-image">📦</div>
                      )}
                    </div>
                    <div className="item-info">
                      <h4>{item.title}</h4>
                      <p className="item-owner">by {item.owner.username}</p>
                      <div className="item-footer">
                        <span className="item-karma">✨ {item.karma_value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="users-list">
            {following.length === 0 ? (
              <div className="empty-state">
                <p>You're not following anyone yet</p>
              </div>
            ) : (
              following.map(follow => (
                <div key={follow.id} className="user-card">
                  <div className="user-avatar">
                    {follow.following.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h4>{follow.following.username}</h4>
                    {follow.following.location && (
                      <p className="user-location">📍 {follow.following.location}</p>
                    )}
                    <p className="user-karma">✨ {follow.following.karma_balance} karma</p>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => handleUnfollow(follow.following.id)}
                    >
                      Unfollow
                    </button>
                    <button
                      className="btn-primary btn-small"
                      onClick={() => setGiftModal(follow.following)}
                    >
                      Gift Karma
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="users-list">
            {followers.length === 0 ? (
              <div className="empty-state">
                <p>No followers yet</p>
              </div>
            ) : (
              followers.map(follow => {
                const isFollowingBack = following.some(f => f.following_id === follow.follower.id);
                return (
                  <div key={follow.id} className="user-card">
                    <div className="user-avatar">
                      {follow.follower.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4>{follow.follower.username}</h4>
                      {follow.follower.location && (
                        <p className="user-location">📍 {follow.follower.location}</p>
                      )}
                      <p className="user-karma">✨ {follow.follower.karma_balance} karma</p>
                    </div>
                    <div className="user-actions">
                      {!isFollowingBack && (
                        <button
                          className="btn-primary btn-small"
                          onClick={() => handleFollow(follow.follower.id)}
                        >
                          Follow Back
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="users-list">
            {suggestedUsers.length === 0 ? (
              <div className="empty-state">
                <p>No users to discover</p>
              </div>
            ) : (
              suggestedUsers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <h4>{user.username}</h4>
                    {user.location && (
                      <p className="user-location">📍 {user.location}</p>
                    )}
                    <p className="user-karma">✨ {user.karma_balance} karma</p>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn-primary btn-small"
                      onClick={() => handleFollow(user.id)}
                    >
                      Follow
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {giftModal && (
        <div className="modal-overlay" onClick={() => setGiftModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Gift Karma to {giftModal.username}</h3>
              <button className="close-btn" onClick={() => setGiftModal(null)}>&times;</button>
            </div>

            <div className="gift-form">
              <p className="karma-balance-info">
                Your balance: {profile.karma_balance} karma
              </p>

              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  max={profile.karma_balance}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value)}
                  placeholder="How much karma?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message (optional)</label>
                <textarea
                  id="message"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Add a nice message..."
                  rows="3"
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleGiftKarma}
                disabled={!giftAmount || parseInt(giftAmount) <= 0}
              >
                Send Gift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
