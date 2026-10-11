import { API_BASE_URL } from "./config";

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("riti_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("riti_token");
      window.location.reload();
    }
    throw new Error(data.message || data.error || data.errors?.join(", ") || "API Request Failed");
  }
  return data;
};

export const fetchExams = () => fetch(`${API_BASE_URL}/exams`, { headers: getHeaders() }).then(res => res.json());
export const fetchRooms = () => fetch(`${API_BASE_URL}/rooms`, { headers: getHeaders() }).then(res => res.json());
export const fetchFaculty = () => fetch(`${API_BASE_URL}/faculty`, { headers: getHeaders() }).then(res => res.json());
export const fetchAllocations = () => fetch(`${API_BASE_URL}/allocations`, { headers: getHeaders() }).then(res => res.json());

export const createRecord = (table, data) => fetch(`${API_BASE_URL}/${table}`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const updateRecord = (table, id, data) => fetch(`${API_BASE_URL}/${table}/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse);
export const deleteRecord = (table, id) => fetch(`${API_BASE_URL}/${table}/${id}`, { method: "DELETE", headers: getHeaders() }).then(handleResponse);

export const login = (data) => 
  fetch(`${API_BASE_URL}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(handleResponse);

export const generateSchedule = () => 
  fetch(`${API_BASE_URL}/schedule/generate`, { method: "POST", headers: getHeaders() }).then(handleResponse);

export const suggestRepair = (allocationId, disruptionType) => 
  fetch(`${API_BASE_URL}/schedule/repair/suggest`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ allocationId, disruptionType })
  }).then(handleResponse);

export const applyRepair = (allocationId, disruptionType, replaceWithId) => 
  fetch(`${API_BASE_URL}/schedule/repair/apply`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ allocationId, disruptionType, replaceWithId })
  }).then(handleResponse);

export const generateInsights = () => 
  fetch(`${API_BASE_URL}/schedule/insights`, { method: "POST", headers: getHeaders() }).then(handleResponse);

export const ingestDocument = async (file, text) => {
  const token = localStorage.getItem("riti_token");
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (text) formData.append("text", text);
  
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}/ingest/document`, {
    method: "POST",
    headers,
    body: formData
  }).then(handleResponse);
};

export const confirmIngest = async (data) => {
  return fetch(`${API_BASE_URL}/ingest/confirm`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse);
};
