import React, { useState } from "react";

const ISSUE_TYPES = [
  "Item not received",
  "Item damaged / broken",
  "Not as described",
  "Other",
];

export default function DisputeResolution({ order, onSubmit, onBack }) {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isVideo, setIsVideo] = useState(false);

  const handleEvidence = (file) => {
    setEvidence(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setIsVideo(file.type?.startsWith("video"));
    } else {
      setPreview(null);
      setIsVideo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      issueType,
      notes,
      evidenceName: evidence?.name,
      submittedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="order-tracking-page">
      <div className="order-tracking-shell">
        <div className="order-tracking-header">
          <div>
            <span className="detail-section-label">Dispute</span>
            <h2>Dispute Resolution</h2>
            <p>Escrow is frozen. Our moderators will review your evidence.</p>
          </div>
        </div>

        <form className="checkout-card" onSubmit={handleSubmit}>
          <div className="tracking-status-card warning">
            <strong>Escrow Frozen</strong>
            <p>Funds cannot move until moderators decide.</p>
          </div>

          <label className="checkout-label">Issue type</label>
          <select
            className="checkout-input"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
          >
            {ISSUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label className="checkout-label">Photo / video evidence</label>
          <input
            type="file"
            accept="image/*,video/*"
            className="checkout-input"
            onChange={(e) => handleEvidence(e.target.files?.[0] || null)}
          />
          {preview &&
            (isVideo ? (
              <video className="evidence-photo" src={preview} controls />
            ) : (
              <img className="evidence-photo" src={preview} alt="evidence" />
            ))}

          <label className="checkout-label">Explain the issue</label>
          <textarea
            className="checkout-textarea"
            rows="4"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What went wrong?"
          />

          <div className="tracking-actions">
            <button type="submit" className="btn-primary">
              Submit Dispute
            </button>
            <button type="button" className="btn-secondary" onClick={onBack}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
