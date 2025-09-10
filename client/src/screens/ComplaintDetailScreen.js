import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';

const ComplaintDetailScreen = ({ navigation, route }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    comment: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);

  const { user } = useAuth();
  const { complaintId } = route.params;

  const statusOptions = ['In Progress', 'Resolved', 'Rejected'];

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/complaints/${complaintId}`);
      setComplaint(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load complaint details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return '#FF9800';
      case 'In Progress': return '#2196F3';
      case 'Resolved': return '#4CAF50';
      case 'Rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Submitted': return 'schedule';
      case 'In Progress': return 'hourglass-empty';
      case 'Resolved': return 'check-circle';
      case 'Rejected': return 'cancel';
      default: return 'info';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const canUpdateComplaint = () => {
    return user?.role === 'admin' || (user?.role === 'warden' && complaint?.hostel === user?.hostel);
  };

  const handleUpdateComplaint = async () => {
    if (!updateData.status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    if (!updateData.comment.trim()) {
      Alert.alert('Error', 'Please add a comment');
      return;
    }

    setUpdating(true);

    try {
      const response = await axios.put(`${API_URL}/complaints/${complaintId}`, updateData);
      setComplaint(response.data);
      setShowUpdateModal(false);
      setUpdateData({ status: '', comment: '' });
      Alert.alert('Success', 'Complaint updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const renderImageGallery = () => {
    if (!complaint?.images || complaint.images.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {complaint.images.map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImage(imageUrl)}
              style={styles.imageContainer}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStatusTimeline = () => {
    const allUpdates = [
      {
        status: 'Submitted',
        comment: 'Complaint submitted',
        updatedBy: complaint?.createdBy,
        timestamp: complaint?.createdAt
      },
      ...(complaint?.updates || [])
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        {allUpdates.map((update, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineIcon, { backgroundColor: getStatusColor(update.status) }]}>
                <Icon name={getStatusIcon(update.status)} size={16} color="#fff" />
              </View>
              {index < allUpdates.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineStatus}>{update.status}</Text>
                <Text style={styles.timelineDate}>{formatDate(update.timestamp)}</Text>
              </View>
              {update.comment && (
                <Text style={styles.timelineComment}>{update.comment}</Text>
              )}
              <Text style={styles.timelineUser}>
                by {update.updatedBy?.name || 'System'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderUpdateModal = () => (
    <Modal
      visible={showUpdateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowUpdateModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Complaint</Text>
            <TouchableOpacity
              onPress={() => setShowUpdateModal(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Comment</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a comment about this update..."
                placeholderTextColor="#999"
                value={updateData.comment}
                onChangeText={(value) => setUpdateData(prev => ({ ...prev, comment: value }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
              <Text style={styles.charCount}>
                {updateData.comment.length}/300 characters
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.updateButton, updating && styles.updateButtonDisabled]}
                onPress={handleUpdateComplaint}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderImageModal = () => (
    <Modal
      visible={!!selectedImage}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setSelectedImage(null)}
    >
      <View style={styles.imageModalOverlay}>
        <TouchableOpacity
          style={styles.imageModalClose}
          onPress={() => setSelectedImage(null)}
        >
          <Icon name="close" size={30} color="#fff" />
        </TouchableOpacity>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading complaint details...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Complaint not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{complaint.title}</Text>
              <Text style={styles.category}>{complaint.category}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(complaint.status) }]}>
              <Icon name={getStatusIcon(complaint.status)} size={16} color="#fff" />
              <Text style={styles.statusText}>{complaint.status}</Text>
            </View>
          </View>
          
          <View style={styles.headerDetails}>
            <View style={styles.detailRow}>
              <Icon name="domain" size={18} color="#666" />
              <Text style={styles.detailText}>{complaint.hostel}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="home" size={18} color="#666" />
              <Text style={styles.detailText}>Room {complaint.roomNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="person" size={18} color="#666" />
              <Text style={styles.detailText}>by {complaint.createdBy?.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Icon name="schedule" size={18} color="#666" />
              <Text style={styles.detailText}>{formatDate(complaint.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{complaint.description}</Text>
        </View>

        {renderImageGallery()}
        {renderStatusTimeline()}

        {canUpdateComplaint() && complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.updateComplaintButton}
              onPress={() => setShowUpdateModal(true)}
            >
              <Icon name="edit" size={20} color="#fff" />
              <Text style={styles.updateComplaintButtonText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderUpdateModal()}
      {renderImageModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  headerDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    minWidth: '48%',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  imageContainer: {
    marginRight: 10,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
  },
  timelineComment: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  timelineUser: {
    fontSize: 12,
    color: '#999',
  },
  updateComplaintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  updateComplaintButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
});

export default ComplaintDetailScreen;
