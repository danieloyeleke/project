// import React, { useState } from "react";
// import api from "../api/axios";
// import { useAuth } from "../contexts/AuthContext";
// import EscrowTimer from "../components/EscrowTimer";

// export default function ItemDetail({ item, onClose, onClaimed }) {
//   const { user } = useAuth();
//   const [deliveryMethod, setDeliveryMethod] = useState("meetup");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const isOwner = user && item.ownerId === user.id;

//   const handleClaim = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       await api.post(`/items/${item.id}/claim`, {
//         deliveryMethod,
//       });

//       onClaimed?.();
//       onClose?.();
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.message || "Failed to claim item");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div
//         className="modal-content item-detail-modal"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button className="close-btn" onClick={onClose}>
//           ×
//         </button>

//         <h2>{item.title}</h2>
//         <p>{item.description}</p>

//         <div className="karma-info">
//           <strong>Karma:</strong> {item.karmaValue}
//         </div>

//         {!isOwner && (
//           <>
//             {<div className="delivery-options">
//               {["meetup", "delivery", "shipping"].map((m) => (
//                 <label key={m}>
//                   <input
//                     type="radio"
//                     value={m}
//                     checked={deliveryMethod === m}
//                     onChange={(e) => setDeliveryMethod(e.target.value)}
//                   />
//                   {m}
//                 </label>
//               ))}
//             </div> 
            
//             }

//             {error && <div className="error-message">{error}</div>}

//             <button
//               className="btn-primary"
//               onClick={handleClaim}
//               disabled={loading}
//             >
//               {loading ? "Claiming..." : "Claim Item"}
//             </button>
//           </>
//         )}

//         {isOwner && (
//           <div className="owner-notice">This is your item</div>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import EscrowTimer from "../components/EscrowTimer";

export default function ItemDetail({ item, onClose, onClaimed }) {

  const { user } = useAuth();

  const [deliveryMethod, setDeliveryMethod] = useState("meetup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [escrow, setEscrow] = useState(null);

  const isOwner = user && item.ownerId === user.id;

  /*
  --------------------------------
  Fetch Escrow Information
  --------------------------------
  */

  useEffect(() => {

    if (!item?.escrowId) return;

    const fetchEscrow = async () => {

      try {

        const res = await api.get(`/escrow/${item.escrowId}`);

        setEscrow(res.data);

      } catch (err) {

        console.error("Failed to fetch escrow", err);

      }

    };

    fetchEscrow();

  }, [item]);



  /*
  --------------------------------
  Claim Item
  --------------------------------
  */

  const handleClaim = async () => {

    setLoading(true);
    setError("");

    try {

      await api.post(`/items/${item.id}/claim`, {
        deliveryMethod,
      });

      onClaimed?.();
      onClose?.();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to claim item"
      );

    } finally {

      setLoading(false);

    }
  };



  return (

    <div className="modal-overlay" onClick={onClose}>

      <div
        className="modal-content item-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2>{item.title}</h2>

        <p>{item.description}</p>

        <div className="karma-info">
          <strong>Karma:</strong> {item.karmaValue}
        </div>



        {/* -----------------------------
            ESCROW STATUS + TIMER
        ----------------------------- */}

        {escrow && (

          <div className="escrow-section">

            <div className="escrow-status">
              Escrow Status: <strong>{escrow.status}</strong>
            </div>

            {escrow.status === "DELIVERED" && (
              <EscrowTimer remainingSeconds={escrow.remainingSeconds} />
            )}

          </div>

        )}



        {/* -----------------------------
            CLAIM ITEM SECTION
        ----------------------------- */}

        {!isOwner && (

          <>
            <div className="delivery-options">

              {["meetup", "delivery", "shipping"].map((m) => (

                <label key={m}>

                  <input
                    type="radio"
                    value={m}
                    checked={deliveryMethod === m}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  />

                  {m}

                </label>

              ))}

            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim Item"}
            </button>

          </>

        )}



        {/* -----------------------------
            OWNER VIEW
        ----------------------------- */}

        {isOwner && (

          <div className="owner-notice">
            This is your item
          </div>

        )}

      </div>

    </div>

  );
}