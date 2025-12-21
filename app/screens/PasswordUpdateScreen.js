import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient'; // Make sure this path is correct

// Yeh screen SignInScreen se accessToken aur refreshToken ko route params ke zariye legi.
const PasswordUpdateScreen = ({ route, navigation }) => {
    // Tokens route params se lein
    const { accessToken, refreshToken } = route.params || {};

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- VALIDATION ---
    const validatePasswords = () => {
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirm password do not match.');
            return false;
        }
        setPasswordError('');
        return true;
    };

    // ----------------------------------------------------
    // 🔑 SUPABASE AUTH: Update User Password
    // ----------------------------------------------------
    const handlePasswordUpdate = async () => {
        if (!validatePasswords()) {
            return;
        }
        
        if (!accessToken || !refreshToken) {
            Alert.alert("Error", "Session data is missing. Please try the reset link again.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Session set karein taake Supabase ko pata chale ki konsa user update kar raha hai.
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (sessionError) {
                console.error("Session Set Error:", sessionError);
                Alert.alert("Error", "Could not verify reset link. Please try again.");
                return;
            }

            // 2. Password update karein.
            const { error: updateError } = await supabase.auth.updateUser({ 
                password: newPassword 
            });

            if (updateError) {
                console.error("Password Update Error:", updateError);
                Alert.alert("Update Failed", updateError.message);
            } else {
                Alert.alert(
                    "Success!",
                    "Your password has been updated successfully. Please sign in with your new password.",
                    [{ text: "OK", onPress: () => navigation.replace('SignIn') }]
                );
            }

        } catch (e) {
            console.error('General Error during update:', e);
            Alert.alert("System Error", "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };


    // ----------------------------------------------------
    // 🎨 RENDER UI 
    // ----------------------------------------------------
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <LinearGradient
                    colors={['#FF7E1D', '#FFD464']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.backgroundGradient}
                >
                    <View style={styles.card}>
                        
                        <MaterialIcons name="lock" size={60} color="#FF8C00" style={styles.icon} />
                        
                        <Text style={styles.title}>Set New Password</Text>
                        
                        <Text style={styles.subtitle}>
                            Please enter and confirm your new password to regain access to your account.
                        </Text>

                        {/* New Password Input */}
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter new password (min 6 characters)"
                                placeholderTextColor="#a0a0a0"
                                secureTextEntry={!showNewPassword}
                                autoCapitalize="none"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                        
                        {/* Confirm Password Input */}
                        <Text style={styles.inputLabel}>Confirm Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Confirm new password"
                                placeholderTextColor="#a0a0a0"
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                onBlur={validatePasswords}
                                editable={!isLoading}
                            />
                            <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {/* Error Message */}
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                        
                        {/* Update Button */}
                        <TouchableOpacity 
                            onPress={handlePasswordUpdate} 
                            style={styles.updateButtonContainer}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#FFD464', '#FF7E1D']} 
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.updateButtonGradient, isLoading && { opacity: 0.6 }]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.updateButtonText}>Update Password</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Go Back (Optional) */}
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('SignIn')} 
                            style={styles.backButton}
                            disabled={isLoading}
                        >
                            <Text style={styles.backButtonText}>Cancel and Go to Sign In</Text>
                        </TouchableOpacity>
                        
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ----------------------------------------------------
// 🎨 STYLES (Matching your application theme)
// ----------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FCF3E7',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '90%', 
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    icon: {
        marginBottom: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555', 
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginTop: 15,
    },
    inputWrapper: {
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
    },
    textInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingRight: 50, // For eye icon
        fontSize: 16,
        color: '#333',
        borderWidth: 1, 
        borderColor: '#e0e0e0',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        padding: 10,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 5,
        fontWeight: '500',
        alignSelf: 'flex-start',
        width: '100%',
    },
    updateButtonContainer: {
        marginTop: 30,
        width: '100%',
    },
    updateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 5,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 20,
        padding: 10,
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default PasswordUpdateScreen;