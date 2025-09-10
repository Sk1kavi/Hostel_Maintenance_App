import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    hostel: '',
    roomNumber: '',
    department: '',
    yearOfStudy: '',
    rollNumber: '',
    role: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const { user, updateProfile, changePassword, logout } = useAuth();

  useEffect(() => {
    if (user) {
      const userData = {
        name: user.name || '',
        email: user.email || '',
        hostel: user.hostel || '',
        roomNumber: user.roomNumber || '',
        department: user.department || '',
        yearOfStudy: user.yearOfStudy || '',
        rollNumber: user.rollNumber || '',
        role: user.role || ''
      };
      setProfileData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(profileData) !== JSON.stringify(originalData);
  };

  const handleSaveProfile = async () => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setLoading(true);
    
    const updateData = {
      name: profileData.name,
    };

    if (user?.role === 'student') {
      updateData.roomNumber = profileData.roomNumber;
      updateData.department = profileData.department;
      updateData.yearOfStudy = profileData.yearOfStudy;
    }

    const result = await updateProfile(updateData);

    if (result.success) {
      setOriginalData(profileData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.message);
    }

    setLoading(false);
  };

  const handleCancelEdit = () => {
    setProfileData(originalData);
    setIsEditing(false);
  };

  const validatePasswordForm = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setChangingPassword(true);

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

    if (result.success) {
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } else {
      Alert.alert('Error', result.message);
    }

    setChangingPassword(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await logout();
            navigation.navigate('RoleSelection');
          }
        }
      ]
    );
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student': return 'Student';
      case 'warden': return 'Warden';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return 'school';
      case 'warden': return 'admin-panel-settings';
      case 'admin': return 'supervisor-account';
      default: return 'person';
    }
  };

  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                value={passwordData.currentPassword}
                onChangeText={(value) => handlePasswordInputChange('currentPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                value={passwordData.newPassword}
                onChangeText={(value) => handlePasswordInputChange('newPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                value={passwordData.confirmPassword}
                onChangeText={(value) => handlePasswordInputChange('confirmPassword', value)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, changingPassword && styles.saveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Icon name={getRoleIcon(profileData.role)} size={40} color="#2196F3" />
              </View>
              <Text style={styles.roleBadge}>{getRoleDisplayName(profileData.role)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.userName}>{profileData.name}</Text>
              <Text style={styles.userEmail}>{profileData.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Icon name="edit" size={20} color="#2196F3" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={profileData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                editable={isEditing}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileData.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor="#999"
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            {profileData.role === 'student' && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Hostel</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={profileData.hostel}
                    editable={false}
                    placeholder="Hostel"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.helperText}>Hostel cannot be changed</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Room Number</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.roomNumber}
                    onChangeText={(value) => handleInputChange('roomNumber', value)}
                    editable={isEditing}
                    placeholder="Room number"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Department</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.department}
                    onChangeText={(value) => handleInputChange('department', value)}
                    editable={isEditing}
                    placeholder="Department"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Year of Study</Text>
                  <TextInput
                    style={[styles.input, !isEditing && styles.inputDisabled]}
                    value={profileData.yearOfStudy}
                    onChangeText={(value) => handleInputChange('yearOfStudy', value)}
                    editable={isEditing}
                    placeholder="Year of study"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Roll Number</Text>
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={profileData.rollNumber}
                    editable={false}
                    placeholder="Roll number"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.helperText}>Roll number cannot be changed</Text>
                </View>
              </>
            )}

            {(profileData.role === 'warden' || profileData.role === 'admin') && profileData.hostel && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Assigned Hostel</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profileData.hostel}
                  editable={false}
                  placeholder="Assigned hostel"
                  placeholderTextColor="#999"
                />
                <Text style={styles.helperText}>Hostel assignment cannot be changed</Text>
              </View>
            )}

            {isEditing && (
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton, 
                    (!hasChanges() || loading) && styles.saveButtonDisabled
                  ]}
                  onPress={handleSaveProfile}
                  disabled={!hasChanges() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <Icon name="lock" size={20} color="#2196F3" />
              <Text style={styles.actionButtonText}>Change Password</Text>
              <Icon name="arrow-forward-ios" size={16} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Icon name="logout" size={20} color="#F44336" />
              <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
              <Icon name="arrow-forward-ios" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {renderPasswordModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#2196F3',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
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
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  editButtons: {
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
  saveButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#F44336',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});

export default ProfileScreen;