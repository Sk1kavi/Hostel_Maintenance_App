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
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';

const WardenDashboardScreen = ({ navigation }) => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const { user, logout } = useAuth();

  const statusOptions = ['All', 'Submitted', 'In Progress', 'Resolved', 'Rejected'];
  const categoryOptions = [
    'All', 'Electrical', 'Plumbing', 'Carpentry', 'Civil (Wall/Ceiling)', 
    'Network/Internet', 'Furniture', 'Sanitation', 'Water Cooler', 'Other'
  ];

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [complaints, statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get(`${API_URL}/complaints`);
      setComplaints(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredComplaints(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
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

  const getPriorityLevel = (complaint) => {
    // Simple priority logic based on category and age
    const daysSinceCreated = Math.floor((new Date() - new Date(complaint.createdAt)) / (1000 * 60 * 60 * 24));
    const urgentCategories = ['Electrical', 'Plumbing', 'Water Cooler', 'Sanitation'];
    
    if (urgentCategories.includes(complaint.category) && daysSinceCreated > 2) {
      return 'High';
    } else if (daysSinceCreated > 5) {
      return 'Medium';
    }
    return 'Low';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#F44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#666';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        style={styles.complaintCard}
        onPress={() => navigation.navigate('ComplaintDetail', { complaintId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.complaintHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.complaintTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.complaintCategory}>{item.category}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
                <Text style={styles.priorityText}>{priority}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.complaintDetails}>
          <View style={styles.detailRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.detailText}>{item.createdBy?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="home" size={16} color="#666" />
            <Text style={styles.detailText}>Room {item.roomNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color="#666" />
            <Text style={styles.detailText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.complaintDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.complaintFooter}>
          <Text style={styles.updatesCount}>
            {item.updates?.length || 0} updates
          </Text>
          <Icon name="arrow-forward-ios" size={16} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="assignment" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Complaints Found</Text>
      <Text style={styles.emptySubtitle}>
        {statusFilter !== 'All' || categoryFilter !== 'All' 
          ? 'Try adjusting your filters' 
          : 'No complaints have been submitted yet'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.hostelInfo}>{user?.hostel} - Warden</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={24} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

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

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item._id}
        renderItem={renderComplaintItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredComplaints.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  profileButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  complaintCard: {
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
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complaintCategory: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  complaintDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minWidth: '30%',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  updatesCount: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});

export default WardenDashboardScreen;