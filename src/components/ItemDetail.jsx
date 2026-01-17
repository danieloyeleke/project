import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DELIVERY_METHODS = [
  { value: 'meetup', label: 'Local Meetup', icon: '🤝' },
  { value: 'delivery', label: 'Local Delivery', icon: '🚗' },
  { value: 'shipping', label: 'Shipping', icon: '📦' }
];

export default function ItemDetail({ item, onClose, onClaimed }) {
  const { user, profile, refreshProfile } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState('meetup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user && item.owner_id === user.id;
  const canAfford = profile && profile.karma_balance >= item.karma_value;

  const handleClaim = async () => {
    if (!canAfford) {
      setError('Insufficient karma points');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('items')
        .update({
          status: 'claimed',
          claimed_by: user.id,
          claimed_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          item_id: item.id,
          giver_id: item.owner_id,
          receiver_id: user.id,
          karma_amount: item.karma_value,
          delivery_method: deliveryMethod,
          status: 'pending'
        });

      if (transactionError) throw transactionError;

      const { error: giverUpdateError } = await supabase
        .from('profiles')
        .update({
          karma_balance: supabase.raw(`karma_balance + ${item.karma_value}`),
          total_karma_earned: supabase.raw(`total_karma_earned + ${item.karma_value}`)
        })
        .eq('id', item.owner_id);

      if (giverUpdateError) throw giverUpdateError;

      const { error: receiverUpdateError } = await supabase
        .from('profiles')
        .update({
          karma_balance: supabase.raw(`karma_balance - ${item.karma_value}`),
          total_karma_spent: supabase.raw(`total_karma_spent + ${item.karma_value}`)
        })
        .eq('id', user.id);

      if (receiverUpdateError) throw receiverUpdateError;

      await refreshProfile();

      if (onClaimed) onClaimed();
      if (onClose) onClose();
    } catch (err) {
      console.error('Error claiming item:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content item-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        <div className="item-detail">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="item-detail-image" />
          ) : (
            <div className="item-detail-image no-image">📦</div>
          )}

          <div className="item-detail-info">
            <div className="item-detail-header">
              <h2>{item.title}</h2>
              <div className="item-badges">
                <span className="badge condition">{item.condition}</span>
                <span className="badge category">{item.category}</span>
              </div>
            </div>

            {item.description && (
              <p className="item-description">{item.description}</p>
            )}

            {item.owner && (
              <div className="owner-info">
                <h4>Listed by</h4>
                <div className="owner-details">
                  <span className="owner-name">{item.owner.username}</span>
                  {item.owner.location && (
                    <span className="owner-location">{item.owner.location}</span>
                  )}
                </div>
              </div>
            )}

            <div className="karma-info">
              <div className="karma-label">Karma Value</div>
              <div className="karma-value-large">
                <span className="karma-icon">✨</span>
                <span className="karma-amount">{item.karma_value}</span>
              </div>
              {profile && (
                <div className="karma-balance">
                  Your balance: {profile.karma_balance} karma
                </div>
              )}
            </div>

            {!isOwner && (
              <>
                <div className="delivery-options">
                  <h4>Delivery Method</h4>
                  <div className="delivery-methods">
                    {DELIVERY_METHODS.map(method => (
                      <label key={method.value} className="delivery-option">
                        <input
                          type="radio"
                          name="delivery"
                          value={method.value}
                          checked={deliveryMethod === method.value}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                        />
                        <span className="delivery-icon">{method.icon}</span>
                        <span className="delivery-label">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                  className="btn-primary btn-large"
                  onClick={handleClaim}
                  disabled={loading || !canAfford}
                >
                  {loading ? 'Claiming...' : !canAfford ? 'Insufficient Karma' : 'Claim Item'}
                </button>

                {!canAfford && (
                  <p className="insufficient-hint">
                    You need {item.karma_value - profile.karma_balance} more karma points
                  </p>
                )}
              </>
            )}

            {isOwner && (
              <div className="owner-notice">
                This is your listing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
