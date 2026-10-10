import { API_BASE_URL } from "./config";

// Helper function to handle response errors
const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || data.errors?.join(", ") || "API Request Failed");
  }
  return data;
};

// GET endpoints
export const fetchExams = () => fetch(`${API_BASE_URL}/exams`).then(res => res.json());
export const fetchRooms = () => fetch(`${API_BASE_URL}/rooms`).then(res => res.json());
export const fetchFaculty = () => fetch(`${API_BASE_URL}/faculty`).then(res => res.json());
export const fetchAllocations = () => fetch(`${API_BASE_URL}/allocations`).then(res => res.json());

// POST endpoints
export const generateSchedule = () => 
  fetch(`${API_BASE_URL}/schedule/generate`, { method: "POST" }).then(handleResponse);

export const suggestRepair = (allocationId, disruptionType) => 
  fetch(`${API_BASE_URL}/schedule/repair/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allocationId, disruptionType })
  }).then(handleResponse);

export const applyRepair = (allocationId, disruptionType, replaceWithId) => 
  fetch(`${API_BASE_URL}/schedule/repair/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allocationId, disruptionType, replaceWithId })
  }).then(handleResponse);

export const generateInsights = () => 
  fetch(`${API_BASE_URL}/schedule/insights`, { method: "POST" }).then(handleResponse);
