import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { deleteItem, updateItem } from "../api/items";
import {
  claimDailyLoginBonus,
  getDailyLoginBonusState,
} from "../utils/dailyKarma";

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
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

export default function Profile({ activeOrder, onOpenOrderTracking }) {
  const { user, refreshProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("my-items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [itemActionLoading, setItemActionLoading] = useState(false);
  const [dailyBonusMessage, setDailyBonusMessage] = useState("");
  const [dailyBonusState, setDailyBonusState] = useState({
    streakCount: 0,
    canClaimToday: false,
    claimAmount: 1,
  });

  const getErrorMessage = (err) =>
    (typeof err?.response?.data === "string" ? err.response.data : "") ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Request failed";

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const buildIdentitySet = (profileData) => {
    const values = [
      user?.id,
      user?.userId,
      user?.user_id,
      user?.email,
      user?.username,
      profileData?.id,
      profileData?.user?.id,
      profileData?.user?.email,
      profileData?.username,
    ];

    return new Set(
      values
        .filter((value) => value != null && String(value).trim() !== "")
        .map((value) => String(value))
    );
  };

  const isMatch = (value, identitySet) =>
    value != null && identitySet.has(String(value));

  const isMyItem = (item, identitySet) =>
    [
      item?.ownerId,
      item?.owner_id,
      item?.userId,
      item?.user_id,
      item?.ownerEmail,
      item?.owner_email,
      item?.ownerUsername,
      item?.owner_username,
      item?.owner?.id,
      item?.owner?.email,
      item?.owner?.username,
      item?.user?.id,
      item?.user?.email,
      item?.user?.username,
    ].some((value) => isMatch(value, identitySet));

  const isClaimedByMe = (item, identitySet) =>
    [
      item?.claimedBy,
      item?.claimed_by,
      item?.claimedById,
      item?.claimed_by_id,
      item?.claimedByEmail,
      item?.claimed_by_email,
      item?.claimedByUsername,
      item?.claimed_by_username,
      item?.claimer?.id,
      item?.claimer?.email,
      item?.claimer?.username,
    ].some((value) => isMatch(value, identitySet));

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [profileRes, itemsRes] = await Promise.allSettled([
        api.get("/profile/me"),
        api.get("/items"),
      ]);

      let resolvedProfile = null;

      if (profileRes.status === "fulfilled") {
        resolvedProfile = profileRes.value.data;
        setProfile(resolvedProfile);
        setDailyBonusMessage("");
      } else {
        const status = profileRes.reason?.response?.status;
        const message = getErrorMessage(profileRes.reason);
        const isMissingProfile =
          status === 400 && /profile not found/i.test(message);

        if (isMissingProfile) {
          resolvedProfile = {
            username: user?.username || user?.email?.split("@")[0] || "User",
            bio: "",
            karmaBalance: 25,
            totalKarmaEarned: 25,
            totalKarmaSpent: 0,
          };
          setProfile(resolvedProfile);
          setDailyBonusMessage("");
        } else {
          setError(message);
          setProfile(null);
          setDailyBonusMessage("");
        }
      }

      if (itemsRes.status === "fulfilled") {
        const items = normalizeList(itemsRes.value.data);
        const identitySet = buildIdentitySet(resolvedProfile);
        setMyItems(items.filter((item) => isMyItem(item, identitySet)));
        setClaimedItems(items.filter((item) => isClaimedByMe(item, identitySet)));
      } else {
        setMyItems([]);
        setClaimedItems([]);
      }

      setTransactions([]);
      setDailyBonusState(getDailyLoginBonusState(user?.id));
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(getErrorMessage(err));
      setDailyBonusMessage("");
      setMyItems([]);
      setClaimedItems([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMyItems([]);
      setClaimedItems([]);
      setTransactions([]);
      setLoading(false);
      return;
    }
    fetchUserData();
  }, [user, fetchUserData]);

  const handleClaimDailyBonus = async () => {
    if (!dailyBonusState.canClaimToday || !user?.id) {
      setDailyBonusMessage("Today's login bonus has already been claimed.");
      return;
    }

    setItemActionLoading(true);
    setError("");
    setDailyBonusMessage("");

    try {
      const claimResult = claimDailyLoginBonus(user.id);
      const awardedAmount = toNumber(
        claimResult.awardedAmount ?? dailyBonusState.claimAmount,
        dailyBonusState.claimAmount
      );

      const response = await api.post(`/profile/karma/add/${awardedAmount}`);
      const updatedProfile = response?.data;

      if (updatedProfile && typeof updatedProfile === "object") {
        setProfile(updatedProfile);
      } else {
        // Optimistic fallback so the UI reflects the new karma immediately
        setProfile((prev) => {
          const prevBalance = toNumber(
            prev?.karmaBalance ?? prev?.karma_balance,
            0
          );
          const prevEarned = toNumber(
            prev?.totalKarmaEarned ?? prev?.total_karma_earned,
            0
          );

          return {
            ...prev,
            karmaBalance: prevBalance + awardedAmount,
            totalKarmaEarned: prevEarned + awardedAmount,
          };
        });
      }

      await refreshProfile?.();

      setDailyBonusState((prev) => ({
        ...prev,
        streakCount: claimResult.streakCount,
        canClaimToday: false,
        claimAmount: 0,
      }));

      setDailyBonusMessage(
        `You claimed +${awardedAmount} karma for a ${claimResult.streakCount}-day login streak.`
      );
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setItemActionLoading(false);
    }
  };


  const startEditingItem = (item) => {
    setEditingItemId(item.id ?? item._id);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Other",
      condition: item.condition || "good",
      karmaValue: item.karmaValue ?? item.karma_value ?? 0,
    });
    setError("");
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditForm(null);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: field === "karmaValue" ? Number(value) || 0 : value,
    }));
  };

  const handleSaveItem = async (itemId) => {
    if (!editForm?.title?.trim()) {
      setError("Item title is required.");
      return;
    }
    if ((editForm.karmaValue ?? 0) <= 0) {
      setError("Karma value must be greater than 0.");
      return;
    }

    setItemActionLoading(true);
    setError("");

    try {
      await updateItem(itemId, {
        ...editForm,
        title: editForm.title.trim(),
        description: editForm.description.trim(),
      });
      cancelEditingItem();
      await fetchUserData();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setItemActionLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm(
      "Delete this listing? This action cannot be undone."
    );
    if (!confirmed) return;

    setItemActionLoading(true);
    setError("");

    try {
      await deleteItem(itemId);
      if (editingItemId === itemId) {
        cancelEditingItem();
      }
      await fetchUserData();
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setItemActionLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : !profile ? (
        <div className="empty-state">
          <p>Profile not found.</p>
        </div>
      ) : (
        <>
          {dailyBonusMessage && <div className="success-message">{dailyBonusMessage}</div>}

          <div className="profile-header">
            <div className="profile-avatar">
              {profile.username ? (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="avatar-placeholder">[User]</div>
              )}
            </div>

            <div className="profile-info">
              <h1>{profile.username || "User"}</h1>
              {profile.bio && <p className="bio">{profile.bio}</p>}
              {activeOrder && (
                <button
                  type="button"
                  className="btn-primary btn-medium"
                  onClick={onOpenOrderTracking}
                >
                  View Active Order
                </button>
              )}
            </div>

            <div className="karma-stats">
              <div className="stat-card primary">
                <div className="stat-value">
                  {profile.karmaBalance ?? profile.karma_balance ?? 25}
                </div>
                <div className="stat-label">Available Karma</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">
                  {profile.totalKarmaEarned ?? profile.total_karma_earned ?? 0}
                </div>
                <div className="stat-label">Total Earned</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">
                  {profile.totalKarmaSpent ?? profile.total_karma_spent ?? 0}
                </div>
                <div className="stat-label">Total Spent</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{myItems.length}</div>
                <div className="stat-label">Items Listed</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{claimedItems.length}</div>
                <div className="stat-label">Items Claimed</div>
              </div>
            </div>
          </div>

          <div className="checkout-card profile-bonus-card">
            <span className="detail-section-label">Daily Login Bonus</span>
            {dailyBonusState.canClaimToday && (
              <div className="success-message">
                You qualify for today&apos;s login bonus. Click the claim button to
                receive +{dailyBonusState.claimAmount} karma.
              </div>
            )}
            <h3>{dailyBonusState.streakCount}-Day Login Streak</h3>
            <p>
              Claim 1 karma each login day, 25 karma on every 7-day streak, and 100
              karma on every 30-day streak.
            </p>
            <div className="profile-bonus-row">
              <div>
                <span className="detail-meta-label">Today's Reward</span>
                <strong>+{dailyBonusState.claimAmount} karma</strong>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={!dailyBonusState.canClaimToday || itemActionLoading}
                onClick={handleClaimDailyBonus}
              >
                {dailyBonusState.canClaimToday ? "Claim Daily Bonus" : "Already Claimed Today"}
              </button>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={activeTab === "my-items" ? "active" : ""}
              onClick={() => setActiveTab("my-items")}
            >
              My Listings ({myItems.length})
            </button>

            <button
              className={activeTab === "claimed" ? "active" : ""}
              onClick={() => setActiveTab("claimed")}
            >
              Claimed ({claimedItems.length})
            </button>

            <button
              className={activeTab === "activity" ? "active" : ""}
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>
          </div>

          <div className="profile-content">
            {activeTab === "my-items" && (
              <div className="items-list">
                {myItems.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't listed any items yet</p>
                  </div>
                ) : (
                  myItems.map((item) => {
                    const itemId = item.id ?? item._id ?? item.title;
                    const isEditing = editingItemId === itemId;

                    return (
                      <div key={itemId} className={`item-row ${isEditing ? "editing" : ""}`}>
                        <img
                          src={item.imageUrl || item.image_url}
                          alt={item.title}
                          className="item-row-image"
                        />

                        {isEditing ? (
                          <div className="item-edit-form">
                            <input
                              value={editForm?.title ?? ""}
                              onChange={(e) => handleEditFieldChange("title", e.target.value)}
                              placeholder="Item title"
                            />
                            <textarea
                              value={editForm?.description ?? ""}
                              onChange={(e) =>
                                handleEditFieldChange("description", e.target.value)
                              }
                              placeholder="Description"
                              rows="3"
                            />
                            <div className="item-edit-grid">
                              <select
                                value={editForm?.category ?? "Other"}
                                onChange={(e) =>
                                  handleEditFieldChange("category", e.target.value)
                                }
                              >
                                {CATEGORIES.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={editForm?.condition ?? "good"}
                                onChange={(e) =>
                                  handleEditFieldChange("condition", e.target.value)
                                }
                              >
                                {CONDITIONS.map((condition) => (
                                  <option key={condition.value} value={condition.value}>
                                    {condition.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min="1"
                                value={editForm?.karmaValue ?? 0}
                                onChange={(e) =>
                                  handleEditFieldChange("karmaValue", e.target.value)
                                }
                                placeholder="Karma value"
                              />
                            </div>
                            <div className="item-row-actions">
                              <button
                                type="button"
                                className="btn-primary btn-small"
                                disabled={itemActionLoading}
                                onClick={() => handleSaveItem(itemId)}
                              >
                                {itemActionLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                className="btn-secondary btn-small"
                                disabled={itemActionLoading}
                                onClick={cancelEditingItem}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="item-row-info">
                              <h4>{item.title}</h4>
                              <p>
                                {item.category} • {item.condition}
                              </p>
                            </div>
                            <span className={`status-badge ${item.status}`}>
                              {item.status}
                            </span>
                            <div className="item-row-karma">
                              ✨ {item.karmaValue ?? item.karma_value ?? 0}
                            </div>
                            <div className="item-row-actions">
                              <button
                                type="button"
                                className="btn-secondary btn-small"
                                disabled={itemActionLoading}
                                onClick={() => startEditingItem(item)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-small item-delete-btn"
                                disabled={itemActionLoading}
                                onClick={() => handleDeleteItem(itemId)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "claimed" && (
              <div className="items-list">
                {claimedItems.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't claimed any items yet</p>
                  </div>
                ) : (
                  claimedItems.map((item) => (
                    <div key={item.id ?? item._id ?? item.title} className="item-row">
                      <img
                        src={item.imageUrl || item.image_url}
                        alt={item.title}
                        className="item-row-image"
                      />
                      <div className="item-row-info">
                        <h4>{item.title}</h4>
                        <p>
                          {item.category} • {item.condition}
                        </p>
                      </div>
                      <span className="status-badge claimed">In Escrow / Claimed</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="activity-list">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <p>No activity yet</p>
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id ?? tx._id ?? tx.createdAt} className="activity-item">
                      <div className="activity-icon">
                        {tx.type === "GIVE" ? "[Out]" : "[In]"}
                      </div>
                      <div className="activity-info">
                        <p>{tx.description}</p>
                        <span className="activity-time">
                          {new Date(tx.createdAt || tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className={`activity-karma ${
                          tx.type === "GIVE" ? "earned" : "spent"
                        }`}
                      >
                        {tx.type === "GIVE" ? "+" : "-"}
                        {tx.karmaAmount ?? tx.karma_amount ?? 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
