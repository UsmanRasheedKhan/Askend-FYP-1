import React, { useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    MaterialIcons,
    MaterialCommunityIcons,
    Entypo,
} from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { supabase } from '../../supabaseClient';
import { REST_API_URL, API_HEADERS } from '../../config';

const ContactInfoScreen = ({ navigation }) => {
    const currentStep = 2;
    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;

    const [phoneNumber, setPhoneNumber] = useState("");
    const [cnic, setCnic] = useState("");
    const [location, setLocation] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const [phoneError, setPhoneError] = useState("");
    const [cnicError, setCnicError] = useState("");
    const [locationError, setLocationError] = useState("");

    // Handle CNIC input change
    const handleCNICChange = (text) => {
        const cleaned = text.replace(/[^\d]/g, '');
        const limited = cleaned.slice(0, 13);
        setCnic(limited);
        setCnicError("");
    };

    // ---------------------------
    // Validation Rules
    // ---------------------------
    const validatePhoneNumber = (number) => {
        const raw = (number || "").trim();
        if (!raw) return "Phone number is required.";

        const cleaned = raw.replace(/[\s-]/g, "");
        const digitsOnly = cleaned.replace(/^\+/, "").replace(/\D/g, "");
        const isValidLocal = (local) => /^3[0-6]\d{8}$/.test(local);

        // +92XXXXXXXXXX
        if (/^\+92/.test(cleaned)) {
            if (digitsOnly.length !== 12)
                return "Use +923XXXXXXXXX (country code +92 + 10 digits).";
            const local = digitsOnly.slice(2);
            if (!isValidLocal(local))
                return "Invalid Pakistani mobile number after country code.";
            return "";
        }

        // 0092XXXXXXXXXX
        if (/^0092/.test(cleaned)) {
            if (digitsOnly.length !== 14)
                return "Use 00923XXXXXXXXX (00 92 + 10 digits).";
            const after00 = digitsOnly.slice(2);
            const local = after00.slice(2);
            if (!isValidLocal(local))
                return "Invalid Pakistani mobile number after country code.";
            return "";
        }

        // National format starting with 0
        if (/^0/.test(cleaned)) {
            const digits = cleaned.replace(/\D/g, "");
            if (digits.length !== 11)
                return "National numbers must be 11 digits (e.g., 03XXXXXXXXX).";
            if (!/^03[0-6]\d{8}$/.test(digits))
                return "Invalid national mobile number. Must start with 03 and valid operator code.";
            return "";
        }

        // Local without trunk: 10 digits starting with 3
        if (/^3/.test(cleaned)) {
            const digits = cleaned.replace(/\D/g, "");
            if (digits.length !== 10)
                return "Local number must be 10 digits (e.g., 3XXXXXXXXX) or use 03XXXXXXXXX / +923XXXXXXXXX.";
            if (!isValidLocal(digits))
                return "Invalid local mobile number. Must start with 3 and a valid operator code (3[0-6]...).";
            return "";
        }

        return "Invalid phone number format. Use 03XXXXXXXXX or +923XXXXXXXXX (spaces/dashes allowed).";
    };

    const validateCNIC = (id) => {
        const raw = (id || "").trim();
        if (!raw) return "CNIC is required.";

        if (!/^\d{13}$/.test(raw)) {
            return "CNIC must be exactly 13 digits.";
        }

        if (/^(\d)\1{12}$/.test(raw))
            return "CNIC cannot contain the same digit repeated.";

        const segmentI = raw.slice(0, 5);
        const segmentII = raw.slice(5, 12);
        const segmentIII = raw.slice(12);

        const provinceDigit = segmentI.charAt(0);
        if (!/^[1-8]$/.test(provinceDigit)) {
            return "CNIC must start with a valid province code (1-8).";
        }

        if (/^0+$/.test(segmentII)) {
            return "CNIC middle segment appears invalid.";
        }

        if (!/^[0-9]$/.test(segmentIII)) {
            return "Invalid CNIC check digit.";
        }

        return "";
    };

    const validateLocation = (loc) => {
        if (!loc.trim()) return "Location is required. Tap to detect.";
        return "";
    };

    const validateForm = () => {
        let isValid = true;

        const phError = validatePhoneNumber(phoneNumber);
        setPhoneError(phError);
        if (phError) isValid = false;

        const idError = validateCNIC(cnic);
        setCnicError(idError);
        if (idError) isValid = false;

        const locError = validateLocation(location);
        setLocationError(locError);
        if (locError) isValid = false;

        return isValid;
    };

    const handleLocationDetection = async () => {
        if (isLoading || isDetectingLocation) return;
        
        setLocationError("");
        setIsDetectingLocation(true);

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    "Permission Denied",
                    "Please enable location permissions in your device settings to use this feature.",
                    [{ text: "OK" }]
                );
                setIsDetectingLocation(false);
                return;
            }

            const locationResult = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 20000,
            });

            const { latitude, longitude } = locationResult.coords;
            
            const address = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            let locationString = "";
            
            if (address && address[0]) {
                const addr = address[0];
                const city = addr.city || addr.region || addr.subregion || "";
                const country = addr.country || "";
                
                if (city && country) {
                    locationString = `${city}, ${country}`;
                } else if (city) {
                    locationString = city;
                } else if (country) {
                    locationString = country;
                } else {
                    locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                }
            } else {
                locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }

            setLocation(locationString);
            Alert.alert("Location Detected", `Your location: ${locationString}`);

        } catch (error) {
            console.error('Location error:', error);
            
            let errorMessage = "Failed to detect location. ";
            
            if (error.message.includes("timeout")) {
                errorMessage += "Location request timed out.";
            } else if (error.message.includes("permission")) {
                errorMessage += "Location permission denied.";
            } else if (error.message.includes("network")) {
                errorMessage += "Network error occurred.";
            } else {
                errorMessage += "Please try again.";
            }
            
            Alert.alert(
                "Location Error",
                errorMessage,
                [{ text: "OK" }]
            );
        } finally {
            setIsDetectingLocation(false);
        }
    };

    // ----------------------------------------------------
    // SAVE HANDLER - FIXED for location_coords column
    // ----------------------------------------------------
    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert(
                "Validation Failed",
                "Please correct the highlighted errors."
            );
            return;
        }

        setIsLoading(true);

        try {
            const profileId = await AsyncStorage.getItem('currentProfileId');
            if (!profileId) {
                Alert.alert("Error", "Could not find profile ID. Please ensure Step 1 was completed.");
                setIsLoading(false);
                return;
            }

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session || !session.access_token) {
                Alert.alert("Auth Error", "User session expired or not found.");
                setIsLoading(false);
                return;
            }

            // FIXED: Save to location_coords column
            const payload = {
                mobile_number: phoneNumber, 
                cnic_number: cnic,
                location_coords: location, // ✅ CORRECT: Using location_coords
                profile_completed_step: 2,
            };

            console.log('Saving contact info with payload:', payload);

            const url = `${REST_API_URL}?id=eq.${profileId}`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: API_HEADERS(session.access_token),
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log('✅ Contact info successfully updated.');
                navigation.navigate('ProfessionalInfo');
            } else {
                const errorText = await response.text();
                console.error('❌ REST API Update Error:', response.status, errorText);
                
                let errorMessage = `Could not update contact info (Status: ${response.status}).`;
                
                if (response.status === 400) {
                    errorMessage = "Bad request. Please check your database columns.";
                }
                
                Alert.alert("Save Error", errorMessage);
            }

        } catch (e) {
            console.error('General Save Error:', e);
            Alert.alert("System Error", "An unexpected error occurred during save.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topNav}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.navIcon}
                    disabled={isLoading}
                >
                    <MaterialIcons name="keyboard-arrow-left" size={30} color="#FF7E1D" />
                </TouchableOpacity>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarTrack}>
                        <LinearGradient
                            colors={["#FF7E1D", "#FFD464"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${progress}%` }]}
                        />
                    </View>
                    <Text style={styles.stepText}>
                        Progress:{" "}
                        <Text style={{ fontWeight: "bold", color: "#FF7E1D" }}>
                            Step {currentStep}
                        </Text>{" "}
                        of {totalSteps}
                    </Text>
                </View>

                <View style={styles.navIcon}>
                    <View style={{ width: 30 }} />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient
                            colors={["#FF7E1D", "#FFD464"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradientContainer}
                        >
                            <MaterialIcons name="call" size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Contact Info</Text>
                    </View>

                    {/* 1. Phone Number */}
                    <Text style={styles.inputLabel}>
                        <MaterialIcons name="call" size={16} color="#FF7E1D" /> Phone Number
                    </Text>
                    <TextInput
                        style={[styles.textInput, phoneError && styles.inputErrorBorder]}
                        placeholder="03001234567"
                        value={phoneNumber}
                        onChangeText={(text) => {
                            setPhoneNumber(text);
                            setPhoneError("");
                        }}
                        keyboardType="phone-pad"
                        maxLength={18}
                        onBlur={() => setPhoneError(validatePhoneNumber(phoneNumber))}
                        editable={!isLoading}
                    />
                    {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

                    {/* 2. CNIC */}
                    <Text style={styles.inputLabel}>
                        <MaterialCommunityIcons name="id-card" size={16} color="#FF7E1D" />{" "}
                        CNIC
                    </Text>
                    <TextInput
                        style={[styles.textInput, cnicError && styles.inputErrorBorder]}
                        placeholder="4220112345678"
                        value={cnic}
                        onChangeText={handleCNICChange}
                        keyboardType="number-pad"
                        maxLength={13}
                        onBlur={() => setCnicError(validateCNIC(cnic))}
                        editable={!isLoading}
                    />
                    {cnicError ? <Text style={styles.errorText}>{cnicError}</Text> : null}

                    {/* 3. Location */}
                    <Text style={styles.inputLabel}>
                        <Entypo name="location-pin" size={16} color="#FF7E1D" /> Location
                    </Text>
                    <TouchableOpacity
                        onPress={handleLocationDetection}
                        style={[styles.dateInput, locationError && styles.inputErrorBorder]}
                        disabled={isLoading || isDetectingLocation}
                    >
                        <Text style={location ? styles.dateText : styles.placeholderText}>
                            {location || (isDetectingLocation ? "Detecting location..." : "Tap to detect location")}
                        </Text>
                        <MaterialIcons
                            name={isDetectingLocation ? "location-searching" : "my-location"}
                            size={18}
                            color={location ? "#333" : "#FF7E1D"}
                        />
                    </TouchableOpacity>
                    {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButtonContainer}
                        disabled={isLoading || isDetectingLocation}
                    >
                        <LinearGradient
                            colors={["#FF7E1D", "#FFD464"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.saveButtonGradient, (isLoading || isDetectingLocation) && { opacity: 0.6 }]}
                        >
                            <MaterialIcons name={isLoading ? "cloud-upload" : "check"} size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>
                                {isLoading ? 'Updating...' : 
                                 isDetectingLocation ? 'Detecting Location...' : 
                                 'Save & Continue'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FCF3E7" },
    topNav: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 50,
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    navIcon: { padding: 5 },
    progressBarContainer: { flex: 1, alignItems: "center", marginHorizontal: 10 },
    stepText: { fontSize: 12, color: "#666", marginTop: 4, fontWeight: "500" },
    progressBarTrack: {
        width: "100%",
        height: 6,
        backgroundColor: "#F7E0C1",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: { height: "100%", borderRadius: 3 },

    scrollContent: {
        paddingHorizontal: 20,
        alignItems: "center",
        paddingBottom: 40,
    },
    card: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    iconGradientContainer: {
        padding: 8,
        borderRadius: 10,
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    cardTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },

    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
        marginTop: 10,
        marginBottom: 4,
    },
    textInput: {
        width: "100%",
        height: 45,
        backgroundColor: "#f7f7f7",
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#333",
        borderWidth: 1,
        borderColor: "#f7f7f7",
        fontWeight: "500",
    },
    dateInput: {
        width: "100%",
        height: 45,
        backgroundColor: "#f7f7f7",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#f7f7f7",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
    },
    dateText: { fontSize: 16, color: "#333", fontWeight: "500" },
    placeholderText: { fontSize: 16, color: "#999" },

    inputErrorBorder: { borderColor: "#FF3B30", backgroundColor: "#FFF8F8" },
    errorText: {
        fontSize: 12,
        color: "#FF3B30",
        marginTop: 2,
        marginBottom: 8,
        fontWeight: "500",
    },

    saveButtonContainer: {
        marginTop: 30,
        alignSelf: "flex-start",
        width: "100%",
    },
    saveButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 30,
        shadowColor: "#FF7E1D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 8,
    },
});

export default ContactInfoScreen;