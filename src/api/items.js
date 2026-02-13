import api from "./axios";

/**
 * Fetch marketplace items
 */
export const getItems = async (category = "all") => {
  const params = {};

  if (category !== "all") {
    params.category = category;
  }

  const response = await api.get("/items", { params });
  return response.data;
};

/**
 * Create a new item (with image upload)
 */
export const createItem = async (itemData, imageFile = null) => {
  const formData = new FormData();

  if (itemData.title != null) formData.append("title", itemData.title);
  if (itemData.description != null) {
    formData.append("description", itemData.description);
  }
  if (itemData.category != null) formData.append("category", itemData.category);
  if (itemData.condition != null) formData.append("condition", itemData.condition);
  if (itemData.karmaValue != null) {
    formData.append("karmaValue", String(itemData.karmaValue));
  }

  const fileToUpload = imageFile || itemData.image;
  if (fileToUpload) {
    formData.append("image", fileToUpload);
  }

  const response = await api.post("/items", formData);

  return response.data;
};

/**
 * Claim an item
 */
export const claimItem = async (itemId, deliveryMethod) => {
  const response = await api.post(`/items/${itemId}/claim`, {
    deliveryMethod,
  });

  return response.data;
};

