import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lightweight local chat between buyer and seller.
 * Stores messages in localStorage and broadcasts updates per order via BroadcastChannel.
 */
export default function OrderChat({
  orderId,
  itemId,
  buyerId,
  sellerId,
  buyerName = "Buyer",
  sellerName = "Seller",
  currentUserRole = "buyer",
  currentUserName = "You",
}) {
  const keySeed = useMemo(
    () =>
      [
        itemId || "item",
        buyerId || "buyer",
        sellerId || "seller",
        orderId || "order",
      ].join(":"),
    [itemId, buyerId, sellerId, orderId]
  );
  const storageKey = useMemo(() => `order_chat:${keySeed}`, [keySeed]);
  const channelName = useMemo(() => `order_chat_channel:${keySeed}`, [keySeed]);
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const channelRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return undefined;
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = (event) => {
      if (event?.data?.type === "chat-update" && Array.isArray(event.data.payload)) {
        setMessages(event.data.payload);
      }
    };
    channelRef.current = channel;
    return () => channel.close();
  }, [channelName]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
    channelRef.current?.postMessage?.({ type: "chat-update", payload: messages });
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, storageKey]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const message = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: currentUserRole,
      author: currentUserName,
      text,
      at: now,
    };
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  const nameForRole = (role) => (role === "seller" ? sellerName : buyerName);

  return (
    <div className="order-chat-card">
      <div className="order-chat-header">
        <div>
          <span className="detail-section-label">Conversation</span>
          <h3>Buyer & Seller Chat</h3>
          <p>Keep communication in one place for this order.</p>
        </div>
        <div className="chat-participants">
          <span className="pill pill-blue">Buyer: {buyerName}</span>
          <span className="pill pill-green">Seller: {sellerName}</span>
        </div>
      </div>

      <div className="order-chat-body" ref={listRef}>
        {messages.length === 0 && (
          <div className="chat-empty">No messages yet. Say hello!</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role === "seller" ? "from-seller" : "from-buyer"} ${msg.role === currentUserRole ? "mine" : ""}`}
          >
            <div className="chat-meta">
              <strong>{msg.author || nameForRole(msg.role)}</strong>
              <span>{new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="order-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button className="btn-primary" type="button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
