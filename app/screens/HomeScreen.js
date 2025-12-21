// app/screens/HomeScreen.js

import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { MaterialIcons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
    
    useEffect(() => {
        const checkUserRoleAndRedirect = async () => {
            try {
                // 1. AsyncStorage se Role fetch karein
                const storedRole = await AsyncStorage.getItem('userRole');
                
                // 2. Role ko TRIM aur LOWERCASE karke check karein (THE ROBUST FIX)
                if (storedRole) {
                    
                    // CRITICAL: .trim() removes spaces, .toLowerCase() ensures consistent comparison
                    const cleanRole = storedRole.trim().toLowerCase(); 
                    
                    if (cleanRole === 'filler') { 
                        // Agar role 'filler' hai
                        console.log("Redirecting to FillerDashboard");
                        navigation.replace('FillerDashboard');
                        
                    } else if (cleanRole === 'creator') {
                        // Agar role 'creator' hai
                        console.log("Redirecting to CreatorDashboard");
                        navigation.replace('CreatorDashboard');
                        
                    } else {
                        // Agar role unknown ho
                        console.log("Unknown Role (Redirecting to SignIn):", storedRole);
                        navigation.replace('SignIn');
                    }
                } else {
                    // Agar role hi nahi mila
                    console.log("No Role Found (Redirecting to SignIn)");
                    navigation.replace('SignIn');
                }
            } catch (error) {
                console.error("Failed to read user role:", error);
                navigation.replace('SignIn');
            }
        };

        // Adding a slight delay for safety
        const timeout = setTimeout(checkUserRoleAndRedirect, 50); 
        
        // Cleanup function for useEffect
        return () => clearTimeout(timeout); 

    }, [navigation]); 
    
    // UI while checking the role
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#FF8C00" />
            <Text style={styles.loadingText}>Verifying role and loading dashboard...</Text>
        </View>
    );
};

// ----------------------------------------------------
// 🎨 STYLES 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', 
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
});

export default HomeScreen;