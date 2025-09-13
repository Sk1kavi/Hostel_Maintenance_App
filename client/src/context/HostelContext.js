import React, { createContext, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const HostelContext = createContext();

export const HostelProvider = ({ children }) => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);

const API_URL = 'https://hostel-maintenance-app.onrender.com/api'; 

  // Fetch all hostels
  const fetchHostels = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/hostels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
  setHostels(data.hostels);
} else {
  setHostels([]); // fallback
  Alert.alert("Error", data.message || "Failed to fetch hostels");
}

    } catch (err) {
      console.error("fetchHostels error:", err);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Create hostel
  const createHostel = async (formData) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/hostels`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        fetchHostels();
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to create hostel");
        return { success: false };
      }
    } catch (err) {
      console.error("createHostel error:", err);
      Alert.alert("Error", "Network error occurred");
      return { success: false };
    }
  };

  // Update hostel
  const updateHostel = async (id, formData) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/admin/hostels/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        fetchHostels();
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to update hostel");
        return { success: false };
      }
    } catch (err) {
      console.error("updateHostel error:", err);
      Alert.alert("Error", "Network error occurred");
      return { success: false };
    }
  };

  // Toggle hostel status
  const toggleHostelStatus = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/admin/hostels/${id}/toggle-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        fetchHostels();
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to update status");
        return { success: false };
      }
    } catch (err) {
      console.error("toggleHostelStatus error:", err);
      Alert.alert("Error", "Network error occurred");
      return { success: false };
    }
  };

  // Delete hostel
  const deleteHostel = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(`${API_URL}/admin/hostels/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        fetchHostels();
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to delete hostel");
        return { success: false };
      }
    } catch (err) {
      console.error("deleteHostel error:", err);
      Alert.alert("Error", "Network error occurred");
      return { success: false };
    }
  };

  return (
    <HostelContext.Provider
      value={{
        hostels,
        loading,
        getHostels: fetchHostels,
        createHostel,
        updateHostel,
        toggleHostelStatus,
        deleteHostel,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
};

export const useHostel = () => useContext(HostelContext);
