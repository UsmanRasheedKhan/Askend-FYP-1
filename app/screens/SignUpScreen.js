import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
}
from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from '@expo/vector-icons'; 
// ⬅️ Supabase REST API ke liye yeh import zaroori hai
import 'react-native-url-polyfill/auto' 

// ⬅️ AAPKI SUPABASE DETAILS (Only Defined ONCE)
const SUPABASE_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4' 

// IMPORTANT: Path to logo (Ensure this path is correct)
import AskendLogo from "../../assets/images/logo1.png";

// 🛡️ Password Criteria List Component (unchanged)
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

// ----------------------------------------------------
// 🛑 VALIDATION HELPERS
// 🛡️ Blacklist for Profanity/Common Passwords Check
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

// 🛑 Disposable Domain & Reserved Name Blacklist
const DISPOSABLE_DOMAINS = [
    "mailinator.com",
    "tempmail.com",
    "trash-mail.com",
    "guerrillamail.com"
];
const RESERVED_LOCAL_PARTS = [
    "admin", 
    "support", 
    "abuse", 
    "webmaster", 
    "security"
];


// 🔄 Title Case Formatter (For Proper Casing)
const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const SignUpScreen = ({ navigation, route }) => {
    // ⚠️ State Definitions
    const { userRole } = route.params || { userRole: 'filler' }; 
    
    // --- Input States ---
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(""); 
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // --- UI States ---
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmState] = useState(false); 
    
    // 🛑 ERROR STATES
    const [fullNameError, setFullNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState(""); 
    const [passwordMatchError, setPasswordMatchError] = useState("");
    const [phoneNumberError, setPhoneNumberError] = useState(""); 

    const [criteria, setCriteria] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        symbol: false,
    });
    
    // ✅ ADDED: Effect to load name if returning to this screen
    useEffect(() => {
        const checkForStoredName = () => {
            // If user is coming back after profile completion, keep their name
            if (route.params?.preserveName && fullName === "") {
                // Could load from async storage or context here
                console.log("Preserving name from previous session");
            }
        };
        
        checkForStoredName();
    }, [route.params?.preserveName]);
    
    // ----------------------------------------------------
    // 🧠 LOGIC & VALIDATION FUNCTIONS
    
    // 🔑 PASSWORD VALIDATION FUNCTION
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
    
    // 🐛 FIX APPLIED HERE: Removed passwordMatchError from dependency array
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
        checkPasswordStrength(password);
        
        setPasswordError(validatePassword(password)); 
        
        // Password Match Logic
        if (password.length > 0 && confirmPassword.length > 0) {
             if (password === confirmPassword) {
                // Only set if it's currently showing an error
                if(passwordMatchError !== "") setPasswordMatchError(''); 
             } else {
                setPasswordMatchError("Passwords do not match.");
             }
        } else if (confirmPassword.length === 0 && passwordMatchError) {
             // Clear match error if confirm is blanked out
             setPasswordMatchError(''); 
        }

    }, [password, confirmPassword]); // FIXED: Only runs when password inputs change
    
    const isPasswordStrong = Object.values(criteria).every(val => val === true);
    
    // ✅ FULL NAME VALIDATION (as implemented previously)
    const validateFullName = (name) => {
        const MIN_LENGTH = 3;
        const MAX_LENGTH = 50;
        
        const trimmedName = name.trim();
        if (!trimmedName) {
            return "Full Name is required.";
        }
        if (trimmedName.length < MIN_LENGTH) {
            return `Name must be at least ${MIN_LENGTH} characters long.`;
        }
        if (trimmedName.length > MAX_LENGTH) {
            return `Name cannot exceed ${MAX_LENGTH} characters.`;
        }
        const nameRegex = /^[A-Za-z\s-']+$/;
        if (!nameRegex.test(trimmedName)) {
            return "Only letters, spaces, hyphens, or apostrophes are allowed.";
        }
        if (/\s{2,}/.test(trimmedName)) {
            return "Please use only single spaces between words.";
        }
        if (!trimmedName.includes(' ')) {
            return "Please enter your full name (First and Last Name).";
        }
        const lowerName = trimmedName.toLowerCase();
        const isProfane = PROFANITY_BLACKLIST.some(word => lowerName.includes(word));
        if (isProfane) {
            return "This name contains inappropriate content.";
        }

        return ""; 
    };
    
    // 📧 EMAIL VALIDATION FUNCTION
    const validateEmail = (email) => {
        const MIN_LENGTH = 6; 
        const MAX_LENGTH = 100; 
        
        // 1. Required Field & No Leading/Trailing Spaces
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return "Email address is required.";
        
        // 2. Minimum Length & Maximum Length
        if (trimmedEmail.length < MIN_LENGTH || trimmedEmail.length > MAX_LENGTH) {
            return `Email must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`;
        }
        
        // 3. Syntax Check
        const emailRegex = new RegExp(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if (!emailRegex.test(trimmedEmail.toLowerCase())) {
            return "Please enter a valid email address format (e.g., example@domain.com).";
        }
        
        // Parse Local and Domain Parts
        const parts = trimmedEmail.split('@');
        const localPart = parts[0];
        const domain = parts[1];

        // 4. Role/Reserved Names Check (Local Part)
        const lowerLocalPart = localPart.toLowerCase();
        const isReserved = RESERVED_LOCAL_PARTS.some(name => lowerLocalPart === name);
        if (isReserved) {
             return "This is a reserved email address (e.g., admin).";
        }
        
        // 5. Blacklist/Disposable Domain Check
        const lowerDomain = domain.toLowerCase();
        const isDisposable = DISPOSABLE_DOMAINS.some(disposable => lowerDomain.includes(disposable));
        if (isDisposable) {
            return "Disposable email domains are not allowed.";
        }
        
        return "";
    };
    
    // 📞 VALID PAKISTANI PHONE NUMBER VALIDATION
    const validatePhoneNumber = (number) => {
        const trimmedNumber = number.trim();
        
        // Optional field: return empty string if user leaves it blank
        if (!trimmedNumber) { return ""; }
        
        // Regex: /^03[0-46]\d{8}$/ 
        // Enforces: Starts with 03, third digit is [0-46], exactly 11 digits total.
        const phoneRegex = /^03[0-46]\d{8}$/; 
        
        if (!phoneRegex.test(trimmedNumber)) { 
            return "Must be 11 digits (e.g., 03XXXXXXXXX) and start with 030, 031, 032, 033, 034, or 036."; 
        }
        return "";
    };
    
    // --- Handlers ---
    const handleFullNameChange = (text) => { setFullName(text); setFullNameError(validateFullName(text)); };
    const handleEmailChange = (text) => { setEmail(text); setEmailError(validateEmail(text)); };
    const handlePasswordChange = (text) => { 
        setPassword(text); 
    };
    const handleConfirmPasswordChange = (text) => { setConfirmPassword(text); };
    const handlePhoneNumberChange = (text) => { 
        // Only allow numeric input
        const numericText = text.replace(/[^0-9]/g, ''); 
        setPhoneNumber(numericText);
        setPhoneNumberError(validatePhoneNumber(numericText));
    };

    const handleSignUp = async () => {
        // --- 1. Validation Checks ---
        setFullNameError('');
        setEmailError(''); 
        setPasswordError(''); 
        setPasswordMatchError('');
        setPhoneNumberError(''); 
        
        let finalFullNameError = validateFullName(fullName);
        let finalFullName = fullName.trim(); 
        
        if (!finalFullNameError) {
             finalFullName = toTitleCase(finalFullName);
             setFullName(finalFullName); 
        }

        const finalEmailError = validateEmail(email); 
        const finalPasswordError = validatePassword(password); 
        const finalPhoneNumberError = validatePhoneNumber(phoneNumber); 

        let hasError = false;

        if (finalFullNameError) { setFullNameError(finalFullNameError); hasError = true; }
        if (finalEmailError) { setEmailError(finalEmailError); hasError = true; } 
        if (finalPasswordError) { setPasswordError(finalPasswordError); hasError = true; } 
        if (finalPhoneNumberError) { setPhoneNumberError(finalPhoneNumberError); hasError = true; }
        
        if (password !== confirmPassword) { 
            setPasswordMatchError("Passwords do not match."); 
            hasError = true; 
        }
        
        if (!agreedToTerms) { Alert.alert("Error", "Please agree to terms and conditions."); return; }
        
        if (!isPasswordStrong || finalPasswordError) { 
            Alert.alert("Security Requirement", "Please ensure your password meets all the listed security criteria and rules."); 
            return; 
        }
        
        if (hasError) { Alert.alert("Error", "Please correct the highlighted errors in the form."); return; }
        
        setLoading(true);

        // --- 2. SUPABASE REST API SIGN UP (FINAL IMPLEMENTATION) ---
        
        const API_ENDPOINT = `${SUPABASE_URL}/auth/v1/signup`;
        
        // ✅ FIXED: Store name in metadata properly for immediate access
        const userData = {
            email: email.trim(), 
            password: password,
            data: { 
                full_name: finalFullName,  // ✅ This goes to user_metadata
                phone_number: phoneNumber.trim(),
                user_role: userRole  // ✅ Store role for later use
            } 
        };

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json(); 

            if (result.msg && result.msg.includes('already registered')) {
                Alert.alert('Sign Up Failed', 'This email address is already registered.');
            } else if (result.msg || result.error_description) {
                const errorMessage = result.msg || result.error_description || 'An unknown sign up error occurred.';
                Alert.alert('Sign Up Failed', errorMessage);
            } else if (!response.ok) {
                 Alert.alert('Sign Up Failed', `Server Error: ${response.status} - Could not create account.`);
            }
            else {
                // ✅ SUCCESS: Account created with name in metadata
                console.log('User created with metadata:', result.user?.user_metadata);
                
                Alert.alert('Success!', 'Account created! Please check your email to verify and then Sign In.');
                
                // ✅ Store the name temporarily for profile completion
                // You might want to store this in AsyncStorage for the profile completion flow
                try {
                    await AsyncStorage.setItem('@temp_user_name', finalFullName);
                } catch (storageError) {
                    console.log('Could not store name in AsyncStorage:', storageError);
                }
                
                navigation.navigate("SignIn"); 
            }
        } catch (error) {
            console.error("Sign Up Network Error:", error);
            Alert.alert('Sign Up Failed', 'Could not connect to the server. Please check your internet connection.');
        }

        setLoading(false);
    };


    // ----------------------------------------------------
    // 🎨 JSX (View) - UPDATED PASSWORD SECTION

    return(<View style={styles.container}>

{/* ⬅️ BACK BUTTON (MOVED OUTSIDE SCROLLVIEW FOR RELIABILITY) ⬅️ */}
<TouchableOpacity 
    style={styles.fixedBackButton} 
    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} 
    onPress={() => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'RoleSelection' }], 
        });
    }}
