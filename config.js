// config.js

// ============================================
// 🔐 SUPABASE CONFIGURATION
// ============================================

// ⚠️ IMPORTANT: Your Supabase project credentials
export const SUPABASE_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co'; 
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4';

// ============================================
// 📊 REST API ENDPOINTS
// ============================================

// Base REST API URL
export const REST_API_BASE_URL = `${SUPABASE_URL}/rest/v1`;

// Table-specific URLs
export const USER_PROFILES_API_URL = `${REST_API_BASE_URL}/user_profiles`;
export const SURVEY_RESPONSES_API_URL = `${REST_API_BASE_URL}/survey_responses`;
export const SURVEYS_API_URL = `${REST_API_BASE_URL}/surveys`;

// For backward compatibility (if old code uses this)
export const REST_API_URL = USER_PROFILES_API_URL;

// ============================================
// 🔑 AUTH & API HEADERS
// ============================================

/**
 * Generate headers for REST API requests
 * @param {string} accessToken - Supabase auth access token
 * @returns {Object} Headers object for fetch requests
 */
export const API_HEADERS = (accessToken) => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Prefer': 'return=representation', // Returns the inserted/updated data
});

/**
 * Headers for public requests (no auth required)
 */
export const PUBLIC_API_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
};

/**
 * Headers for POST requests with specific preferences
 */
export const API_HEADERS_POST = (accessToken) => ({
    ...API_HEADERS(accessToken),
    'Prefer': 'return=representation, resolution=merge-duplicates',
});

/**
 * Headers for PATCH/UPDATE requests
 */
export const API_HEADERS_PATCH = (accessToken) => ({
    ...API_HEADERS(accessToken),
    'Prefer': 'return=representation',
});

// ============================================
// 📱 APP CONFIGURATION
// ============================================

// App constants
export const APP_CONFIG = {
    // Survey configuration
    MAX_MAIN_CATEGORIES: 3,
    MAX_SUB_CATEGORIES: 2,
    PROFILE_COMPLETION_REWARD: 50, // Rs 50 award
    
    // Validation constants
    MIN_PASSWORD_LENGTH: 13,
    MAX_PROFILE_NAME_LENGTH: 100,
    
    // API settings
    API_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
};

// ============================================
// 🗺️ ROUTES & NAVIGATION
// ============================================

// Screen names for navigation
export const SCREENS = {
    // Auth Screens
    SIGN_IN: 'SignIn',
    SIGN_UP: 'SignUp',
    ROLE_SELECTION: 'RoleSelection',
    FORGOT_PASSWORD: 'ForgotPassword',
    
    // Filler Screens
    FILLER_DASHBOARD: 'FillerDashboard',
    PROFILE_COMPLETION: 'ProfileCompletionScreen',
    CONTACT_INFO: 'ContactInfo',
    PROFESSIONAL_INFO: 'ProfessionalInfo',
    INTEREST_HOBBIES: 'InterestAndHobbies',
    PROFILE_VIEW: 'ProfileViewScreen',
    SURVEY_DETAIL: 'SurveyDetailScreen',
    WALLET: 'WalletScreen',
    
    // Creator Screens
    CREATOR_DASHBOARD: 'CreatorDashboard',
    CREATE_SURVEY: 'CreateSurveyScreen',
};

// ============================================
// 🎨 UI CONSTANTS
// ============================================

export const COLORS = {
    PRIMARY: '#FF7E1D',
    PRIMARY_GRADIENT: ['#FF7E1D', '#FFD464'],
    SECONDARY: '#38C172',
    BACKGROUND: '#FCF3E7',
    TEXT_PRIMARY: '#333333',
    TEXT_SECONDARY: '#666666',
    TEXT_LIGHT: '#999999',
    SUCCESS: '#38C172',
    ERROR: '#FF3B30',
    WARNING: '#FF9500',
    INFO: '#007AFF',
    WHITE: '#FFFFFF',
    CARD_BACKGROUND: '#FFFFFF',
    BORDER: '#E0E0E0',
};

