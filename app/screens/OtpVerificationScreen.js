import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
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

const OTP_LENGTH = 6;

const OtpVerificationScreen = ({ route, navigation }) => {
    const normalizedEmail = route?.params?.email?.trim().toLowerCase() || '';
    const initialCooldown = route?.params?.initialCooldown ?? 60;

    const [otpValue, setOtpValue] = useState('');
    const [otpError, setOtpError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [resendCooldown, setResendCooldown] = useState(initialCooldown);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [isResendingOtp, setIsResendingOtp] = useState(false);

    const isBusy = isVerifyingOtp || isResendingOtp;

    useEffect(() => {
        if (!normalizedEmail) {
            Alert.alert('Missing Email', 'Please restart the password reset flow.', [
                { text: 'Go Back', onPress: () => navigation.replace('ForgotPasswordScreen') },
            ]);
        }
    }, [normalizedEmail, navigation]);

    useEffect(() => {
        if (resendCooldown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleOtpChange = (value) => {
        const sanitized = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
        setOtpValue(sanitized);
        if (otpError) {
            setOtpError('');
        }
    };

    const validateOtpInput = () => {
        if (!otpValue) {
            setOtpError(`Enter the ${OTP_LENGTH}-digit OTP from your email.`);
            return false;
        }
        if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otpValue)) {
            setOtpError(`OTP must be a ${OTP_LENGTH}-digit code.`);
            return false;
        }
        setOtpError('');
        return true;
    };

    const handleVerifyOtp = async () => {
        if (!validateOtpInput()) {
            return;
        }

        setIsVerifyingOtp(true);
        setStatusMessage('');

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email: normalizedEmail,
                token: otpValue,
                type: 'email',
            });

            if (error) {
                throw error;
            }

            if (!data?.session) {
                throw new Error('OTP verified but no reset session was returned.');
            }

            setStatusMessage('OTP verified! Redirecting…');
            navigation.replace('PasswordUpdateScreen', {
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
                email: normalizedEmail,
            });
        } catch (error) {
            console.error('OTP verification failed:', error);
            Alert.alert('Invalid OTP', error.message || 'Double-check the code and try again.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !normalizedEmail) {
            return;
        }

        setIsResendingOtp(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: { shouldCreateUser: false },
            });

            if (error) {
                throw error;
            }

            setOtpValue('');
            setOtpError('');
            setStatusMessage('New OTP sent. Check your inbox.');
            setResendCooldown(60);
        } catch (error) {
            console.error('Error resending OTP:', error);
            Alert.alert('Could not resend OTP', error.message || 'Please try again later.');
        } finally {
            setIsResendingOtp(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <LinearGradient
                    colors={['#FF7E1D', '#FFD464']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.backgroundGradient}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.card}>
                            <LinearGradient
                                colors={['#FF7E1D', '#FFD464']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconCircle}
                            >
                                <MaterialIcons name="sms" size={48} color="#fff" />
                            </LinearGradient>

                            <Text style={styles.title}>Enter Verification Code</Text>
                            <Text style={styles.subtitle}>
                                We emailed a {OTP_LENGTH}-digit code to {normalizedEmail}. Enter it below to verify your identity.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>One-Time Password</Text>
                                <TextInput
                                    style={[styles.otpInput, otpError && styles.inputErrorBorder]}
                                    placeholder="123456"
                                    placeholderTextColor="#c9c6be"
                                    keyboardType="number-pad"
                                    value={otpValue}
                                    onChangeText={handleOtpChange}
                                    maxLength={OTP_LENGTH}
                                    editable={!isVerifyingOtp}
                                />
                                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}
                            </View>

                            {statusMessage ? (
                                <Text style={[styles.messageText, styles.successText]}>{statusMessage}</Text>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleVerifyOtp}
                                style={styles.sendButtonContainer}
                                disabled={isVerifyingOtp}
                            >
                                <LinearGradient
                                    colors={['#8BC34A', '#4CAF50']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.sendButtonGradient, isVerifyingOtp && { opacity: 0.6 }]}
                                >
                                    {isVerifyingOtp ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.sendButtonText}>Verify OTP</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={handleResendOtp}
                                disabled={resendCooldown > 0 || isResendingOtp}
                            >
                                {isResendingOtp ? (
                                    <ActivityIndicator size="small" color="#FF7E1D" />
                                ) : (
                                    <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
                                        {resendCooldown > 0
                                            ? `Resend OTP in ${resendCooldown}s`
                                            : 'Resend OTP'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigation.replace('ForgotPasswordScreen')}
                                style={styles.backButton}
                                disabled={isBusy}
                            >
                                <MaterialIcons name="arrow-back" size={20} color="#666" />
                                <Text style={styles.backButtonText}>Use a different email</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 420,
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
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    inputGroup: {
        width: '100%',
        marginTop: 10,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    otpInput: {
        width: '100%',
        height: 55,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E9E3D0',
        backgroundColor: '#FDF6EC',
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 8,
        textAlign: 'center',
        shadowColor: '#FFB86C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    inputErrorBorder: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF4F4',
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 6,
        fontWeight: '500',
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
    resendButton: {
        marginTop: 18,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF7E1D',
        textAlign: 'center',
    },
    resendDisabled: {
        color: '#C79A6B',
    },
    sendButtonContainer: {
        marginTop: 25,
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
    },
});

export default OtpVerificationScreen;
