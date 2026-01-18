import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

// --------------------------------------------------------------
// 🔹 REUSABLE PLAN CARD — SQUARE DESIGN
// --------------------------------------------------------------
const PlanCard = ({ title, subtitle, price, responses, buttonText, gradient, iconColor, badge, isSelected, onSelect, buttonGradient }) => {
    return (
        <TouchableOpacity 
            style={[
                styles.cardOuterWrapper,
                isSelected && styles.selectedCard
            ]} 
            onPress={onSelect}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardContainer}
            >
                {badge && (
                    <View style={styles.badgeBox}>
                        <Text style={styles.badgeText}>🔥 Popular</Text>
                    </View>
                )}

                {/* Top Row: Icon and Title */}
                <View style={styles.topRow}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
                        <MaterialCommunityIcons name="chart-bar" size={26} color={iconColor} />
                    </View>
                    
                    <View style={styles.titleSection}>
                        <Text style={styles.cardTitle}>{title}</Text>
                        <Text style={styles.cardSubtitle} numberOfLines={2}>{subtitle}</Text>
                    </View>
                    
                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <MaterialIcons name="check-circle" size={20} color="#FF7E1D" />
                        </View>
                    )}
                </View>

                {/* Middle: Price and Responses */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>PKR {price}</Text>
                    <Text style={styles.responsesText}>for {responses} responses</Text>
                </View>

                {/* Button at Bottom */}
                <LinearGradient
                    colors={buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                >
                    <TouchableOpacity 
                        style={styles.selectBtn}
                        onPress={onSelect}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.selectBtnText}>
                            {isSelected ? 'Selected' : buttonText}
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// --------------------------------------------------------------
// 🔹 CUSTOM PLAN CARD — SQUARE
// --------------------------------------------------------------
const CustomPlan = ({ isSelected, onSelect, customResponses, setCustomResponses }) => {
    const cost = customResponses ? parseInt(customResponses) * 2 : 0;

    return (
        <TouchableOpacity 
            style={[
                styles.cardOuterWrapper,
                isSelected && styles.selectedCard
            ]} 
            onPress={onSelect}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={["#ECE7FF", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardContainerCustom}
            >
                {/* Top Row: Icon and Title */}
                <View style={styles.topRow}>
                    <View style={styles.iconCirclePurple}>
                        <MaterialCommunityIcons name="cog" size={26} color="#fff" />
                    </View>
                    
                    <View style={styles.titleSection}>
                        <Text style={styles.cardTitle}>Custom Plan</Text>
                        <Text style={styles.cardSubtitle}>Need a custom number of responses?</Text>
                    </View>
                    
                    {isSelected && (
                        <View style={styles.selectedIndicator}>
                            <MaterialIcons name="check-circle" size={20} color="#7C58FF" />
                        </View>
                    )}
                </View>

                {/* Input Section */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Enter number of responses</Text>
                    <TextInput
                        style={[
                            styles.inputBox,
                            isSelected && styles.inputBoxSelected
                        ]}
                        keyboardType="numeric"
                        placeholder="e.g. 500"
                        placeholderTextColor="#b6b6b6"
                        value={customResponses}
                        onChangeText={(text) => {
                            // ✅ Limit to 6 digits only
                            const numericText = text.replace(/[^0-9]/g, '');
                            if (numericText.length <= 6) {
                                setCustomResponses(numericText);
                            }
                        }}
                        onFocus={onSelect}
                        maxLength={6}
                    />
                    
                    <View style={styles.customPriceRow}>
                        <Text style={styles.priceLabel}>Estimated Cost:</Text>
                        <View style={styles.customPriceDisplay}>
                            <Text style={styles.customPriceText}>PKR {cost || '0'}</Text>
                        </View>
                    </View>
                </View>

                {/* Button at Bottom */}
                <LinearGradient
                    colors={["#7C58FF", "#9D7AFF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                >
                    <TouchableOpacity 
                        style={styles.selectBtn}
                        onPress={onSelect}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.selectBtnText}>
                            {isSelected ? 'Selected' : 'Select Custom'}
                        </Text>
                    </TouchableOpacity>
                </LinearGradient>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// --------------------------------------------------------------
// 🔹 PAYMENT BAR COMPONENT 
// --------------------------------------------------------------
const PaymentBar = ({ selectedPlan, planPrice, onPublish, customResponses, isPublishing }) => {
    // Don't show if no plan is selected
    if (!selectedPlan) return null;

    const getPlanName = () => {
        switch(selectedPlan) {
            case 'basic': return 'Basic Plan';
            case 'standard': return 'Standard Plan';
            case 'premium': return 'Premium Plan';
            case 'custom': return `Custom Plan (${customResponses || 0} responses)`;
            default: return 'Selected Plan';
        }
    };

    return (
        <View style={styles.paymentBarContainerFixed}>
            <View style={styles.paymentBar}>
                <View style={styles.paymentHeader}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                    <Text style={styles.paymentTitle}>Plan Selected ✓</Text>
                </View>
                
                <View style={styles.paymentDetails}>
                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>{getPlanName()}</Text>
                        <Text style={styles.planResponses}>
                            {selectedPlan === 'custom' 
                                ? `${customResponses || 0} responses` 
                                : selectedPlan === 'basic' ? '100 responses' 
                                : selectedPlan === 'standard' ? '300 responses' 
                                : '1000 responses'}
                        </Text>
                    </View>
                    
                    <View style={styles.priceSection}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalAmount}>PKR {planPrice}</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
                    onPress={onPublish}
                    disabled={isPublishing}
                >
                    <LinearGradient
                        colors={["#FF7E1D", "#FFAD33"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.publishGradient}
                    >
                        {isPublishing ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.publishText}>Publishing...</Text>
                            </>
                        ) : (
                            <>
                                <MaterialIcons name="send" size={20} color="#fff" />
                                <Text style={styles.publishText}>Publish Survey</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.securityRow}>
                    <MaterialIcons name="security" size={16} color="#4CAF50" />
                    <Text style={styles.securityText}>
                        Secure payment • Cancel anytime • 24/7 support
                    </Text>
                </View>
            </View>
        </View>
    );
};

// --------------------------------------------------------------
// 🔹 MAIN SCREEN — WITH PERSISTENT PAYMENT BAR
// --------------------------------------------------------------
const ChoosePlanScreen = ({ navigation, route }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [customResponses, setCustomResponses] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    
    // ✅ Get draftId from route params
    const draftId = route.params?.draftId;
    const formData = route.params?.formData || {};

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        if (plan !== 'custom') {
            setCustomResponses('');
        }
    };

    const getSelectedPlanPrice = () => {
        switch(selectedPlan) {
            case 'basic': return 300;
            case 'standard': return 750;
            case 'premium': return 2000;
            case 'custom': 
                const responses = parseInt(customResponses) || 0;
                return responses * 2;
            default: return 0;
        }
    };

    const getSelectedPlanResponses = () => {
        switch(selectedPlan) {
            case 'basic': return 100;
            case 'standard': return 300;
            case 'premium': return 1000;
            case 'custom': 
                return parseInt(customResponses) || 0;
            default: return 100;
        }
    };

    // ✅ FIXED: PUBLISH FUNCTION WITH AUTHENTICATED USER UUID
    const handlePublish = async () => {
        if (!selectedPlan) {
            Alert.alert("Select Plan", "Please select a plan first to publish your survey.");
            return;
        }

        // Validate custom plan
        if (selectedPlan === 'custom') {
            const responses = parseInt(customResponses) || 0;
            if (!responses || responses < 10) {
                Alert.alert("Invalid Responses", "Custom plan must have at least 10 responses.");
                return;
            }
            if (responses > 10000) {
                Alert.alert("Limit Exceeded", "Maximum 10,000 responses allowed for custom plan.");
                return;
            }
        }

        setIsPublishing(true);

        try {
            // ✅ FIX: Get current authenticated user
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session?.user) {
                Alert.alert("Session Expired", "Please sign in again.");
                setIsPublishing(false);
                return;
            }

            const currentUserId = session.user.id;
            console.log('🔐 Current User ID:', currentUserId);

            // ✅ Prepare demographic filters correctly
            let demographicFilters = {};
            
            if (!formData.isPublicForm) {
                // Private form - include all selected filters (remove undefined)
                demographicFilters = {
                    gender: formData.demographicFilters?.gender,
                    age: formData.demographicFilters?.age,
                    marital_status: formData.demographicFilters?.maritalStatus,
                    location: formData.demographicFilters?.location,
                    education: formData.demographicFilters?.education,
                    profession: formData.demographicFilters?.profession,
                    salary: formData.demographicFilters?.salary,
                    interests: formData.demographicFilters?.interests || []
                };
            }
            // If isPublicForm = true, demographic_filters should be empty object

            // ✅ Prepare survey data for Supabase
            const surveyData = {
                title: formData.formHeading || "Untitled Survey",
                description: formData.formDescription || "No description",
                category: formData.selectedCategory || "General",
                is_public_form: formData.isPublicForm || false,
                plan: selectedPlan,
                plan_name: selectedPlan === 'basic' ? 'Basic' : 
                         selectedPlan === 'standard' ? 'Standard' : 
                         selectedPlan === 'premium' ? 'Premium' : 'Custom',
                price: getSelectedPlanPrice(),
                total_responses: getSelectedPlanResponses(),
                responses_collected: 0,
                questions: formData.questions || [],
                // ✅ FIX: Save empty object for public forms, filters for private forms
                demographic_filters: formData.isPublicForm ? {} : demographicFilters,
                status: 'published',
                is_draft: false,
                user_id: currentUserId, // ✅ USE REAL USER UUID
                updated_at: new Date().toISOString()
            };

            console.log('🔄 Publishing survey with data:', {
                ...surveyData,
                user_id: currentUserId.substring(0, 8) + '...',
                is_public_form: surveyData.is_public_form,
                demographic_filters: surveyData.demographic_filters
            });
            console.log('📝 Draft ID to update:', draftId);

            let result;
            
            // ✅ FIXED: ALWAYS UPDATE IF WE HAVE DRAFT ID
            if (draftId) {
                console.log('✅ UPDATING existing draft with ID:', draftId);
                
                const { data, error } = await supabase
                    .from('surveys')
                    .update(surveyData)
                    .eq('id', draftId)
                    .select();

                if (error) {
                    console.error('❌ Supabase Update Error:', error);
                    throw new Error(`Failed to publish survey: ${error.message}`);
                }
                
                result = data?.[0];
                console.log('✅ Draft successfully published:', result?.id);
                
            } else {
                // ✅ If no draft ID, insert new
                console.log('➕ INSERTING new published survey (no draft)');
                
                const { data, error } = await supabase
                    .from('surveys')
                    .insert([{
                        ...surveyData,
                        created_at: new Date().toISOString()
                    }])
                    .select();

                if (error) {
                    console.error('❌ Supabase Insert Error:', error);
                    throw new Error(`Failed to publish survey: ${error.message}`);
                }
                
                result = data?.[0];
                console.log('✅ New survey published:', result?.id);
            }

            setIsPublishing(false);
            
            // ✅ SUCCESS MESSAGE
            Alert.alert(
                "Success! 🎉",
                `Your survey "${surveyData.title}" has been published!\n\n✅ Draft removed from drafts section\n✅ Now visible in published surveys`,
                [
                    { 
                        text: "View Published", 
                        onPress: () => {
                            navigation.reset({
                                index: 1,
                                routes: [
                                    { name: 'CreatorDashboard', params: { refresh: true } },
                                    { name: 'PublishedSurveysScreen' }
                                ],
                            });
                        }
                    },
                    {
                        text: "Go to Dashboard",
                        onPress: () => {
                            navigation.navigate('CreatorDashboard', { 
                                refresh: true,
                                message: `Survey "${surveyData.title}" published successfully!`
                            });
                        }
                    }
                ]
            );
            
        } catch (error) {
            setIsPublishing(false);
            console.error('❌ Publish error:', error);
            Alert.alert(
                "Publishing Failed", 
                error.message || "Failed to publish survey. Please try again."
            );
        }
    };

    // Calculate dynamic bottom padding for ScrollView
    const bottomPadding = selectedPlan ? 160 : 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Enhanced Header */}
            <LinearGradient
                colors={["#FF7E1D", "#FFAD33"]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <MaterialIcons name="arrow-back-ios" size={22} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <View style={styles.headerIconBox}>
                            <MaterialCommunityIcons name="chart-bar" size={24} color="#FF7E1D" />
                        </View>
                        <Text style={styles.headerTitle}>Choose Your Plan</Text>
                    </View>

                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={[
                    styles.scrollArea, 
                    { paddingBottom: styles.scrollArea.paddingBottom + bottomPadding }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* ✅ ALL PLANS INCLUDE - TOP PAR (SAME UI AS BEFORE) */}
                <View style={styles.fullWidthItem}>
                    <View style={styles.featuresCard}>
                        <Text style={styles.featuresTitle}>All Plans Include:</Text>
                        <View style={styles.featuresList}>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>Unlimited Questions</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>Real-time Analytics</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>Data Export (CSV/Excel)</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>24/7 Customer Support</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>Mobile Responsive</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.featureText}>Secure Data Storage</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ✅ DIRECTLY SHOW PLANS (NO EXTRA TITLES) */}
                
                {/* Basic Plan */}
                <PlanCard
                    title="Basic Plan"
                    subtitle="Perfect for small surveys and quick feedback"
                    price="300"
                    responses="100"
                    buttonText="Select Basic"
                    gradient={["#F0FDF4", "#E6FDED", "#BBF7D0", "#86EFAC"]}
                    buttonGradient={["#4ADE80", "#13AE66", "#16A34A"]}
                    iconColor="#0F8D45"
                    isSelected={selectedPlan === 'basic'}
                    onSelect={() => handlePlanSelect('basic')}
                />

                {/* Standard Plan */}
                <PlanCard
                    title="Standard Plan"
                    subtitle="Great for growing businesses and medium surveys"
                    price="750"
                    responses="300"
                    buttonText="Select Standard"
                    gradient={["#FFF7ED", "#FFEDD5", "#FED7AA", "#FBBF24"]}
                    buttonGradient={["#FB923C", "#FACC15", "#F97316"]}
                    iconColor="#FF9800"
                    badge
                    isSelected={selectedPlan === 'standard'}
                    onSelect={() => handlePlanSelect('standard')}
                />

                {/* Premium Plan */}
                <PlanCard
                    title="Premium Plan"
                    subtitle="For large-scale surveys and enterprise needs"
                    price="2000"
                    responses="1000"
                    buttonText="Select Premium"
                    gradient={["#FEF2F2", "#FEE2E2", "#FCA5A5", "#F87171"]}
                    buttonGradient={["#F87171", "#EC4899", "#DC2626"]}
                    iconColor="#E91E63"
                    isSelected={selectedPlan === 'premium'}
                    onSelect={() => handlePlanSelect('premium')}
                />

                {/* Custom Plan */}
                <CustomPlan
                    isSelected={selectedPlan === 'custom'}
                    onSelect={() => handlePlanSelect('custom')}
                    customResponses={customResponses}
                    setCustomResponses={setCustomResponses}
                />

                {/* ✅ Simple Note at Bottom */}
                <View style={styles.fullWidthItem}>
                    <View style={styles.notesCard}>
                        <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FF7E1D" />
                        <Text style={styles.notesText}>
                            <Text style={styles.notesBold}>Note:</Text> After publishing, your survey will be live immediately. You can track responses from the Published Surveys section.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Payment Bar - FIXED at the bottom */}
            <PaymentBar 
                selectedPlan={selectedPlan}
                planPrice={getSelectedPlanPrice()}
                onPublish={handlePublish}
                customResponses={customResponses}
                isPublishing={isPublishing}
            />

            {/* Instruction overlay when no plan selected */}
            {!selectedPlan && (
                <View style={styles.instructionOverlay}>
                    <View style={styles.instructionCard}>
                        <MaterialCommunityIcons name="cursor-default-click" size={40} color="#FF7E1D" />
                        <Text style={styles.instructionTitle}>Select a Plan to Continue</Text>
                        <Text style={styles.instructionText}>
                            Choose one of the plans above to proceed with publishing your survey
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

// --------------------------------------------------------------
// 🔹 STYLE UPDATES
// --------------------------------------------------------------
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    headerGradient: {
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerIconBox: {
        width: 40,
        height: 40,
        backgroundColor: "#fff",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#fff",
    },
    placeholder: {
        width: 40,
    },
    scrollArea: {
        padding: 16,
        paddingBottom: 30,
        alignItems: 'center', 
    },
    fullWidthItem: {
        width: '100%',
        paddingHorizontal: 0,
    },
    // Features Card - SAME AS BEFORE
    featuresCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 0,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 10,
    },
    featuresList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '48%',
        marginBottom: 6,
    },
    featureText: {
        fontSize: 12,
        color: "#666",
        marginLeft: 6,
    },
    // Notes Card - SAME AS BEFORE
    notesCard: {
        backgroundColor: "#FFF9E6",
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#FFE8B3",
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notesText: {
        fontSize: 13,
        color: "#664D00",
        lineHeight: 18,
        marginLeft: 10,
        flex: 1,
    },
    notesBold: {
        fontWeight: '700',
    },
    cardOuterWrapper: {
        marginBottom: 16,
        borderRadius: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        width: 310, 
    },
    selectedCard: {
        transform: [{ scale: 1.02 }],
        elevation: 6,
        shadowColor: "#FF7E1D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    cardContainer: {
        borderRadius: 20,
        padding: 20,
        paddingBottom: 20,
    },
    cardContainerCustom: {
        borderRadius: 20,
        padding: 20,
        paddingBottom: 20,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8, 
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    iconCirclePurple: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: "#7C58FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    titleSection: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#222",
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: "#666",
        lineHeight: 16,
    },
    selectedIndicator: {
        marginLeft: 8,
    },
    badgeBox: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: "#FF7E1D",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        zIndex: 1,
    },
    badgeText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 11,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 12, 
        marginTop: 8, 
    },
    priceText: {
        fontSize: 28,
        fontWeight: "800",
        color: "#222",
        marginRight: 10,
        marginTop: 0,
    },
    responsesText: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    inputSection: {
        marginBottom: 16,
        marginTop: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#444",
        marginBottom: 6,
    },
    inputBox: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e5e5",
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        color: "#222",
        marginBottom: 12,
    },
    inputBoxSelected: {
        borderColor: "#7C58FF",
        backgroundColor: "#F8F7FF",
    },
    customPriceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    priceLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#444",
    },
    customPriceDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    customPriceText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#7C58FF",
    },
    buttonGradient: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    selectBtn: {
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    selectBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
        textAlign: "center",
    },
    // --- PAYMENT BAR STYLES ---
    paymentBarContainerFixed: { 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 16, 
        backgroundColor: 'transparent', 
        zIndex: 10, 
    },
    paymentBar: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    paymentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#4CAF50",
        marginLeft: 8,
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    planResponses: {
        fontSize: 13,
        color: "#666",
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: "800",
        color: "#FF7E1D",
    },
    publishBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: "#FF7E1D",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        marginBottom: 12,
    },
    publishBtnDisabled: {
        opacity: 0.7,
    },
    publishGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 18,
    },
    publishText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        marginLeft: 8,
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    securityText: {
        fontSize: 11,
        color: "#888",
        marginLeft: 6,
    },
    // Instruction Overlay 
    instructionOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    instructionCard: {
        alignItems: 'center',
        padding: 16,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF7E1D",
        marginTop: 12,
        marginBottom: 6,
    },
    instructionText: {
        fontSize: 13,
        color: "#666",
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default ChoosePlanScreen;