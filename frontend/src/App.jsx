import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import LoginScreen from "./LoginScreen";
import LecturerPortal from "./LecturerPortal";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("riti_user");
    const token = localStorage.getItem("riti_token");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("riti_user");
        localStorage.removeItem("riti_token");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("riti_user");
    localStorage.removeItem("riti_token");
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {!user && <LoginScreen onLogin={setUser} />}
      {user?.role === "admin" && <Dashboard onLogout={handleLogout} />}
      {user?.role === "lecturer" && <LecturerPortal facultyId={user.facultyId} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