>
    <MaterialIcons name="arrow-back" size={30} color="#333" />
</TouchableOpacity>

{/* Decorative Shapes (Always Fixed) */}
<View style={styles.topShape1} /><View style={styles.topShape2} /><View style={styles.bottomShape1} /><View style={styles.bottomShape2} />

{/* ⬇️ Scrollable Content ⬇️ */}
<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
<View style={styles.content}>

<View style={styles.logoContainer}>
<Image source={AskendLogo} style={styles.logoImage} resizeMode="contain"/>
</View>

<Text style={styles.title}>Create Your Account</Text>
<Text style={styles.description}>Join Askend and start earning from surveys!</Text>

{/* Full Name Input with Inline Error */}
<TextInput
style={[styles.input, fullNameError && styles.inputError]}
placeholder="Full Name (e.g., John Doe)"
placeholderTextColor="#999"
autoCapitalize="words"
value={fullName}
onChangeText={handleFullNameChange}
onBlur={() => setFullNameError(validateFullName(fullName))}
/>
{fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

{/* Email Input with Inline Error */}
<TextInput
style={[styles.input, emailError && styles.inputError]}
placeholder="Email Address"
placeholderTextColor="#999"
autoCapitalize="none"
keyboardType="email-address"
value={email}
onChangeText={handleEmailChange}
onBlur={() => setEmailError(validateEmail(email))}
/>
{emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

{/* PASSWORD INPUTS (Unchanged from previous step) */}
<View style={[styles.passwordInputContainer, password.length > 0 ? { marginBottom: 5 } : {}, (passwordMatchError || passwordError) && styles.inputErrorContainer]}
>
<TextInput
style={[styles.inputField, { width: '88%' }]} 
placeholder="Password"
placeholderTextColor="#999"
secureTextEntry={!showPassword} 
value={password}
onChangeText={handlePasswordChange} 
onBlur={() => setPasswordError(validatePassword(password))} 
/>
<TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
<MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={24} color="#999" />
</TouchableOpacity>
</View>
{passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}


{/* Password Strength Indicators (Unchanged) */}
{password.length > 0 && (
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

{/* Confirm Password Input (Unchanged) */}
<View style={[styles.passwordInputContainer, passwordMatchError && styles.inputErrorContainer]}
>
<TextInput
style={[styles.inputField, { width: '88%' }]}
placeholder="Confirm Password"
placeholderTextColor="#999"
secureTextEntry={!showConfirmPassword}
value={confirmPassword}
onChangeText={handleConfirmPasswordChange}
onBlur={() => {
if (password !== confirmPassword && confirmPassword.length > 0) {
setPasswordMatchError("Passwords do not match.");
}
}}
/>
<TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmState(!showConfirmPassword)}>
<MaterialIcons name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={24} color="#999" />
</TouchableOpacity>
</View>
{passwordMatchError ? <Text style={styles.errorText}>{passwordMatchError}</Text> : null}

{/* 📞 Phone Number Input with Inline Error (Validation logic is inside the function) */}
<TextInput
style={[styles.input, phoneNumberError && styles.inputError]}
placeholder="Phone Number (optional)"
placeholderTextColor="#999"
keyboardType="phone-pad"
maxLength={11} // Ensures max 11 digits
value={phoneNumber}
onChangeText={handlePhoneNumberChange} 
onBlur={() => setPhoneNumberError(validatePhoneNumber(phoneNumber))}
/>
{phoneNumberError ? <Text style={styles.errorText}>{phoneNumberError}</Text> : null}

{/* Terms & Conditions Checkbox */}
<View style={styles.termsContainer}>
<TouchableOpacity style={styles.checkboxTouchArea} onPress={() => setAgreedToTerms(!agreedToTerms)}>
<View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
{agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
</View>
</TouchableOpacity>
<Text style={styles.termsText}>I agree to the{" "}<Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}<Text style={styles.termsLink}>Privacy Policy</Text></Text>
</View>

{/* Sign Up Button with Gradient */}
<TouchableOpacity onPress={handleSignUp} disabled={loading || !isPasswordStrong} style={styles.buttonWrapper}>
<LinearGradient
colors={["#FF7E1D", "#FFD464"]}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 0 }}
style={styles.gradientButton}
><Text style={styles.buttonText}>{loading ? "Signing Up..." : "Sign Up"}</Text>
</LinearGradient>
</TouchableOpacity>

{/* Already have an account? Sign In */}
<View style={styles.signInContainer}>
<Text style={styles.signInText}>Already have an account?</Text>
<TouchableOpacity onPress={() => navigation.navigate("SignIn")}><Text style={styles.signInLink}> Sign In</Text></TouchableOpacity>
</View>

{/* Separator for "or continue with" */}
<View style={styles.separatorContainer}>
<View style={styles.separatorLine} />
<Text style={styles.separatorText}>or continue with</Text>
<View style={styles.separatorLine} />
</View>

{/* Google Icon (Social Login) */}
<TouchableOpacity style={styles.socialButton}>
<Image
source={{ uri: "https://img.icons8.com/color/48/000000/google-logo.png" }}
style={styles.socialIcon}
/>
</TouchableOpacity>
</View>
</ScrollView>
</View>);
};

