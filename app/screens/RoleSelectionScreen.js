// ...existing code...
import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'; 

// --- CONFIG (kept for reference)
const SUPABASE_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4';
const REDIRECT_URL = 'com.askend://home'; // kept for later use if needed

const { width } = Dimensions.get('window');

// 🛡️ Role Card Component 
const RoleCard = ({ title, description, iconName, role, onPress, isSelected }) => {
    const isCreator = role === 'creator';
    const iconGradientColors = ["#FFD464", "#FF7E1D"]; 
    const iconBgColor = isCreator ? '#FEECE3' : '#F9F1EB'; 

    return (
        <TouchableOpacity 
            style={[
                styles.roleCard, 
                // Orange Border on Selection
                isSelected ? styles.roleCardActive : styles.roleCardInactive 
            ]} 
            onPress={() => onPress(role)}
            activeOpacity={0.9}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <LinearGradient
                    colors={iconGradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                >
                    <FontAwesome5 
                        name={iconName} 
                        size={30} 
                        color="#fff" 
                    />
                </LinearGradient>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
        </TouchableOpacity>
    );
};


const RoleSelectionScreen = ({ navigation }) => {
    
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- HANDLERS ---
    const handleGoBack = () => {
        navigation.navigate("SignIn");
    };

    const handleEmailSignUp = () => {
        if (!selectedRole) return Alert.alert("Error", "Please select a role first.");
        navigation.navigate("SignUp", { userRole: selectedRole });
    };

    // Google button intentionally disabled — show info alert instead
    const handleGoogleSignUp = () => {
        if (!selectedRole) return Alert.alert("Error", "Please select a role first.");
        Alert.alert("Disabled", "Google sign-in is disabled for now.");
    };


    return (
        <LinearGradient
            colors={["#FFD464", "#FF7E1D"]} 
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.fullScreenBackground}
        >
            {/* ⬅️ SIMPLE WHITE BACK BUTTON */}
            <TouchableOpacity 
                style={styles.fixedBackButton} 
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                onPress={handleGoBack}
            >
                <MaterialIcons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    
                    <Text style={styles.title}>Choose Your Role</Text>
                    <Text style={styles.description}>
                        Select how you want to use Askend
                    </Text>

                    {/* --- 1. ROLE CARDS --- */}
                    <View style={styles.cardWrapper}>
                        <RoleCard
                            title="Creator"
                            description="Create and manage surveys"
                            iconName="pencil-alt" 
                            role="creator"
                            onPress={setSelectedRole}
                            isSelected={selectedRole === 'creator'}
                        />
                        
                        <RoleCard
                            title="Filler"
                            description="Take surveys and earn rewards"
                            iconName="check-square" 
                            role="filler"
                            onPress={setSelectedRole}
                            isSelected={selectedRole === 'filler'}
                        />
                    </View>

                    {/* --- 2. SIGN UP OPTIONS (Conditional) --- */}
                    {selectedRole && (
                        
                        <View style={styles.signUpOptionsContainer}>
                            {/* Primary Button (Continue to Sign Up) */}
                            <TouchableOpacity 
                                onPress={handleEmailSignUp} 
                                disabled={loading}
                                style={styles.primarySignUpWrapper} 
                            >
                                <LinearGradient
                                    colors={["#FF7E1D", "#FFD464"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.primarySignUpButton}
                                >
                                    <MaterialIcons name="person-add-alt-1" size={22} color="#fff" style={{ marginRight: 10 }} />
                                    <Text style={styles.primarySignUpText}>
                                        {loading ? 'Loading...' : 'Create an Account'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Separator for Social Login */}
                            <View style={styles.separatorContainer}>
                                <View style={styles.separatorLine} />
                                <Text style={styles.separatorText}>or continue with</Text> 
                                <View style={styles.separatorLine} />
                            </View>

                            {/* Google Button (rendered but disabled) */}
                            <TouchableOpacity 
                                onPress={handleGoogleSignUp} 
                                style={styles.socialButton}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }}
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                {selectedRole && (
                    <Text style={{ color: '#000000ff', fontSize: 14, textAlign: 'center', marginTop: 10, backgroundColor: 'rgba(193, 193, 194, 1)', padding: 8, borderRadius: 10 }}>
                        You have selected the <Text style={{ fontWeight: 'bold' }}>{selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</Text> role. It can be changed later in settings.
                    </Text>
                )}

                </View>
            </ScrollView>
        </LinearGradient>
    );
};

// ----------------------------------------------------
// 🎨 STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
    fullScreenBackground: {
        flex: 1,
    },
    fixedBackButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 8,
        zIndex: 100,
    },
    scrollContainer: { 
        flexGrow: 1, 
        paddingTop: 100,
        paddingBottom: 40,
    },
    content: { 
        paddingHorizontal: 25, 
        zIndex: 5,
        backgroundColor: "transparent"
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    description: {
        fontSize: 18,
        color: "#fff",
        textAlign: "center",
        marginBottom: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    
    // --- Role Card Styles ---
    cardWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        gap: 15,
    },
    roleCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 15,
        alignItems: "center",
        justifyContent: 'center', 
        height: 200, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 3, 
        marginHorizontal: 5,
    },
    roleCardActive: {
        borderColor: '#FF7E1D',
    },
    roleCardInactive: {
        borderColor: 'transparent',
    },
    
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconGradient: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    cardDescription: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        lineHeight: 18,
    },
    
    // --- Sign Up Options Styles ---
    signUpOptionsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 15,
        padding: 20,
        paddingTop: 20, 
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20, 
        width: '100%',
    },

    // A. Primary Sign Up Button (Gradient)
    primarySignUpWrapper: { 
        borderRadius: 10, 
        width: '100%',
        elevation: 3, 
        marginBottom: 10,
    },
    primarySignUpButton: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    primarySignUpText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Separator
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
        width: '100%',
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    separatorText: {
        width: 150, 
        textAlign: 'center',
        color: '#888',
        fontSize: 14,
    },

    // B. Social Button (Icon Only)
    socialButton: {
        alignSelf: "center",
        padding: 10,
        borderRadius: 50,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 5,
    },
    socialIcon: { 
        width: 30, 
        height: 30,
        resizeMode: 'contain',
    },
});

export default RoleSelectionScreen;
// ...existing code...