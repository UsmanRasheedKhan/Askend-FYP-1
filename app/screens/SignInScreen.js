import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator, 
} from "react-native";

import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { LinearGradient } from "expo-linear-gradient";
import 'react-native-url-polyfill/auto' 
import * as Linking from 'expo-linking'; 
import { Ionicons } from '@expo/vector-icons'; 

import AskendLogo from "../../assets/images/logo.png"; 

import { supabase } from '../../supabaseClient'; 
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config'; 


const GET_USER_API_ENDPOINT = `${SUPABASE_URL}/auth/v1/user`; 
const LOGIN_API_ENDPOINT = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false); 
    const [isVerifyingLink, setIsVerifyingLink] = useState(false); 
    const [isManualLoading, setIsManualLoading] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(false);

    // ----------------------------------------------------
    // ✅ DEEP LINK VERIFICATION (The Corrected Logic)
    // ----------------------------------------------------
    useEffect(() => {
        const handleDeepLinkVerification = async () => {
            setIsVerifyingLink(true);
            const initialUrl = await Linking.getInitialURL();

            if (initialUrl) {
                const url = new URL(initialUrl);
                const accessToken = url.searchParams.get('access_token');
                const refreshToken = url.searchParams.get('refresh_token');
                const type = url.searchParams.get('type'); 

                if (accessToken && (type === 'signup' || type === 'recovery')) { 
                    try {
                        // --- IMPORTANT: Set Session using Supabase Client First ---
                        // We must set the session first to validate the tokens and use Supabase client
                        const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        
                        if (setSessionError) {
                            console.error("Deep Link Set Session Failed:", setSessionError.message);
                            Alert.alert("Error", "Session verification failed. Please try the link again.");
                            setIsVerifyingLink(false);
                            return; // Stop processing
                        } 
                        
                        // Store the session for persistence
                        await AsyncStorage.setItem('@supabase_session', JSON.stringify(sessionData.session));
                        
                        
                        // ⭐ CRITICAL FIX: IF RECOVERY, GO TO PASSWORD UPDATE AND EXIT!
                        if (type === 'recovery') {
                            Alert.alert("Password Reset", "Please set your new password now.");
                            // Use replace to prevent going back to the sign-in screen
                            navigation.replace('PasswordUpdateScreen', {
                                accessToken: accessToken, 
                                refreshToken: refreshToken,
                            });
                            setIsVerifyingLink(false);
                            return; // ✅ STOP EXECUTION HERE
                        }

                        // --- SIGNUP Confirmation Flow (Only runs if type is NOT recovery) ---

                        // Now that session is set, fetch user data for role based navigation (using Supabase client)
                        const { data: userData, error: userError } = await supabase.auth.getUser();

                        if (userError || !userData || !userData.user) {
                            console.error("User fetch error after signup:", userError);
                            // Fallback to sign in screen if user details can't be fetched
                            setIsVerifyingLink(false);
                            return;
                        }
                        
                        const userRole = userData.user.user_metadata?.user_role; 
                        
                        if (userRole) {
                            // Redirect to Dashboard for confirmed signup
                            navigation.replace(
                                userRole === 'creator' ? 'CreatorDashboard' : 'FillerDashboard'
                            );
                            return;
                        }
                        
                        // Fallback for successful signup confirmation
                         navigation.replace('ProfileCompletionScreen'); // Assuming this is where users go after signup
                         return; // Added return here for safety

                    } catch (error) {
                        console.error("Deep Link Error:", error);
                        // If any error, show the sign in screen
                    }
                } 
            }
            setIsVerifyingLink(false);
        };
        
        // Listener for when the app is already running and a link opens it
        const subscription = Linking.addEventListener('url', ({ url }) => {
            if (url) {
                // Re-run the verification logic with the new URL
                handleDeepLinkVerification();
            }
        });

        // Initial check when the app launches via a deep link
        handleDeepLinkVerification();
        
        // Cleanup listener
        return () => {
            subscription.remove();
        };

    }, [navigation]); 


    // 🧠 LOGIC: Uses Supabase Auth REST API for manual login
    async function signInWithEmail() {
        if (!email.trim() || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setIsManualLoading(true);
        
        try {
            const response = await fetch(LOGIN_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password: password.trim()
                }),
            });

            const result = await response.json(); 

            if (result.error_description || !response.ok) {
                let errorMessage = result.error_description || 'Login failed. Please check your credentials.';
                Alert.alert("Login Failed", errorMessage);
                
            } else {
                const user = result.user; 
                
                if (user) {
                    // 1. Manually save the FULL session object in the required key
                    const sessionObject = {
                        access_token: result.access_token,
                        refresh_token: result.refresh_token,
                        expires_in: result.expires_in,
                        expires_at: result.expires_at,
                        user: result.user,
                    };
                    await AsyncStorage.setItem('@supabase_session', JSON.stringify(sessionObject)); 
                    
                    // 2. Set Session (to initialize Supabase Client locally)
                    const { error: setSessionError, data: sessionData } = await supabase.auth.setSession({
                        access_token: result.access_token,
                        refresh_token: result.refresh_token,
                    });
                    
                    if (setSessionError) {
                        console.error("Set Session Failed:", setSessionError.message);
                        Alert.alert("Session Error", "Could not synchronize session data.");
                        setIsManualLoading(false);
                        return;
                    } else if (sessionData && sessionData.session) {
                        // Update stored session with the official Supabase Client object (safer)
                        await AsyncStorage.setItem('@supabase_session', JSON.stringify(sessionData.session));
                    }


                    const userRole = user.user_metadata?.user_role; 
                    
                    if (userRole) {
                        await AsyncStorage.setItem('userRole', userRole);
                        navigation.replace(
                            userRole === 'creator' ? 'CreatorDashboard' : 'FillerDashboard'
                        ); 
                    } else {
                        // If no role found (e.g., first-time login after successful signup confirmation)
                        navigation.replace('ProfileCompletionScreen');
                    }
                } else {
                    Alert.alert("Login Failed", "Could not retrieve user session after signing in.");
                }
            }
        } catch (error) {
            console.error("Sign In Network Error:", error);
            Alert.alert('Sign In Failed', 'Could not connect to the server. Please check your internet connection.');
        }

        setIsManualLoading(false);
    }

    const isLoading = isManualLoading || isVerifyingLink;

    // ----------------------------------------------------
    // 🎨 JSX (UI)
    // ----------------------------------------------------

    if (isVerifyingLink) {
        // Show a loading screen while link is being processed
        return (
            <View style={[styles.container, styles.loadingOverlay]}>
                <ActivityIndicator size="large" color="#FF8C00" />
                <Text style={styles.loadingText}>Verifying secure link...</Text>
            </View>
        );
    }

    return(
        <View style={styles.container}>
            {/* Background Shapes: */}
            <View style={styles.topShape1} />
            <View style={styles.topShape2} />
            <View style={styles.bottomShape1} />
            <View style={styles.bottomShape2} />

            {/* Main Content Area */}
            <View style={styles.content}>
                
                <View style={styles.logoContainer}>
                    <Image
                        source={AskendLogo}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoWelcome}>Welcome</Text>
                </View>

                <Text style={styles.instructions}>
                    Please Enter your account details
                </Text>

                {/* Email Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                />

                {/* Password Wrapper with Eye Icon */}
                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword} 
                        value={password}
                        onChangeText={setPassword}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                    >
                        <Ionicons 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={24} 
                            color="#999" 
                        />
                    </TouchableOpacity>
                </View>

                {/* Checkbox and Forgot Password */}
                <View style={styles.row}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                        disabled={isLoading}
                    >
                        <View
                            style={[styles.checkbox, keepLoggedIn && styles.checkboxActive]}
                        >
                            {keepLoggedIn && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Keep me logged in</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ForgotPasswordScreen')} 
                        disabled={isLoading}
                    >
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign In Button with Gradient (UI Restored here) */}
                <TouchableOpacity
                    onPress={signInWithEmail}
                    disabled={isLoading}
                    style={styles.buttonWrapper}
                >
                    <LinearGradient
                        colors={["#FF7E1D", "#FFD464"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? "Signing In..." : "Sign In"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Don't have an account? Sign up */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>Don't have an account?</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("RoleSelection")}
                        disabled={isLoading}
                    >
                        <Text style={styles.signupLink}> Sign up</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
};

