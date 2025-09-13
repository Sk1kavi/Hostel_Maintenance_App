import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HostelManagementScreen = ({ navigation }) => {
  const {
    hostels,
    loading,
    getHostels,
    createHostel,
    updateHostel,
    toggleHostelStatus,
    deleteHostel,
  } = useHostel();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Boys",
    isActive: true,
  });

  useEffect(() => {
    getHostels();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getHostels();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingHostel(null);
    setFormData({ name: "", type: "Boys", isActive: true });
    setModalVisible(true);
  };

  const openEditModal = (hostel) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name,
      type: hostel.type,
      isActive: hostel.isActive,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter a hostel name");
      return;
    }

    let success = false;
    if (editingHostel) {
      success = await updateHostel(editingHostel._id, formData);
    } else {
      success = await createHostel(formData);
    }

    if (success) {
      setModalVisible(false);
      getHostels();
    }
  };

  const handleToggleStatus = (id, status) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${status ? "deactivate" : "activate"} this hostel?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const success = await toggleHostelStatus(id);
            if (success) getHostels();
          },
        },
      ]
    );
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Delete Hostel",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteHostel(id);
            if (success) getHostels();
          },
        },
      ]
    );
  };

  const renderHostelItem = ({ item }) => (
    <View style={styles.hostelCard}>
      <View style={styles.hostelHeader}>
        <View style={styles.hostelInfo}>
          <Text style={styles.hostelName}>{item.name}</Text>
          <View style={styles.hostelMeta}>
            <View
              style={[
                styles.typeTag,
                { backgroundColor: item.type === "Boys" ? "#4285f4" : "#ea4335" },
              ]}
            >
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
            {!item.isActive && (
              <View style={styles.inactiveTag}>
                <Text style={styles.inactiveText}>INACTIVE</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.hostelActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color="#4285f4" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item._id, item.isActive)}
          >
            <Ionicons
              name={item.isActive ? "pause-circle-outline" : "play-circle-outline"}
              size={20}
              color={item.isActive ? "#ff6b6b" : "#2ed573"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hostelStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.userCount || 0}</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.complaintCount || 0}</Text>
          <Text style={styles.statLabel}>Complaints</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.activeComplaintCount || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading hostels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hostel Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
    <View style={styles.statsHeader}>
  <Text style={styles.statsText}>
    Total Hostels: {hostels?.length || 0} | Active: {hostels?.filter((h) => h.isActive).length || 0}
  </Text>
</View>


      {/* List */}
      <FlatList
        data={hostels}
        keyExtractor={(item) => item._id}
        renderItem={renderHostelItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hostels found</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <Text style={styles.emptyButtonText}>Add First Hostel</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingHostel ? "Edit Hostel" : "Add Hostel"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Hostel Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            {/* Hostel Type */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Hostel Type:</Text>
              <TouchableOpacity
                style={[styles.typeOption, formData.type === "Boys" && styles.typeSelected]}
                onPress={() => setFormData({ ...formData, type: "Boys" })}
              >
                <Text>Boys</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeOption, formData.type === "Girls" && styles.typeSelected]}
                onPress={() => setFormData({ ...formData, type: "Girls" })}
              >
                <Text>Girls</Text>
              </TouchableOpacity>
            </View>

            {/* Active Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active:</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => setFormData({ ...formData, isActive: val })}
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveText}>
                  {editingHostel ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HostelManagementScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    padding: 5,
  },
  statsHeader: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f1f3f6",
  },
  statsText: {
    fontSize: 14,
    color: "#555",
  },
  listContainer: {
    padding: 15,
  },
  hostelCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  hostelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hostelInfo: {
    flex: 1,
  },
  hostelName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  hostelMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  inactiveTag: {
    backgroundColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  hostelActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 10,
  },
  hostelStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#777",
  },
  emptyButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 10,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginRight: 10,
  },
  typeSelected: {
    backgroundColor: "#e6f0ff",
    borderColor: "#007AFF",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelButton: {
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  cancelText: {
    color: "#333",
    fontWeight: "500",
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
});
