import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

// ⚠️ IMPORTANT: Imports for Supabase (Auth/Session) and REST API configuration
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { supabase } from '../../supabaseClient'; 
// Assume these are correctly defined in your project:
const REST_API_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co/rest/v1/user_profiles'; // Replace with actual URL
const API_HEADERS = (token) => ({ 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4' // Replace with actual API key
});


// --- DATA ---

// Education Levels
const educationLevels = [
    'Matric/O-Levels', 
    'Intermediate/A-Levels', 
    'Bachelors', 
    'Masters', 
    'PhD'
];

// Common Majors List
const commonMajors = [
    'Computer Science', 
    'Electrical Engineering', 
    'Civil Engineering', 
    'Business Administration (BBA)',
    'Accounting & Finance', 
    'Medicine (MBBS)', 
    'Law', 
    'Media Studies', 
    'Psychology', 
    'Economics', 
    'Physics/Chemistry/Biology',
    'Arts & Humanities',
    'Other'
];

// Comprehensive Professions List
const professions = [
    'Student',
    'Self-Employed / Freelancer',
    'Software Engineer / IT Professional',
    'IT Support / Technician',
    'Teacher / Academic',
    'Healthcare Professional (Doctor, Nurse, Pharmacist, etc.)',
    'Healthcare Support (Lab Tech, Paramedic, etc.)',
    'Business Owner / Entrepreneur',
    'Sales and Marketing',
    'Customer Support / Call Center',
    'Retail Worker / Shopkeeper',
    'Accountant / Finance Professional',
    'Banking / Finance (Banker, Teller, Analyst)',
    'Government Employee / Civil Servant',
    'Lawyer / Legal Professional',
    'Journalist / Media Professional',
    'Creative Professional (Designer, Writer, Artist)',
    'Hospitality / Hotel & Restaurant Staff',
    'NGO / Non-profit Worker',
    'Tradesman (Electrician, Plumber, Carpenter, etc.)',
    'Construction Worker',
    'Driver (Taxi / Truck / Ride-hailing)',
    'Pilot / Aviation Professional',
    'Agriculture / Farming',
    'Researcher / Scientist',
    'Consultant',
    'Real Estate / Property Agent',
    'Security Personnel',
    'Logistics / Supply Chain',
    'Manufacturing / Factory Worker',
    'Home-maker / Homemaker',
    'Unemployed',
    'Retired',
    'Other'
];


