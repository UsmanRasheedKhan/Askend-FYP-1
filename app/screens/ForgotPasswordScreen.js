import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);

    const isBusy = isSendingOtp;

    const normalizedEmail = () => email.trim().toLowerCase();

    const validateEmail = () => {
        const value = normalizedEmail();
        if (!value) {
            setEmailError('Email is required.');
            return false;
        }
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
            setEmailError('Please enter a valid email format.');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleSendOtp = async () => {
        if (!validateEmail()) {
            return;
        }

        setStatusMessage('');
        setIsSendingOtp(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail(),
                options: {
                    shouldCreateUser: false,
                },
            });

            if (error) {
                throw error;
            }

            setStatusMessage('OTP sent! Check your email for the 6-digit code.');

            navigation.navigate('OtpVerification', {
                email: normalizedEmail(),
                initialCooldown: 60,
            });
        } catch (error) {
            console.error('Error sending OTP:', error);
            Alert.alert('Could not send OTP', error.message || 'Please try again later.');
        } finally {
            setIsSendingOtp(false);
        }
    };
    // ----------------------------------------------------
    // 🎨 RENDER UI (Matching your reference image)
    // ----------------------------------------------------
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Background Gradient / Color */}
                <LinearGradient
                    colors={['#FF7E1D', '#FFD464']} // Matching your background gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.backgroundGradient}
                >
                    <View style={styles.card}>
                        {/* Mail Icon */}
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconCircle}
                        >
                            <MaterialIcons name="email" size={50} color="#fff" />
                            {/* Checkmark overlay for completed state if needed */}
                            {/* <View style={styles.checkmarkOverlay}>
                                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                            </View> */}
                        </LinearGradient>

                        <Text style={styles.title}>Forgot Password?</Text>
                        
                        <Text style={styles.subtitle}>
                            Enter your email to receive an OTP. Verify it here and set a brand new password without leaving the app.
                        </Text>

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                            style={[styles.textInput, emailError && styles.inputErrorBorder]}
                            placeholder="Enter your email address"
                            placeholderTextColor="#a0a0a0"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            onBlur={validateEmail}
                            editable={!isSendingOtp}
                        />
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        {statusMessage ? (
                            <Text style={[styles.messageText, styles.successText]}>{statusMessage}</Text>
                        ) : null}

                        <TouchableOpacity 
                            onPress={handleSendOtp} 
                            style={styles.sendButtonContainer}
                            disabled={isSendingOtp}
                        >
                            <LinearGradient
                                colors={['#FFD464', '#FF7E1D']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.sendButtonGradient, isSendingOtp && { opacity: 0.6 }]}
                            >
                                {isSendingOtp ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.sendButtonText}>Send OTP</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Sign In */}
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()} 
                            style={styles.backButton}
                            disabled={isBusy}
                        >
                            <MaterialIcons name="arrow-back" size={20} color="#666" />
                            <Text style={styles.backButtonText}>Back to Sign In</Text>
                        </TouchableOpacity>

                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ----------------------------------------------------
// 🎨 STYLES (Matching your reference image)
// ----------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FCF3E7', // Main background if gradient doesn't cover fully
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
        width: '90%', // Increased width slightly
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 30, // More rounded corners
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 }, // Stronger shadow
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#FF7E1D', // Shadow for the icon circle
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    // checkmarkOverlay: { // Optional: For a checkmark on success
    //     position: 'absolute',
    //     bottom: -5,
    //     right: -5,
    //     backgroundColor: '#fff',
    //     borderRadius: 15,
    //     padding: 2,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 1 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 2,
    // },
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
        alignSelf: 'flex-start', // Align to left
        marginBottom: 8,
        marginTop: 15,
    },
    textInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#f0f0f0', // Lighter background for input
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        borderWidth: 1, 
        borderColor: '#e0e0e0', // Subtle border
    },
    inputErrorBorder: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF8F8',
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 5,
        fontWeight: '500',
        alignSelf: 'flex-start',
    },
    successText: {
        fontSize: 14,
        color: '#28A745',
        marginTop: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    messageText: {
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
    },
    sendButtonContainer: {
        marginTop: 30,
        width: '100%',
    },
    sendButtonGradient: {
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
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 25,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    }
});

export default ForgotPasswordScreen;