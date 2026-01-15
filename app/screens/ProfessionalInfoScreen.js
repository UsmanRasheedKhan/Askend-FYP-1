import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { supabase } from '../../supabaseClient'; 
import { REST_API_URL, API_HEADERS } from '../../config';

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
    
    // ========== STATE VARIABLES ==========
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [education, setEducation] = useState('');
    const [major, setMajor] = useState('');
    const [profession, setProfession] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Dropdown states
    const [isEducationOpen, setIsEducationOpen] = useState(false);
    const [isMajorOpen, setIsMajorOpen] = useState(false);
    const [isProfessionOpen, setIsProfessionOpen] = useState(false);
    
    // Conditional visibility for Major field
    const [isMajorVisible, setIsMajorVisible] = useState(false);
    
    // Error states
    const [educationError, setEducationError] = useState('');
    const [professionError, setProfessionError] = useState('');
    
    // ========== HELPER FUNCTIONS ==========
    const formatIncome = (amount) => {
        if (!amount || amount === 0) return "Not provided";
        return `PKR ${amount.toLocaleString()}`;
    };
    
    const closeAllDropdowns = () => {
        setIsEducationOpen(false);
        setIsMajorOpen(false);
        setIsProfessionOpen(false);
    };
    
    // ========== VALIDATION ==========
    const validateForm = () => {
        let isValid = true;
        
        if (!education.trim()) {
            setEducationError('Please select education level');
            isValid = false;
        } else {
            setEducationError('');
        }
        
        if (!profession.trim()) {
            setProfessionError('Please select profession');
            isValid = false;
        } else {
            setProfessionError('');
        }
        
        return isValid;
    };
    
    // ========== SELECT HANDLERS ==========
    const handleSelectOption = (type, value) => {
        if (isLoading) return;

        if (type === 'education') {
            setEducation(value);
            setIsEducationOpen(false);
            setEducationError('');
            
            // Conditional logic for Major field
            const requiresMajor = value === 'Bachelors' || value === 'Masters' || value === 'PhD';
            setIsMajorVisible(requiresMajor);
            if (!requiresMajor) {
                setMajor('');
            }
        } else if (type === 'major') {
            setMajor(value);
            setIsMajorOpen(false);
        } else if (type === 'profession') {
            setProfession(value);
            setIsProfessionOpen(false);
            setProfessionError('');
        }
    };
    
    // ========== SAVE FUNCTION ==========
    const handleSave = async () => {
        console.log('Saving professional info...');
        console.log('Monthly income value:', monthlyIncome);
        console.log('Type of monthlyIncome:', typeof monthlyIncome);
        
        if (!validateForm()) {
            Alert.alert("Validation Error", "Please fill all required fields");
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Get profile ID
            const profileId = await AsyncStorage.getItem('currentProfileId');
            if (!profileId) {
                Alert.alert("Error", "Profile ID not found. Please complete previous steps.");
                setIsLoading(false);
                return;
            }
            
            // Get session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.access_token) {
                Alert.alert("Session Error", "Please login again");
                setIsLoading(false);
                return;
            }
            
            // Prepare data
            const profileData = {
                education: education,
                major: major || null,
                profession: profession,
                monthly_income: monthlyIncome,
                profile_completed_step: 3
            };
            
            console.log('Sending to Supabase:', profileData);
            
            // Update profile in Supabase
            const response = await fetch(`${REST_API_URL}?id=eq.${profileId}`, {
                method: 'PATCH',
                headers: API_HEADERS(session.access_token),
                body: JSON.stringify(profileData),
            });
            
            if (response.ok) {
                console.log('✅ Profile updated successfully');
                Alert.alert("Success", "Professional information saved!");
                navigation.navigate('InterestAndHobbies');
            } else {
                const errorText = await response.text();
                console.error('❌ Supabase error:', response.status, errorText);
                Alert.alert("Save Error", `Failed to save (${response.status})`);
            }
            
        } catch (error) {
            console.error('Unexpected error:', error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // ========== RENDER ==========
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
                    
                    {/* Education Options List */}
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
                                style={styles.dropdownInput}
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
                        
                            {/* Major Options List */}
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
                    
                    {/* Profession Options List */}
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
                            {monthlyIncome === 0 ? "Slide to set income" : "per month"}
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

// ========== STYLES ==========
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