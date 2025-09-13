import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WardenDashboardScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('complaints'); 
  const [students, setStudents] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveResponse, setLeaveResponse] = useState('');
  
  const { user, logout } = useAuth();

  const statusOptions = ['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected'];
  const categoryOptions = [
    'All', 'Electrical', 'Plumbing', 'Carpentry', 'Civil (Wall/Ceiling)', 
    'Network/Internet', 'Furniture', 'Sanitation', 'Water Cooler', 'Other'
  ];

  const tabOptions = [
    { key: 'complaints', label: 'Complaints', icon: 'report-problem' },
    { key: 'attendance', label: 'Attendance', icon: 'how-to-reg' },
    { key: 'leaves', label: 'Leave Requests', icon: 'event-available' }
  ];

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (activeTab === 'complaints') {
      applyFilters();
    }
  }, [complaints, statusFilter, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchComplaints(),
        fetchStudents(),
        fetchLeaveRequests(),
        fetchAttendanceData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_URL}/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load complaints');
    }
  };

  const fetchStudents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_URL}/warden/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_URL}/warden/leave-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveRequests(response.data);
    } catch (error) {
      console.error("Error fetching leave requests:", error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load leave requests');
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.get(`${API_URL}/warden/attendance?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceData(response.data);
    } catch (error) {
      console.error("Error fetching attendance:", error.response?.data || error.message);
    }
  };

  const markAttendance = async (studentId, isPresent) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(`${API_URL}/warden/attendance`, {
        studentId,
        date: selectedDate,
        isPresent
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setAttendanceData(prev => prev.map(item => 
        item.studentId === studentId 
          ? { ...item, isPresent, marked: true }
          : item
      ));
      
      Alert.alert('Success', 'Attendance marked successfully');
    } catch (error) {
      console.error("Error marking attendance:", error.response?.data || error.message);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const handleLeaveRequest = async (leaveId, status, response = '') => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.put(`${API_URL}/warden/leave-requests/${leaveId}`, {
        status,
        wardenResponse: response
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setLeaveRequests(prev => prev.map(leave => 
        leave._id === leaveId 
          ? { ...leave, status, wardenResponse: response }
          : leave
      ));
      
      setLeaveModal(false);
      setSelectedLeave(null);
      setLeaveResponse('');
      
      Alert.alert('Success', `Leave request ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error("Error updating leave request:", error.response?.data || error.message);
      Alert.alert('Error', 'Failed to update leave request');
    }
  };

  const applyFilters = () => {
    let filtered = [...complaints];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(complaint => complaint.category === categoryFilter);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredComplaints(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': case 'Pending': return '#FF9800';
      case 'In Progress': return '#2196F3';
      case 'Resolved': case 'Approved': return '#4CAF50';
      case 'Rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Submitted': case 'Pending': return 'schedule';
      case 'In Progress': return 'hourglass-empty';
      case 'Resolved': case 'Approved': return 'check-circle';
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

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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

  const renderComplaintItem = ({ item }) => {
    const priority = getPriorityLevel(item);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>Category: {item.category}</Text>
          <Text style={styles.detailText}>Room: {item.roomNumber}</Text>
          <Text style={styles.detailText}>Date: {formatDate(item.createdAt)}</Text>
        </View>
        
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.studentName}</Text>
          <Text style={styles.detailText}>Room: {item.roomNumber}</Text>
          <Text style={styles.detailText}>Roll No: {item.rollNumber}</Text>
        </View>
        <View style={styles.attendanceControls}>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.presentButton, item.isPresent && styles.selectedButton]}
            onPress={() => markAttendance(item.studentId, true)}
          >
            <Icon name="check" size={16} color={item.isPresent ? "#fff" : "#4CAF50"} />
            <Text style={[styles.buttonText, item.isPresent && styles.selectedButtonText]}>Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceButton, styles.absentButton, item.isPresent === false && styles.selectedButton]}
            onPress={() => markAttendance(item.studentId, false)}
          >
            <Icon name="close" size={16} color={item.isPresent === false ? "#fff" : "#F44336"} />
            <Text style={[styles.buttonText, item.isPresent === false && styles.selectedButtonText]}>Absent</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderLeaveItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedLeave(item);
        setLeaveModal(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{item.studentName}</Text>
          <Text style={styles.detailText}>Room: {item.roomNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Icon name={getStatusIcon(item.status)} size={12} color="#fff" />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>From: {formatDateOnly(item.startDate)}</Text>
        <Text style={styles.detailText}>To: {formatDateOnly(item.endDate)}</Text>
        <Text style={styles.detailText}>Days: {item.duration}</Text>
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={2}>
        Reason: {item.reason}
      </Text>
    </TouchableOpacity>
  );

  const getPriorityLevel = (complaint) => {
    const daysSinceCreated = Math.floor((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24));
    const urgentCategories = ['Electrical', 'Plumbing', 'Water Cooler', 'Sanitation'];
    
    if (urgentCategories.includes(complaint.category) && daysSinceCreated > 2) {
      return 'High';
    } else if (daysSinceCreated > 5) {
      return 'Medium';
    }
    return 'Low';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'complaints':
        return (
          <>
            {/* Filters */}
            <View style={styles.filtersContainer}>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={statusFilter}
                    onValueChange={setStatusFilter}
                    style={styles.picker}
                  >
                    {statusOptions.map((status) => (
                      <Picker.Item key={status} label={status} value={status} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.filterItem}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={categoryFilter}
                    onValueChange={setCategoryFilter}
                    style={styles.picker}
                  >
                    {categoryOptions.map((category) => (
                      <Picker.Item key={category} label={category} value={category} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{complaints.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                  {complaints.filter(c => c.status === 'Submitted').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                  {complaints.filter(c => c.status === 'In Progress').length}
                </Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {complaints.filter(c => c.status === 'Resolved').length}
                </Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
            </View>

            <FlatList
              data={filteredComplaints}
              keyExtractor={(item) => item._id}
              renderItem={renderComplaintItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </>
        );

      case 'attendance':
        return (
          <>
            {/* Date Selector */}
            <View style={styles.dateContainer}>
              <Icon name="calendar-today" size={20} color="#2196F3" />
              <Text style={styles.dateLabel}>Date: {selectedDate}</Text>
              <TouchableOpacity
                style={styles.changeDateButton}
                onPress={() => {
                  Alert.alert('Date Picker', 'Date picker implementation needed');
                }}
              >
                <Icon name="edit" size={16} color="#2196F3" />
              </TouchableOpacity>
            </View>

            {/* Attendance Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{attendanceData.length}</Text>
                <Text style={styles.statLabel}>Total Students</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {attendanceData.filter(a => a.isPresent === true).length}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#F44336' }]}>
                  {attendanceData.filter(a => a.isPresent === false).length}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                  {attendanceData.filter(a => a.isPresent === null).length}
                </Text>
                <Text style={styles.statLabel}>Unmarked</Text>
              </View>
            </View>

            <FlatList
              data={attendanceData}
              keyExtractor={(item) => item.studentId}
              renderItem={renderAttendanceItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </>
        );

      case 'leaves':
        return (
          <>
            {/* Leave Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{leaveRequests.length}</Text>
                <Text style={styles.statLabel}>Total Requests</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                  {leaveRequests.filter(l => l.status === 'Pending').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                  {leaveRequests.filter(l => l.status === 'Approved').length}
                </Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#F44336' }]}>
                  {leaveRequests.filter(l => l.status === 'Rejected').length}
                </Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </View>
            </View>

            <FlatList
              data={leaveRequests}
              keyExtractor={(item) => item._id}
              renderItem={renderLeaveItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.hostelInfo}>{user?.hostel} - Warden</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {tabOptions.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? '#2196F3' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}

      {/* Leave Modal */}
      <Modal
        visible={leaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Leave Request Details</Text>
              <TouchableOpacity onPress={() => setLeaveModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedLeave && (
              <ScrollView style={styles.modalContent}>
                <Text style={styles.modalLabel}>Student: {selectedLeave.studentName}</Text>
                <Text style={styles.modalLabel}>Room: {selectedLeave.roomNumber}</Text>
                <Text style={styles.modalLabel}>From: {formatDateOnly(selectedLeave.startDate)}</Text>
                <Text style={styles.modalLabel}>To: {formatDateOnly(selectedLeave.endDate)}</Text>
                <Text style={styles.modalLabel}>Duration: {selectedLeave.duration} days</Text>
                <Text style={styles.modalLabel}>Reason:</Text>
                <Text style={styles.modalText}>{selectedLeave.reason}</Text>
                
                {selectedLeave.status === 'Pending' && (
                  <>
                    <Text style={styles.modalLabel}>Response (Optional):</Text>
                    <TextInput
                      style={styles.textInput}
                      multiline
                      placeholder="Add your response..."
                      value={leaveResponse}
                      onChangeText={setLeaveResponse}
                    />
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.approveButton]}
                        onPress={() => handleLeaveRequest(selectedLeave._id, 'Approved', leaveResponse)}
                      >
                        <Text style={styles.modalButtonText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.rejectButton]}
                        onPress={() => handleLeaveRequest(selectedLeave._id, 'Rejected', leaveResponse)}
                      >
                        <Text style={styles.modalButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  hostelInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  filterItem: {
    flex: 1,
    padding: 15,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 0,
  },
  picker: {
    height: 40,
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  dateLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  changeDateButton: {
    padding: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  attendanceControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginLeft: 8,
  },
  presentButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  absentButton: {
    borderColor: '#F44336',
    backgroundColor: '#fff',
  },
  selectedButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  buttonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  selectedButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default WardenDashboardScreen;