// import axios from 'axios';

// const API = axios.create({ baseURL: 'http://localhost:5000' });

// // Materials
// export const getMaterials = () => API.get('/materials');
// export const addMaterial = (data) => API.post('/materials', data);
// export const updateMaterial = (id, data) => API.put(`/materials/${id}`, data);
// export const deleteMaterial = (id) => API.delete(`/materials/${id}`);

// // Requests
// export const getRequests = () => API.get('/requests');
// export const addRequest = (data) => API.post('/requests', data);
// export const updateRequest = (id, data) => API.put(`/requests/${id}`, data);
// export const deleteRequest = (id) => API.delete(`/requests/${id}`);

// // Suppliers
// export const getSuppliers = () => API.get('/suppliers');
// export const addSupplier = (data) => API.post('/suppliers', data);
// export const updateSupplier = (id, data) => API.put(`/suppliers/${id}`, data);
// export const deleteSupplier = (id) => API.delete(`/suppliers/${id}`);



import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default API;