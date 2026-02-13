import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

//attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;


// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:8080/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: false, // JWT in header, not cookies
// });

// // ✅ Attach JWT automatically
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ✅ Optional: global error handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       window.location.href = "/login";
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

// // import axios from "axios";

// // const api = axios.create({
// //   baseURL: "http://localhost:8080/api",
// //   headers: {
// //     "Content-Type": "application/json",
// //   },
// // });

// // export default api;
