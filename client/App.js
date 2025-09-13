import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/context/AuthContext';
import { HostelProvider } from './src/context/HostelContext';  
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import WardenDashboardScreen from './src/screens/WardenDashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import CreateComplaintScreen from './src/screens/CreateComplaintScreen';
import ComplaintDetailScreen from './src/screens/ComplaintDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HostelManagementScreen from './src/screens/HostelManagementScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <HostelProvider>  
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </HostelProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleSelection"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="RoleSelection" 
        component={RoleSelectionScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} options={{ title: 'My Complaints', headerLeft: null }} />
      <Stack.Screen name="WardenDashboard" component={WardenDashboardScreen} options={{ title: 'Complaint Dashboard', headerLeft: null }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard', headerLeft: null }} />
      <Stack.Screen name="CreateComplaint" component={CreateComplaintScreen} options={{ title: 'Create Complaint' }} />
      <Stack.Screen name="ComplaintDetail" component={ComplaintDetailScreen} options={{ title: 'Complaint Details' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="HostelManagement" component={HostelManagementScreen} options={{ title: 'Manage Hostels' }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Manage Users' }} />
    </Stack.Navigator>
  );
}
