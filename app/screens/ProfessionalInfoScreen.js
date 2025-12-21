import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Alert, 
    Platform,
    TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { supabase } from '../../supabaseClient'; 
import { REST_API_URL, API_HEADERS } from '../../config';

// Education Levels
const educationLevels = [
    'Matric/O-Levels', 
    'Intermediate/A-Levels', 
    'Bachelors', 
    'Masters', 
    'PhD'
];

// Common Majors
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

// Professions
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
    const [monthlyIncome, setMonthlyIncome] = useState(0); // ✅ CRITICAL: This must be defined
    const [education, setEducation] = useState('');
    const [major, setMajor] = useState('');
    const [profession, setProfession] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Dropdown states
    const [showEducationDropdown, setShowEducationDropdown] = useState(false);
    const [showMajorDropdown, setShowMajorDropdown] = useState(false);
    const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
    
    // Error states
    const [educationError, setEducationError] = useState('');
    const [professionError, setProfessionError] = useState('');
    
    // ========== HELPER FUNCTIONS ==========
    const formatIncome = (amount) => {
        if (!amount || amount === 0) return "Not provided";
        return `Rs ${amount.toLocaleString()}`;
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
            
            // Prepare data - monthly_income is your database column
            const profileData = {
                education: education,
                major: major || null,
                profession: profession,
                monthly_income: monthlyIncome, // ✅ This maps to monthly_income column in Supabase
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
            {/* Progress Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} disabled={isLoading}>
                    <MaterialIcons name="arrow-back" size={30} color="#FF7E1D" />
                </TouchableOpacity>
                
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            style={[styles.progressFill, { width: `${progress}%` }]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        Step {currentStep} of {totalSteps}
                    </Text>
                </View>
                
                <View style={{ width: 30 }} />
            </View>
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            style={styles.headerIcon}
                        >
                            <MaterialIcons name="work" size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Professional Information</Text>
                    </View>
                    
                    {/* Education Section */}
                    <Text style={styles.sectionLabel}>
                        <MaterialCommunityIcons name="school" size={16} color="#FF7E1D" /> Education Level
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.dropdown, educationError ? styles.errorBorder : null]}
                        onPress={() => {
                            setShowEducationDropdown(!showEducationDropdown);
                            setShowMajorDropdown(false);
                            setShowProfessionDropdown(false);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={education ? styles.dropdownText : styles.placeholder}>
                            {education || "Select education level"}
                        </Text>
                        <MaterialIcons 
                            name={showEducationDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                    {educationError ? <Text style={styles.errorText}>{educationError}</Text> : null}
                    
                    {showEducationDropdown && (
                        <ScrollView style={styles.dropdownList}>
                            {educationLevels.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setEducation(item);
                                        setShowEducationDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item}</Text>
                                    {education === item && (
                                        <MaterialIcons name="check" size={20} color="#FF7E1D" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    
                    {/* Major Section */}
                    <Text style={styles.sectionLabel}>
                        <MaterialIcons name="class" size={16} color="#FF7E1D" /> Major (Optional)
                    </Text>
                    
                    <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => {
                            setShowMajorDropdown(!showMajorDropdown);
                            setShowEducationDropdown(false);
                            setShowProfessionDropdown(false);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={major ? styles.dropdownText : styles.placeholder}>
                            {major || "Select major"}
                        </Text>
                        <MaterialIcons 
                            name={showMajorDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                    
                    {showMajorDropdown && (
                        <ScrollView style={styles.dropdownList}>
                            {commonMajors.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setMajor(item);
                                        setShowMajorDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item}</Text>
                                    {major === item && (
                                        <MaterialIcons name="check" size={20} color="#FF7E1D" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    
                    {/* Profession Section */}
                    <Text style={styles.sectionLabel}>
                        <MaterialIcons name="work" size={16} color="#FF7E1D" /> Profession
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.dropdown, professionError ? styles.errorBorder : null]}
                        onPress={() => {
                            setShowProfessionDropdown(!showProfessionDropdown);
                            setShowEducationDropdown(false);
                            setShowMajorDropdown(false);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={profession ? styles.dropdownText : styles.placeholder}>
                            {profession || "Select profession"}
                        </Text>
                        <MaterialIcons 
                            name={showProfessionDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                    {professionError ? <Text style={styles.errorText}>{professionError}</Text> : null}
                    
                    {showProfessionDropdown && (
                        <ScrollView style={[styles.dropdownList, { maxHeight: 200 }]}>
                            {professions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setProfession(item);
                                        setShowProfessionDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{item}</Text>
                                    {profession === item && (
                                        <MaterialIcons name="check" size={20} color="#FF7E1D" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    
                    {/* Monthly Income Section */}
                    <Text style={styles.sectionLabel}>
                        <Text style={{ color: '#FF7E1D', fontWeight: 'bold' }}>Rs</Text> Monthly Income (PKR)
                    </Text>
                    
                    <View style={styles.incomeContainer}>
                        <Text style={styles.incomeValue}>
                            {formatIncome(monthlyIncome)}
                        </Text>
                        <Text style={styles.incomeSubtext}>
                            {monthlyIncome === 0 ? "Slide to set income" : "per month"}
                        </Text>
                    </View>
                    
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={500000}
                        step={10000}
                        value={monthlyIncome}
                        onValueChange={setMonthlyIncome}
                        minimumTrackTintColor="#FF7E1D"
                        maximumTrackTintColor="#F7E0C1"
                        thumbTintColor="#FF7E1D"
                        disabled={isLoading}
                    />
                    
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Rs 0</Text>
                        <Text style={styles.sliderLabel}>Rs 500,000</Text>
                    </View>
                    
                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            style={[styles.saveGradient, isLoading && { opacity: 0.7 }]}
                        >
                            <MaterialIcons 
                                name={isLoading ? "hourglass-empty" : "check-circle"} 
                                size={22} 
                                color="#fff" 
                            />
                            <Text style={styles.saveText}>
                                {isLoading ? 'Saving...' : 'Save & Continue'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 3,
    },
    progressContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    progressBar: {
        width: '100%',
        height: 6,
        backgroundColor: '#F7E0C1',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
        marginBottom: 8,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    placeholder: {
        fontSize: 16,
        color: '#999',
        flex: 1,
    },
    errorBorder: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF8F8',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 10,
    },
    dropdownList: {
        maxHeight: 150,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        marginTop: 5,
        marginBottom: 10,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f8f8',
    },
    dropdownItemText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    incomeContainer: {
        alignItems: 'center',
        marginVertical: 15,
    },
    incomeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF7E1D',
    },
    incomeSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#999',
    },
    saveButton: {
        marginTop: 30,
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 25,
    },
    saveText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ProfessionalInfoScreen;