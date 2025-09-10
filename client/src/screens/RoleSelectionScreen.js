import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const RoleSelectionScreen = ({ navigation }) => {
  const handleRoleSelect = (role) => {
    navigation.navigate('Login', { role });
  };

  const roles = [
    {
      id: 'student',
      title: 'Student',
      subtitle: 'Submit and track maintenance complaints',
      icon: 'school',
      gradient: ['#4CAF50', '#45a049']
    },
    {
      id: 'warden',
      title: 'Warden',
      subtitle: 'Manage hostel maintenance requests',
      icon: 'admin-panel-settings',
      gradient: ['#FF9800', '#F57C00']
    },
    {
      id: 'admin',
      title: 'Admin',
      subtitle: 'Oversee all hostels and complaints',
      icon: 'supervisor-account',
      gradient: ['#2196F3', '#1976D2']
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
      >
        <Text style={styles.title}>Hostel Maintenance</Text>
        <Text style={styles.subtitle}>Complaint Management System</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Your Role</Text>
        
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(role.id)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={role.gradient}
              style={styles.roleCardGradient}
            >
              <View style={styles.roleCardContent}>
                <View style={styles.iconContainer}>
                  <Icon name={role.icon} size={40} color="#fff" />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                </View>
                <Icon name="arrow-forward-ios" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  roleCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roleCardGradient: {
    borderRadius: 12,
    padding: 20,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default RoleSelectionScreen;