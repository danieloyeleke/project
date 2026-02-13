// import React, { useState } from "react";
// import api from "../api/axios";
// import { useAuth } from "../contexts/AuthContext";
// import { claimItem } from '../api/items';

// export default function ItemDetail({ item, onClose, onClaimed }) {
//   const { user } = useAuth();
//   const [deliveryMethod, setDeliveryMethod] = useState("meetup");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const isOwner = user && item.owner?.id === user.id;


// //   const handleClaim = async () => {
// //   try {
// //     await claimItem(item.id, deliveryMethod);
// //     onClaimed?.();
// //     onClose?.();
// //   } catch (e) {
// //     setError("Unable to claim item");
// //   }
// // };


//   const handleClaim = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       await api.post(`/items/${item.id}/claim`, {
//         deliveryMethod,
//       });

//       if (onClaimed) onClaimed();
//       if (onClose) onClose();
//     } catch (err) {
//       console.error(err);
//       setError(
//         err.response?.data?.message || "Failed to claim item"
//       );
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
//           &times;
//         </button>

//         <div className="item-detail">
//           <div className="item-detail-info">
//             <h2>{item.title}</h2>

//             <p>{item.description}</p>

//             <div className="karma-info">
//               <strong>Karma:</strong> {item.karmaValue}
//             </div>

//             {!isOwner && (
//               <>
//                 <div className="delivery-options">
//                   <label>
//                     <input
//                       type="radio"
//                       value="meetup"
//                       checked={deliveryMethod === "meetup"}
//                       onChange={(e) => setDeliveryMethod(e.target.value)}
//                     />
//                     Meetup
//                   </label>

//                   <label>
//                     <input
//                       type="radio"
//                       value="delivery"
//                       checked={deliveryMethod === "delivery"}
//                       onChange={(e) => setDeliveryMethod(e.target.value)}
//                     />
//                     Delivery
//                   </label>

//                   <label>
//                     <input
//                       type="radio"
//                       value="shipping"
//                       checked={deliveryMethod === "shipping"}
//                       onChange={(e) => setDeliveryMethod(e.target.value)}
//                     />
//                     Shipping
//                   </label>
//                 </div>

//                 {error && (
//                   <div className="error-message">{error}</div>
//                 )}

//                 <button
//                   className="btn-primary"
//                   onClick={handleClaim}
//                   disabled={loading}
//                 >
//                   {loading ? "Claiming..." : "Claim Item"}
//                 </button>
//               </>
//             )}

//             {isOwner && (
//               <div className="owner-notice">
//                 This is your item
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";

export default function ItemDetail({ item, onClose, onClaimed }) {
  const { user } = useAuth();
  const [deliveryMethod, setDeliveryMethod] = useState("meetup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isOwner = user && item.ownerId === user.id;

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
      setError(err.response?.data?.message || "Failed to claim item");
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

        {!isOwner && (
          <>
            {<div className="delivery-options">
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
            
//             <div className="delivery-options">
//   {[
//     { value: "meetup", label: "Meetup 🤝" },
//     { value: "delivery", label: "Delivery 🚗" },
//     { value: "shipping", label: "Shipping 📦" },
//   ].map((method) => (
//     <label key={method.value} className="delivery-option">
//       <input
//         type="radio"
//         name="deliveryMethod"
//         value={method.value}
//         checked={deliveryMethod === method.value}
//         onChange={() => setDeliveryMethod(method.value)}
//       />
//       <span className="delivery-label">{method.label}</span>
//     </label>
//   ))}
// </div>

            
            }

            {error && <div className="error-message">{error}</div>}

            <button
              className="btn-primary"
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? "Claiming..." : "Claim Item"}
            </button>
          </>
        )}

        {isOwner && (
          <div className="owner-notice">This is your item</div>
        )}
      </div>
    </div>
  );
}
