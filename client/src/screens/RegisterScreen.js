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
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth, API_URL } from '../context/AuthContext';
import axios from 'axios';

const RegisterScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    hostel: '',
    roomNumber: '',
    department: '',
    yearOfStudy: '',
    rollNumber: ''
  });
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const { role } = route.params;

  useEffect(() => {
    if (role === 'student' || role === 'warden') {
      fetchHostels();
    }
  }, [role]);

  const fetchHostels = async () => {
    try {
      const response = await axios.get(`${API_URL}/hostels`);
      setHostels(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load hostels');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Valid email is required');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (role === 'student') {
      const { hostel, roomNumber, department, yearOfStudy, rollNumber } = formData;
      if (!hostel || !roomNumber || !department || !yearOfStudy || !rollNumber) {
        Alert.alert('Error', 'All student fields are required');
        return false;
      }
    }

    if (role === 'warden') {
      if (!formData.hostel) {
        Alert.alert('Error', 'Hostel selection is required for wardens');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const registrationData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role
    };

    if (role === 'student') {
      registrationData.hostel = formData.hostel;
      registrationData.roomNumber = formData.roomNumber;
      registrationData.department = formData.department;
      registrationData.yearOfStudy = formData.yearOfStudy;
      registrationData.rollNumber = formData.rollNumber;
    } else if (role === 'warden') {
      registrationData.hostel = formData.hostel;
    }

    const result = await register(registrationData);
    setLoading(false);

    if (result.success) {
      const { user } = result.data;
      
      Alert.alert('Success', 'Registration successful!', [
        {
          text: 'OK',
          onPress: () => {
            switch (user.role) {
              case 'student':
                navigation.navigate('StudentHome');
                break;
              case 'warden':
                navigation.navigate('WardenDashboard');
                break;
              case 'admin':
                navigation.navigate('AdminDashboard');
                break;
            }
          }
        }
      ]);
    } else {
      Alert.alert('Registration Failed', result.message);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'student': return 'Student Registration';
      case 'warden': return 'Warden Registration';
      case 'admin': return 'Admin Registration';
      default: return 'Registration';
    }
  };

  const renderStudentFields = () => (
    <>
      <View style={styles.inputContainer}>
        <Icon name="domain" size={20} color="#666" style={styles.inputIcon} />
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.hostel}
            onValueChange={(value) => handleInputChange('hostel', value)}
            style={styles.picker}
          >
            <Picker.Item label="Select Hostel" value="" />
            {hostels.map((hostel) => (
              <Picker.Item key={hostel._id} label={hostel.name} value={hostel.name} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Icon name="home" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Room Number"
          placeholderTextColor="#999"
          value={formData.roomNumber}
          onChangeText={(value) => handleInputChange('roomNumber', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="school" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Department"
          placeholderTextColor="#999"
          value={formData.department}
          onChangeText={(value) => handleInputChange('department', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="date-range" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Year of Study (e.g., 2nd Year)"
          placeholderTextColor="#999"
          value={formData.yearOfStudy}
          onChangeText={(value) => handleInputChange('yearOfStudy', value)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="badge" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Roll Number"
          placeholderTextColor="#999"
          value={formData.rollNumber}
          onChangeText={(value) => handleInputChange('rollNumber', value)}
        />
      </View>
    </>
  );

  const renderWardenFields = () => (
    <View style={styles.inputContainer}>
      <Icon name="domain" size={20} color="#666" style={styles.inputIcon} />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.hostel}
          onValueChange={(value) => handleInputChange('hostel', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Hostel to Manage" value="" />
          {hostels.map((hostel) => (
            <Picker.Item key={hostel._id} label={hostel.name} value={hostel.name} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{getRoleTitle()}</Text>
        </LinearGradient>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="person" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon 
                  name={showConfirmPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            {role === 'student' && renderStudentFields()}
            {role === 'warden' && renderWardenFields()}

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Login here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  header: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 30,
    backgroundColor: '#fff',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 600,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 25,
    paddingBottom: 10,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  pickerContainer: {
    flex: 1,
    borderWidth: 0,
  },
  picker: {
    flex: 1,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;