// ----------------------------------------------------
// 🎨 ADJUSTED STYLES (UI Restored)
// ----------------------------------------------------

const styles = StyleSheet.create({
container: { 
    flex: 1, 
    backgroundColor: "#fff" 
},
loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
},
loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
},
topShape1: {
    position: "absolute",
    width: 170,
    height:170,
    borderRadius: 90,
    backgroundColor: "#FF7E1D", 
    top: -80,
    left: -50,
    opacity: 0.25,
    zIndex: 1,
},
topShape2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#E2BE09", 
    top: -180,
    right: -130,
    opacity: 0.25,
    zIndex: 1,
},
bottomShape1: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 110,
    backgroundColor: "#FF7E1D", 
    bottom: -150,
    right: -100,
    opacity: 0.25,
    zIndex: 1,
},
bottomShape2: {
    position: "absolute",
    width: 320,
    height: 265,
    borderRadius: 150,
    backgroundColor: "#E2BE09", 
    bottom: -170,
    left: -170,
    opacity: 0.25,
    zIndex: 1,
},
content: {
    flex: 1,
    paddingHorizontal: 35,
    justifyContent: "center",
    // 🎨 RESTORED MARGIN: Adjusted from -50 to 0 (ya thora kam) for better alignment
    marginTop: 0, 
    zIndex: 5,
},
logoContainer: { 
    alignItems: "center", 
    // ✂️ Kept or slightly adjusted
    marginBottom: -15 
},
logoImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    // ✂️ Kept or slightly adjusted
    marginBottom: -15, 
},
logoWelcome: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
    // ✂️ Kept or slightly adjusted
    marginTop: -25,
    marginBottom: 0,
},
instructions: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
    // ✂️ Kept or slightly adjusted
    marginBottom: 20, // Increased a bit for spacing
},
passwordWrapper: {
    marginBottom: 10, 
    position: 'relative',
    justifyContent: 'center',
},
passwordInput: {
    marginBottom: 0, 
    paddingRight: 50, 
},
eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 10,
    zIndex: 10,
},
input: {
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
},
row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15, 
},
checkboxContainer: { 
    flexDirection: "row", 
    alignItems: "center" 
},
checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
},
checkboxActive: { 
    backgroundColor: "#FF8C00", 
    borderColor: "#FF8C00" 
},
checkmark: { 
    color: "#fff", 
    fontSize: 14, 
    fontWeight: "bold" 
},
checkboxLabel: { 
    fontSize: 14, 
    color: "#666" 
},
forgotPassword: { 
    fontSize: 14, 
    color: "#FF8C00", 
    fontWeight: "600" 
},
buttonWrapper: { 
    borderRadius: 10, 
    marginBottom: 20, // Adjusted for better spacing
    elevation: 3 
},
gradientButton: { 
    padding: 15, 
    borderRadius: 10, 
    alignItems: "center" 
},
buttonText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
},
signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
},
signupText: { 
    fontSize: 14, 
    color: "#666" 
},
signupLink: { 
    fontSize: 14, 
    color: "#FF8C00", 
    fontWeight: "bold" 
},
});

export default SignInScreen;