// ----------------------------------------------------
// 🎨 STYLES (MODIFIED)

const styles = StyleSheet.create({
container: { 
flex: 1, 
backgroundColor: "#fff" ,
},
// 🆕 New fixed back button style
fixedBackButton: {
    position: 'absolute', 
    top: 50, 
    left: 20,
    padding: 10,
    zIndex: 100, 
    backgroundColor: 'transparent',
},
scrollContainer: {
flexGrow: 1,
paddingTop: 50, 
paddingBottom: 50,
},
topShape1: {
position: "absolute",
width: 210,
height: 210,
borderRadius: 290,
backgroundColor: "#FF7E1D", 
top: -90,
left: -90,
opacity: 0.25,
zIndex: 1,
},
topShape2: {
position: "absolute",
width: 390,
height: 390,
borderRadius: 190,
backgroundColor: "#E2BE09", 
top: -310,
right: -110,
opacity: 0.25,
zIndex: 1,
},
content: { 
paddingHorizontal: 35, 
zIndex: 5,
backgroundColor: "transparent",
},
logoContainer: { 
    alignItems: "center", 
    marginBottom: 10, 
    marginTop: 0 
}, 
logoImage: {marginBottom:-40, width: 250, height: 150, resizeMode: "contain" },
title: {
fontSize: 28,
fontWeight: "bold",
color: "#333",
textAlign: "center",
marginBottom: 5,
},
description: {
fontSize: 16,
color: "#666",
textAlign: "center",
marginBottom: 20,
},
passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 15, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    paddingHorizontal: 5,
},
inputField: {
    height: '100%',
    paddingHorizontal: 10,
    fontSize: 16,
},
eyeIcon: {
    padding: 5,
},
inputErrorContainer: {
    borderColor: '#FF3333', 
    marginBottom: 5, 
},
input: {
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
},
inputError: {
    borderColor: '#FF3333', 
    marginBottom: 5, 
},
errorText: {
    color: '#FF3333', 
    fontSize: 13,
    marginBottom: 10, 
    paddingLeft: 5,
},
criteriaContainer: {
    marginBottom: 5,
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
termsContainer: {
flexDirection: "row",
alignItems: "flex-start",
marginBottom: 25,
paddingRight: 10,
},
checkboxTouchArea: { paddingRight: 10, paddingVertical: 3 },
checkbox: {
width: 20,
height: 20,
borderWidth: 1,
borderColor: "#ccc",
borderRadius: 4,
justifyContent: "center",
alignItems: "center",
backgroundColor: "#fff",
},
checkboxActive: { backgroundColor: "#FF8C00", borderColor: "#FF8C00" },
checkmark: { color: "#fff", fontSize: 14, fontWeight: "bold" },
termsText: { flex: 1, fontSize: 14, color: "#666", marginTop: 1 },
termsLink: { color: "#FF8C00", fontWeight: "bold" },
buttonWrapper: { borderRadius: 10, marginBottom: 20, elevation: 3 },
gradientButton: { padding: 15, borderRadius: 10, alignItems: "center" },
buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
signInContainer: {
flexDirection: "row",
justifyContent: "center",
marginBottom: 30,
},
signInText: { fontSize: 14, color: "#666" },
signInLink: { fontSize: 14, color: "#FF8C00", fontWeight: "bold" },
separatorContainer: {
flexDirection: "row",
alignItems: "center",
marginBottom: 20,
},
separatorLine: { flex: 1, height: 1, backgroundColor: "#ddd" },
separatorText: {
width: 150,
textAlign: "center",
fontSize: 14,
color: "#999",
},
socialButton: {
alignSelf: "center",
padding: 15,
borderRadius: 50,
backgroundColor: "#fff",
borderWidth: 1,
borderColor: "#ddd",
elevation: 3,
shadowColor: "#000",
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 3,
width: 60,
height: 60,
justifyContent: "center",
alignItems: "center",
},
socialIcon: { width: 30, height: 30 },
});

export default SignUpScreen;