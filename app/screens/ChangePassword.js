import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

// Password Criteria Component (SignUpScreen jaisa hi)
const PasswordCriteria = ({ meetsRequirement, label }) => {
    const color = meetsRequirement ? "#00A86B" : "#A9A9A9";
    const icon = meetsRequirement ? "✓" : "•";
    
    return (
        <View style={styles.criteriaItem}>
            <Text style={[styles.criteriaIcon, { color }]}>{icon}</Text>
            <Text style={[styles.criteriaLabel, { color }]}>{label}</Text>
        </View>
    );
};

// Custom TextInput component for better styling
const CustomTextInput = ({ placeholder, value, onChangeText, secureTextEntry = false, label, showPassword, onTogglePassword }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.passwordInputContainer}>
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeIcon} onPress={onTogglePassword}>
                <MaterialIcons 
                    name={showPassword ? "visibility-off" : "visibility"} 
                    size={24} 
                    color="#999" 
                />
            </TouchableOpacity>
        </View>
        <View style={styles.divider} />
    </View>
);

// Change Password Screen
const ChangePasswordScreen = ({ navigation }) => {
    // State variables according to the UI
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password criteria state
    const [criteria, setCriteria] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        symbol: false,
    });

    // 🛡️ Blacklist for Profanity/Common Passwords Check (SignUpScreen jaisa)
    const PROFANITY_BLACKLIST = [
        "badword1", 
        "swearword2", 
        "idiot", 
        "stupid",
        "admin",
        "password", 
        "123456789",
        "qwerty",
        "111111111",
    ];

    // 🔑 PASSWORD VALIDATION FUNCTION (SignUpScreen jaisa)
    const validatePassword = (p) => {
        const MAX_LENGTH = 128; 
        const trimmedPassword = p.trim();

        // 1. Required Field
        if (!trimmedPassword) {
            return "Password is required.";
        }

        // 2. Maximum Length Check (Client-side enforcement)
        if (trimmedPassword.length > MAX_LENGTH) {
            return `Password cannot exceed ${MAX_LENGTH} characters.`;
        }

        // 3. Blacklist/Common Words Check
        const lowerPassword = trimmedPassword.toLowerCase();
        const isBlacklisted = PROFANITY_BLACKLIST.some(word => lowerPassword.includes(word));
        if (isBlacklisted) {
            return "Avoid very common or weak passwords.";
        }

        return ""; 
    };

    // Validate new password criteria (SignUpScreen jaisa hi)
    useEffect(() => {
        const checkPasswordStrength = (p) => {
            const minLength = 13;
            setCriteria({
                length: p.length >= minLength,
                uppercase: /[A-Z]/.test(p),
                lowercase: /[a-z]/.test(p),
                number: /[0-9]/.test(p),
                symbol: /[!@#$%^&*\.]/.test(p), 
            });
        };
        checkPasswordStrength(newPassword);
    }, [newPassword]);

    const isPasswordStrong = Object.values(criteria).every(val => val === true);

    const handlePasswordChange = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all the password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirmation password do not match.');
            return;
        }

        // Check if password meets all criteria
        if (!isPasswordStrong) {
            Alert.alert('Weak Password', 'Please ensure your password meets all security criteria.');
            return;
        }

        // Additional validation
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            Alert.alert('Error', passwordError);
            return;
        }

        setLoading(true);
        try {
            // Supabase password update
            const { error } = await supabase.auth.updateUser({ password: newPassword });

            if (error) {
                Alert.alert('Update Failed', `Could not update password. Error: ${error.message}`);
            } else {
                Alert.alert(
                    'Success', 
                    'Your password has been changed successfully.',
                    [{ 
                        text: 'OK', 
                        onPress: () => {
                            // Optional: Sign out after password change
                            // supabase.auth.signOut();
                            navigation.goBack();
                        }
                    }]
                );
            }
        } catch (error) {
            console.error('Password change error:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    
                    <LinearGradient
                        colors={['#FFD464', '#FF7E1D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.lockCircle}
                    >
                        <MaterialIcons name="lock-open" size={40} color="#FFFFFF" />
                    </LinearGradient>
                    
                    <Text style={styles.mainTitle}>Change Password</Text>
                    <Text style={styles.subText}>
                        Your security matters. Please set a strong new password.
                    </Text>
                </View>

                {/* Password Input Fields */}
                <View style={styles.formContainer}>
                    <CustomTextInput
                        label="Current Password"
                        placeholder=""
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPassword}
                        showPassword={showCurrentPassword}
                        onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
                    />

                    <CustomTextInput
                        label="New Password"
                        placeholder="Enter a password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        showPassword={showNewPassword}
                        onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                    />
                    
                    {/* Password Strength Indicators (SignUpScreen jaisa) */}
                    {newPassword.length > 0 && (
                        <View style={styles.criteriaContainer}>
                            <View style={styles.criteriaRow}>
                                <PasswordCriteria meetsRequirement={criteria.length} label="Min 13 Characters" />
                                <PasswordCriteria meetsRequirement={criteria.uppercase} label="Uppercase Letter" />
                            </View>
                            <View style={styles.criteriaRow}>
                                <PasswordCriteria meetsRequirement={criteria.lowercase} label="Lowercase Letter" />
                                <PasswordCriteria meetsRequirement={criteria.symbol} label="One Symbol (!@#$.)" /> 
                            </View>
                            <View style={styles.criteriaRow}>
                                <PasswordCriteria meetsRequirement={criteria.number} label="One Number (0-9)" />
                                <View style={styles.criteriaItem} /> 
                            </View>
                        </View>
                    )}
                    
                    <CustomTextInput
                        label="Confirm New Password"
                        placeholder=""
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        showPassword={showConfirmPassword}
                        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                </View>

                {/* Save Changes Button */}
                <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handlePasswordChange}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#FF7E1D', '#FFD464']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveButtonGradient}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

// ----------------------------------------------------
// 🎨 STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
    },
    // Top Header UI
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        padding: 10,
    },
    lockCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        opacity: 0.8,
        elevation: 5,
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    // Form Styles
    formContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F4EB',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 60,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        height: '100%',
    },
    eyeIcon: {
        padding: 5,
    },
    // Password Criteria Styles (SignUpScreen jaisa)
    criteriaContainer: {
        marginBottom: 20,
        paddingLeft: 5,
    },
    criteriaRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    criteriaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginBottom: 5,
    },
    criteriaIcon: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 5,
    },
    criteriaLabel: {
        fontSize: 13,
    },
    // Save Button
    saveButton: {
        width: '100%',
        marginTop: 10,
        marginBottom: 20,
    },
    saveButtonGradient: {
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Cancel Button
    cancelButton: {
        paddingVertical: 10,
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default ChangePasswordScreen;