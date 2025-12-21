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
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from '../../supabaseClient';
import { REST_API_URL, API_HEADERS } from "../../config";

const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Other", value: "other" },
];

const maritalStatusOptions = [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
    { label: "Divorced", value: "divorced" },
    { label: "Widowed", value: "widowed" },
];

const ProfileCompletionScreen = ({ navigation, route }) => {
    const currentStep = 1;
    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;

    const [fullName, setFullName] = useState("");
    const [gender, setGender] = useState(null);
    const [dob, setDob] = useState(null);
    const [maritalStatus, setMaritalStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [genderOpen, setGenderOpen] = useState(false);
    const [maritalOpen, setMaritalOpen] = useState(false);

    const [fullNameError, setFullNameError] = useState("");
    const [genderError, setGenderError] = useState("");
    const [dobError, setDobError] = useState("");
    const [maritalStatusError, setMaritalStatusError] = useState("");

    const [showDatePicker, setShowDatePicker] = useState(false);

    React.useEffect(() => {
        const loadPrefilledName = async () => {
            try {
                const storedName = await AsyncStorage.getItem('@temp_user_name');
                if (storedName && !fullName) {
                    setFullName(storedName);
                    await AsyncStorage.removeItem('@temp_user_name');
                }
                
                if (route.params?.prefilledName && !fullName) {
                    setFullName(route.params.prefilledName);
                }
            } catch (error) {
                console.log('Error loading pre-filled name:', error);
            }
        };
        
        loadPrefilledName();
    }, []);

    const validateFullName = (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return "Full name is required.";
        if (trimmedName.length < 2)
            return "Name must be at least 2 characters long.";
        if (trimmedName.length > 100)
            return "Name must be at most 100 characters long.";
        const allowedRegex = /^[a-zA-Z\s\-'.]+$/;
        if (!allowedRegex.test(trimmedName))
            return "Name contains invalid characters. Allowed: letters, spaces, hyphen, apostrophe, period.";
        if (/\s\s+/.test(trimmedName))
            return "Please avoid multiple consecutive spaces.";
        const nameParts = trimmedName
            .split(/\s+/)
            .filter((part) => part.length > 0);
        if (nameParts.length < 2)
            return "Please enter your full name (first and last name).";
        return "";
    };

    const validateForm = () => {
        let isValid = true;
        const nameError = validateFullName(fullName);
        setFullNameError(nameError);
        if (nameError) isValid = false;

        if (!gender) {
            setGenderError("Please select your gender.");
            isValid = false;
        } else {
            setGenderError("");
        }

        if (!dob) {
            setDobError("Date of Birth is required.");
            isValid = false;
        } else {
            const today = new Date();
            const minAgeDate = new Date(
                today.getFullYear() - 18,
                today.getMonth(),
                today.getDate()
            );
            const maxAgeDate = new Date(
                today.getFullYear() - 80,
                today.getMonth(),
                today.getDate()
            );

            if (dob > minAgeDate) {
                setDobError("You must be at least 18 years old.");
                isValid = false;
            } else if (dob < maxAgeDate) {
                setDobError("Age must be less than or equal to 80 years.");
                isValid = false;
            } else {
                setDobError("");
            }
        }

        if (!maritalStatus) {
            setMaritalStatusError("Please select your marital status.");
            isValid = false;
        } else {
            setMaritalStatusError("");
        }

        return isValid;
    };

    const formatDate = (date) => {
        if (!date) return "";
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || dob;
        setShowDatePicker(Platform.OS === "ios");
        if (currentDate) {
            setDob(currentDate);
            setDobError("");
        }
    };
    const today = new Date();
    const maxDob = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
    );
    const minDob = new Date(
        today.getFullYear() - 80,
        today.getMonth(),
        today.getDate()
    );

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
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session || !session.access_token) {
                Alert.alert(
                    "Authentication Error",
                    "User session expired or not found. Please log in again."
                );
                setIsLoading(false);
                return;
            }

            const userRole = session.user.user_metadata?.user_role || 'filler';
            console.log("User role detected:", userRole);

            const formattedDobString = dob.toISOString().split("T")[0];

            const payload = {
                user_id: session.user.id,
                full_name: fullName.trim(),
                gender: gender,
                date_of_birth: formattedDobString,
                marital_status: maritalStatus,
                user_role: userRole,
                profile_completed_step: 1,
            };

            console.log('Saving profile with payload:', payload);

            const response = await fetch(`${REST_API_URL}?select=id`, {
                method: "POST",
                headers: API_HEADERS(session.access_token),
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();

                if (data && data.length > 0 && data[0].id) {
                    const profileId = data[0].id;

                    await AsyncStorage.setItem("currentProfileId", profileId.toString());
                    
                    // ✅ FIXED: Navigate based on user role
                    if (userRole === 'creator') {
                        navigation.navigate("ContactInfo", {
                            shouldAwardBonus: true,
                            userRole: 'creator',
                            comingFrom: 'creator_profile'
                        });
                    } else {
                        navigation.navigate("ContactInfo", {
                            shouldAwardBonus: true,
                            userRole: 'filler',
                            comingFrom: 'filler_profile'
                        });
                    }
                    
                } else {
                    Alert.alert(
                        "API Error",
                        "Profile was saved but no ID was returned."
                    );
                }
            } else {
                const errorText = await response.text();
                console.error("REST API Insert Error:", response.status, errorText);
                Alert.alert(
                    "Save Error",
                    `Could not save basic info (Status: ${response.status}).`
                );
            }
        } catch (e) {
            console.error("General Save Error:", e);
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
                            <MaterialIcons name="person" size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Basic Info</Text>
                    </View>

                    <Text style={styles.inputLabel}>
                        <MaterialIcons name="person-outline" size={16} color="#FF7E1D" />{" "}
                        Full Name
                    </Text>
                    <TextInput
                        style={[
                            styles.textInput,
                            fullNameError && styles.inputErrorBorder,
                            { zIndex: genderOpen || maritalOpen ? 1 : 10 },
                        ]}
                        placeholder="e.g., Jane Doe"
                        value={fullName}
                        onChangeText={(text) => {
                            setFullName(text);
                            setFullNameError("");
                        }}
                        onBlur={() => setFullNameError(validateFullName(fullName))}
                        editable={!isLoading}
                    />
                    {fullNameError ? (
                        <Text style={styles.errorText}>{fullNameError}</Text>
                    ) : null}

                    <Text style={styles.inputLabel}>
                        <MaterialCommunityIcons
                            name="gender-male-female"
                            size={16}
                            color="#FF7E1D"
                        />{" "}
                        Gender
                    </Text>
                    <DropDownPicker
                        open={genderOpen}
                        value={gender}
                        items={genderOptions}
                        setOpen={setGenderOpen}
                        setValue={setGender}
                        onOpen={() => setMaritalOpen(false)}
                        placeholder="Select gender"
                        style={[
                            styles.dropdownStyle,
                            genderError && styles.inputErrorBorder,
                        ]}
                        containerStyle={{ height: 48, zIndex: 30 }}
                        textStyle={styles.dropdownText}
                        dropDownContainerStyle={styles.customDropDownContainer}
                        listItemContainerStyle={styles.listItemContainer}
                        placeholderStyle={styles.placeholderText}
                        listMode="SCROLLVIEW"
                        zIndex={30}
                        onChangeValue={() => setGenderError("")}
                        scrollViewProps={{
                            showsVerticalScrollIndicator: true,
                            indicatorStyle: Platform.OS === "ios" ? "black" : undefined,
                            thumbColor: "#FF7E1D",
                        }}
                        disabled={isLoading}
                    />
                    {genderError ? (
                        <Text style={styles.errorText}>{genderError}</Text>
                    ) : null}

                    <Text style={styles.inputLabel}>
                        <MaterialIcons name="date-range" size={16} color="#FF7E1D" /> Date
                        of Birth
                    </Text>
                    <TouchableOpacity
                        onPress={() => !isLoading && setShowDatePicker(true)}
                        style={[
                            styles.dateInput,
                            dobError && styles.inputErrorBorder,
                            { zIndex: 20 },
                        ]}
                        disabled={isLoading}
                    >
                        <Text style={dob ? styles.dateText : styles.placeholderText}>
                            {dob ? formatDate(dob) : "mm/dd/yyyy"}
                        </Text>
                        <MaterialIcons
                            name="calendar-today"
                            size={18}
                            color={dob ? "#333" : "#999"}
                        />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dob || maxDob}
                            mode="date"
                            display="spinner"
                            onChange={handleDateChange}
                            maximumDate={maxDob}
                            minimumDate={minDob}
                            textColor="#333"
                        />
                    )}
                    {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

                    <Text style={styles.inputLabel}>
                        <MaterialIcons name="favorite-border" size={16} color="#FF7E1D" />{" "}
                        Marital Status
                    </Text>
                    <DropDownPicker
                        open={maritalOpen}
                        value={maritalStatus}
                        items={maritalStatusOptions}
                        setOpen={setMaritalOpen}
                        setValue={setMaritalStatus}
                        onOpen={() => setGenderOpen(false)}
                        placeholder="Select status"
                        style={[
                            styles.dropdownStyle,
                            maritalStatusError && styles.inputErrorBorder,
                        ]}
                        containerStyle={{ height: 48, zIndex: 20 }}
                        textStyle={styles.dropdownText}
                        dropDownContainerStyle={styles.customDropDownContainer}
                        listItemContainerStyle={styles.listItemContainer}
                        placeholderStyle={styles.placeholderText}
                        listMode="SCROLLVIEW"
                        zIndex={20}
                        onChangeValue={() => setMaritalStatusError("")}
                        scrollViewProps={{
                            showsVerticalScrollIndicator: true,
                            indicatorStyle: Platform.OS === "ios" ? "black" : undefined,
                            thumbColor: "#FF7E1D",
                        }}
                        disabled={isLoading}
                    />
                    {maritalStatusError ? (
                        <Text style={styles.errorText}>{maritalStatusError}</Text>
                    ) : null}

                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButtonContainer}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={["#FF7E1D", "#FFD464"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.saveButtonGradient, isLoading && { opacity: 0.6 }]}
                        >
                            <MaterialIcons
                                name={isLoading ? "cloud-upload" : "check"}
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.saveButtonText}>
                                {isLoading ? "Saving..." : "Save & Continue"}
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
    dropdownStyle: {
        backgroundColor: "#f7f7f7",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#f7f7f7",
        minHeight: 45,
        paddingHorizontal: 15,
    },
    dropdownText: { fontSize: 16, fontWeight: "500", color: "#333" },
    customDropDownContainer: {
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 0,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        overflow: "hidden",
    },
    listItemContainer: {
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
        paddingHorizontal: 15,
        paddingVertical: 10,
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

export default ProfileCompletionScreen;