// ============================================
// 🔧 UTILITY FUNCTIONS
// ============================================

/**
 * Check if Supabase is properly configured
 */
export const checkSupabaseConfig = () => {
    if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
        console.error('❌ SUPABASE_URL is not configured!');
        return false;
    }
    
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
        console.error('❌ SUPABASE_ANON_KEY is not configured!');
        return false;
    }
    
    console.log('✅ Supabase configuration is valid');
    return true;
};

/**
 * Get full API URL for a table
 * @param {string} tableName - Name of the table
 * @returns {string} Full API URL
 */
export const getTableApiUrl = (tableName) => {
    return `${REST_API_BASE_URL}/${tableName}`;
};

/**
 * Format error message from API response
 * @param {Response} response - Fetch API response object
 * @returns {Promise<string>} Formatted error message
 */
export const formatApiErrorMessage = async (response) => {
    try {
        const errorData = await response.json();
        return errorData.message || errorData.error_description || `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}: ${response.statusText}`;
    }
};

// ============================================
// 📊 DEFAULT QUERY PARAMETERS
// ============================================

// Common query parameters for different tables
export const QUERY_PARAMS = {
    // For user_profiles
    USER_PROFILE_BY_ID: (userId) => `user_id=eq.${userId}`,
    
    // For surveys
    PUBLISHED_SURVEYS: 'is_draft=eq.false&is_public_form=eq.true&status=eq.published',
    
    // For survey_responses
    USER_RESPONSES: (userId) => `user_id=eq.${userId}`,
    
    // Common select patterns
    SELECT_ALL: 'select=*',
    SELECT_ID: 'select=id',
    SELECT_MINIMAL: 'select=id,created_at',
};

// ============================================
// 🛡️ SECURITY & VALIDATION
// ============================================

// Password validation regex patterns
export const VALIDATION_PATTERNS = {
    PASSWORD: {
        UPPERCASE: /[A-Z]/,
        LOWERCASE: /[a-z]/,
        NUMBER: /[0-9]/,
        SYMBOL: /[!@#$%^&*\.]/,
        MIN_LENGTH: 13,
        MAX_LENGTH: 128,
    },
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PK: /^03[0-46]\d{8}$/, // Pakistani mobile numbers
    CNIC: /^\d{5}-\d{7}-\d{1}$|^\d{13}$/, // CNIC with or without hyphens
    NAME: /^[A-Za-z\s\-\'.]{2,100}$/,
};

// Blacklisted/common passwords (for client-side validation)
export const PASSWORD_BLACKLIST = [
    'password', '123456', '123456789', 'qwerty', 'admin', 'welcome',
    'password123', '12345678', '1234567', '123123', '000000',
];

// ============================================
// 📱 ENVIRONMENT CONFIGURATION
// ============================================

// Determine environment
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Environment-specific configurations
export const ENV_CONFIG = {
    development: {
        LOG_API_CALLS: true,
        LOG_NETWORK_ERRORS: true,
        API_TIMEOUT: 30000,
    },
    production: {
        LOG_API_CALLS: false,
        LOG_NETWORK_ERRORS: true,
        API_TIMEOUT: 15000,
    },
    test: {
        LOG_API_CALLS: true,
        LOG_NETWORK_ERRORS: true,
        API_TIMEOUT: 5000,
    },
};

// Current environment config
export const CURRENT_ENV_CONFIG = ENV_CONFIG[ENVIRONMENT] || ENV_CONFIG.development;

// Export a default object for easy imports
const config = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    REST_API_BASE_URL,
    USER_PROFILES_API_URL,
    SURVEY_RESPONSES_API_URL,
    SURVEYS_API_URL,
    API_HEADERS,
    PUBLIC_API_HEADERS,
    APP_CONFIG,
    SCREENS,
    COLORS,
    checkSupabaseConfig,
    getTableApiUrl,
    formatApiErrorMessage,
    QUERY_PARAMS,
    VALIDATION_PATTERNS,
    ENVIRONMENT,
    CURRENT_ENV_CONFIG,
};

export default config;