const ProfessionalInfoScreen = ({ navigation }) => {
    
    const currentStep = 3; 
    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;
    
    // --- State Variables ---
    const [education, setEducation] = useState('');
    const [major, setMajor] = useState(''); 
    const [profession, setProfession] = useState('');
    // Adjusted initial monthlyIncome to a step-friendly value for better UX
    const [monthlyIncome, setMonthlyIncome] = useState(250000); 
    const [isLoading, setIsLoading] = useState(false); 
    
    // Dropdown visibility states
    const [isEducationOpen, setIsEducationOpen] = useState(false);
    const [isMajorOpen, setIsMajorOpen] = useState(false); 
    const [isProfessionOpen, setIsProfessionOpen] = useState(false);
    
    // Conditional visibility state for Major field
    const [isMajorVisible, setIsMajorVisible] = useState(false); 
    
    // Error states
    const [educationError, setEducationError] = useState('');
    const [majorError, setMajorError] = useState(''); 
    const [professionError, setProfessionError] = useState('');
    
    
    // ----------------------------------------------------
    // HELPER FUNCTIONS
    // ----------------------------------------------------

    const formatIncome = (value) => {
        // Formats number as Rs 250,000 (PKR symbol)
        return `Rs ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    // Function to close all dropdowns (used before opening a new one)
    const closeAllDropdowns = () => {
        setIsEducationOpen(false);
        setIsMajorOpen(false);
        setIsProfessionOpen(false);
    };
    
    // ----------------------------------------------------
    // VALIDATION LOGIC 
    // ----------------------------------------------------
    
    const validateForm = () => {
        let isValid = true;
        
        // Education Validation
        if (!education.trim()) {
            setEducationError('Please select your highest education level.');
            isValid = false;
        } else {
            setEducationError('');
        }
        
        // Major Conditional Validation (Only check if Major field is visible)
        if (isMajorVisible && !major.trim()) {
            setMajorError('Please select your major or area of study.');
            isValid = false;
        } else {
            setMajorError('');
        }

        // Profession Validation
        if (!profession.trim()) {
            setProfessionError('Please select your profession.');
            isValid = false;
        } else {
            setProfessionError('');
        }

        return isValid;
    };
    
    // ----------------------------------------------------
    // HANDLERS 
    // ----------------------------------------------------

    const handleSelectOption = (type, value) => {
        if (isLoading) return;

        if (type === 'education') {
            setEducation(value);
            setIsEducationOpen(false); 
            setEducationError('');
            
            // --- Conditional Logic for Major Field ---
            const requiresMajor = value === 'Bachelors' || value === 'Masters' || value === 'PhD';
            setIsMajorVisible(requiresMajor);
            if (!requiresMajor) {
                setMajor(''); // Clear major if not required
                setMajorError('');
            }
        } else if (type === 'major') { 
            setMajor(value);
            setIsMajorOpen(false);
            setMajorError('');
            
        } else if (type === 'profession') {
            setProfession(value);
            setIsProfessionOpen(false); 
            setProfessionError('');
        }
    };

    // ----------------------------------------------------
    // SAVE HANDLER (REST API PATCH)
    // ----------------------------------------------------
    const handleSave = async () => {
        if (!validateForm() || isLoading) {
            if (!isLoading) {
                Alert.alert("Validation Failed", "Please correct the highlighted errors before continuing.");
            }
            return;
        }
        
        setIsLoading(true);

        try {
            // 1. Retrieve the profile ID and access token
            const profileId = await AsyncStorage.getItem('currentProfileId');
            if (!profileId) {
                Alert.alert("Error", "Could not find profile ID. Please complete Step 1 first.");
                setIsLoading(false);
                return;
            }

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session || !session.access_token) {
                Alert.alert("Auth Error", "Session expired or not found. Please log in again.");
                setIsLoading(false);
                return;
            }

            // 2. Prepare the update payload
            // ⭐ FIX: Changed 'education_level' to 'education' to match the user's requested column name
            const payload = {
                education: education, 
                major: isMajorVisible ? major : null, 
                profession: profession,
                monthly_income: monthlyIncome,
                profile_creation_step: 3 
            };
            
            console.log('Payload:', payload);

            // 3. Perform the REST API UPDATE (PATCH request)
            const url = `${REST_API_URL}?id=eq.${profileId}`; 

            const response = await fetch(url, {
                method: 'PATCH',
                headers: API_HEADERS(session.access_token),
                body: JSON.stringify(payload),
            });

            // 4. Handle response 
            if (response.ok) {
                console.log('✅ Professional info successfully updated via REST API.');
                
                // 5. Navigate to the next screen (Step 4: Interests and Hobbies)
                navigation.navigate('InterestAndHobbies');
            } else {
                const errorText = await response.text();
                console.error('🔴 REST API Update Failed Status:', response.status);
                console.error('🔴 Response Body (Supabase Error):', errorText); 

                Alert.alert("Save Error", `Could not update professional info (Status: ${response.status}). Check console for details.`);
            }

        } catch (e) {
            console.error('General Save Error:', e);
            Alert.alert("System Error", "An unexpected error occurred during save. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    // ----------------------------------------------------
    // RENDER 
    // ----------------------------------------------------
    return (
        <View style={styles.container}>
            
            {/* 1. TOP NAVIGATION AND PROGRESS BAR (Step 3/4) */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIcon} disabled={isLoading}>
                    <MaterialIcons name="keyboard-arrow-left" size={30} color="#FF7E1D" />
                </TouchableOpacity>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarTrack}>
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${progress}%` }]}
                        />
                    </View>
                    <Text style={styles.stepText}>
                        Progress: <Text style={{fontWeight: 'bold', color: '#FF7E1D'}}>Step {currentStep}</Text> of {totalSteps}
                    </Text>
                </View>

                <View style={styles.navIcon}>
                    <View style={{ width: 30 }} /> 
                </View>
            </View>
            
            {/* 2. Main Content Scrollable Area */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.card}>
                    
                    <View style={styles.cardHeader}>
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradientContainer}
                        >
                            <MaterialIcons name="info-outline" size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Professional Info</Text>
                    </View>
                    
                    {/* 1. Education Dropdown */}
                    <Text style={styles.inputLabel}>
                        <MaterialCommunityIcons name="school" size={16} color="#FF7E1D" /> Education
                    </Text>
                    <TouchableOpacity 
                        onPress={() => { closeAllDropdowns(); setIsEducationOpen(!isEducationOpen); }} 
                        style={[styles.dropdownInput, educationError && styles.inputErrorBorder]}
                        disabled={isLoading}
                    >
                        <Text style={education ? styles.dropdownText : styles.placeholderText}>
                            {education || "Select highest education level"}
                        </Text>
                        <MaterialIcons 
                            name={isEducationOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={20} 
                            color="#333" 
                        />
                    </TouchableOpacity>
                    {educationError ? <Text style={styles.errorText}>{educationError}</Text> : null}
                    
                    {/* Education Options List (scrollable) */}
                    {isEducationOpen && (
                        <ScrollView 
                            style={styles.optionsContainer} 
                            nestedScrollEnabled={true}
                            indicatorStyle="white" 
                        >
                            {educationLevels.map((level, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    style={styles.optionItem}
                                    onPress={() => handleSelectOption('education', level)}
                                >
                                    <Text style={styles.optionText}>{level}</Text>
                                    {education === level && <MaterialIcons name="check" size={18} color="#FF7E1D" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    
                    
                    
                    
                    {/* 2. Major Dropdown (Conditional) */}
                    {isMajorVisible && (
                        <View style={styles.majorContainer}>
                            <Text style={styles.inputLabel}>
                                <MaterialIcons name="class" size={16} color="#FF7E1D" /> Major
                            </Text>
                            <TouchableOpacity 
                                onPress={() => { closeAllDropdowns(); setIsMajorOpen(!isMajorOpen); }} 
                                style={[styles.dropdownInput, majorError && styles.inputErrorBorder]}
                                disabled={isLoading}
                            >
                                <Text style={major ? styles.dropdownText : styles.placeholderText}>
                                    {major || "Select Major/Area of Study"}
                                </Text>
                                <MaterialIcons 
                                    name={isMajorOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                                    size={20} 
                                    color="#333" 
                                />
                            </TouchableOpacity>
                            {majorError ? <Text style={styles.errorText}>{majorError}</Text> : null}
                        
                            {/* Major Options List (scrollable) */}
                            {isMajorOpen && (
                                <ScrollView 
                                    style={styles.optionsContainer} 
                                    nestedScrollEnabled={true}
                                    indicatorStyle="white" 
                                >
                                    {commonMajors.map((m, index) => (
                                        <TouchableOpacity 
                                            key={index}
                                            style={styles.optionItem}
                                            onPress={() => handleSelectOption('major', m)}
                                        >
                                            <Text style={styles.optionText}>{m}</Text>
                                            {major === m && <MaterialIcons name="check" size={18} color="#FF7E1D" />}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}


                    {/* 3. Profession Dropdown */}
                    <Text style={styles.inputLabel}>
                        <MaterialIcons name="work" size={16} color="#FF7E1D" /> Profession
                    </Text>
                    <TouchableOpacity 
                        onPress={() => { closeAllDropdowns(); setIsProfessionOpen(!isProfessionOpen); }} 
                        style={[styles.dropdownInput, professionError && styles.inputErrorBorder]}
                        disabled={isLoading}
                    >
                        <Text style={profession ? styles.dropdownText : styles.placeholderText}>
                            {profession || "Select Profession"}
                        </Text>
                        <MaterialIcons 
                            name={isProfessionOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={20} 
                            color="#333" 
                        />
                    </TouchableOpacity>
                    {professionError ? <Text style={styles.errorText}>{professionError}</Text> : null}
                    
                    {/* Profession Options List (scrollable) */}
                    {isProfessionOpen && (
                        <ScrollView 
                            style={[styles.optionsContainer, styles.professionOptions]} 
                            nestedScrollEnabled={true}
                            indicatorStyle="white" 
                        >
                            {professions.map((job, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    style={styles.optionItem}
                                    onPress={() => handleSelectOption('profession', job)}
                                >
                                    <Text style={styles.optionText}>{job}</Text>
                                    {profession === job && <MaterialIcons name="check" size={18} color="#FF7E1D" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    
                    
                    
                    
                    {/* 4. Monthly Income Slider */}
                    <Text style={styles.inputLabel}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FF7E1D' }}>Rs</Text> Monthly Income (PKR)
                    </Text>
                    
                    <View style={styles.incomeDisplayContainer}>
                        <Text style={styles.incomeValueText}>
                            {formatIncome(monthlyIncome)}
                        </Text>
                        <Text style={styles.incomeUnitText}>
                            per month
                        </Text>
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={500000} 
                        step={50000} 
                        value={monthlyIncome}
                        onValueChange={setMonthlyIncome}
                        minimumTrackTintColor="#FF7E1D"
                        maximumTrackTintColor="#F7E0C1"
                        thumbTintColor={Platform.select({ ios: '#FF7E1D', android: '#FF7E1D' })}
                        disabled={isLoading}
                    />
                    
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabelText}>Rs0</Text>
                        <Text style={styles.sliderLabelText}>Rs500k+</Text>
                    </View>


                    {/* Save Button */}
                    <TouchableOpacity 
                        onPress={handleSave} 
                        style={styles.saveButtonContainer}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.saveButtonGradient, isLoading && { opacity: 0.6 }]}
                        >
                            <MaterialIcons name={isLoading ? "cloud-upload" : "check"} size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>{isLoading ? 'Updating...' : 'Save & Continue'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
                
            </ScrollView>
        </View>
    );
};

// ----------------------------------------------------
// 🎨 STYLES 
// ----------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF3E7',
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    navIcon: { padding: 5, },
    progressBarContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    stepText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontWeight: '500',
    },
    progressBarTrack: {
        width: '100%',
        height: 6,
        backgroundColor: '#F7E0C1',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    scrollContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconGradientContainer: {
        padding: 8,
        borderRadius: 10,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666', 
        marginTop: 10,
        marginBottom: 4,
    },
    majorContainer: {
        marginTop: 0, 
    },

    // --- Dropdown/Input Styles ---
    dropdownInput: { 
        width: '100%',
        height: 45,
        backgroundColor: '#f7f7f7',
        borderRadius: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: '#f7f7f7', 
        zIndex: 10, 
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    placeholderText: { 
        fontSize: 16,
        color: '#999',
    },
    
    // --- Dropdown Options Container Style (used with ScrollView) ---
    optionsContainer: {
        width: '100%',
        maxHeight: 220, 
        backgroundColor: '#fff',
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 10,
        marginTop: -5, 
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        overflow: 'hidden',
        paddingHorizontal: 5,
        paddingVertical: 5,
        zIndex: 5, 
    },
    professionOptions: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f7f7f7',
    },
    optionText: {
        fontSize: 15,
        color: '#333',
    },

    // --- Income Slider Styles ---
    incomeDisplayContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    incomeValueText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF7E1D', 
    },
    incomeUnitText: {
        fontSize: 14,
        color: '#666',
        marginTop: -5,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -10,
        marginBottom: 10,
    },
    sliderLabelText: {
        fontSize: 14,
        color: '#999',
    },
    
    // --- Validation Styles ---
    inputErrorBorder: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF8F8',
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 2,
        marginBottom: 8,
        fontWeight: '500',
    },
    
    // Save Button Styles
    saveButtonContainer: {
        marginTop: 30,
        alignSelf: 'flex-start',
        width: '100%',
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 30,
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ProfessionalInfoScreen;