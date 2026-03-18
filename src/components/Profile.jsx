import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";

export default function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [activeTab, setActiveTab] = useState("my-items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        } else {
          setError(message);
          setProfile(null);
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
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError(getErrorMessage(err));
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

  return (
    <div className="profile-page">
      {/* ================= HEADER ================= */}
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
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.username ? (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>

            <div className="profile-info">
              <h1>{profile.username || "User"}</h1>
              {profile.bio && <p className="bio">{profile.bio}</p>}
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

          {/* ================= TABS ================= */}
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

          {/* ================= CONTENT ================= */}
          <div className="profile-content">
            {activeTab === "my-items" && (
              <div className="items-list">
                {myItems.length === 0 ? (
                  <div className="empty-state">
                    <p>You haven't listed any items yet</p>
                  </div>
                ) : (
                  myItems.map((item) => (
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
                      <span className={`status-badge ${item.status}`}>
                        {item.status}
                      </span>
                      <div className="item-row-karma">
                        ✨ {item.karmaValue ?? item.karma_value ?? 0}
                      </div>
                    </div>
                  ))
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
                      <div className="item-row-karma">
                        ✨ {item.karmaValue ?? item.karma_value ?? 0}
                      </div>
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
                        {tx.type === "GIVE" ? "📤" : "📥"}
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
