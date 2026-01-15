import React, { useState, useCallback, memo, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const { width, height } = Dimensions.get('window');

const REST_API_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co/rest/v1/user_profiles'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4';

const MAX_MAIN_CATEGORIES = 3;
const MAX_SUB_CATEGORIES = 2;
const AWARD_AMOUNT = 50;

const INTEREST_DATA = [
    {
        id: 'sports',
        name: 'Sports',
        icon: 'tennis-ball',
        subCategories: ['Cricket', 'Football/Soccer', 'Basketball', 'Tennis', 'Running/Marathon', 'Gym/Weight Training', 'Yoga/Pilates', 'Other Sports'],
    },
    {
        id: 'reading',
        name: 'Reading',
        icon: 'book-open',
        subCategories: ['Fiction', 'Non-Fiction', 'Biography', 'Self-Help', 'Poetry', 'Magazines/News'],
    },
    {
        id: 'art',
        name: 'Arts & Culture',
        icon: 'palette',
        subCategories: [
            'Painting/Drawing',
            'Sculpting',
            'Photography',
            'Graphic Design',
            'Crafting',
            'Music (Instrumental)',
            'Rapping',
            'Beatboxing',
            'Singing/Vocal',
            'Dancing/Choreography',
            'Acting/Theatre'
        ],
    },
    {
        id: 'travel',
        name: 'Travelling',
        icon: 'airplane',
        subCategories: ['Adventure Travel', 'Cultural Trips', 'Road Trips', 'Local Sightseeing', 'Backpacking'],
    },
    {
        id: 'fitness',
        name: 'Fitness',
        icon: 'dumbbell',
        subCategories: ['Aerobics', 'Cardio', 'Weightlifting', 'Hiking', 'Martial Arts'],
    },
    {
        id: 'digital',
        name: 'Digital',
        icon: 'monitor',
        subCategories: ['Gaming', 'Coding/\u00A0Programming', 'Social Media', 'Content Creation', 'Tech Gadgets'],
    },
    {
        id: 'gardening',
        name: 'Gardening',
        icon: 'flower',
        subCategories: ['Indoor Plants', 'Vegetable Gardening', 'Landscape Design', 'Bonsai'],
    },
    {
        id: 'food',
        name: 'Food',
        icon: 'food',
        subCategories: ['Cooking', 'Baking', 'Fine Dining', 'Street Food', 'Food Reviewing'],
    },
    {
        id: 'streaming',
        name: 'Streaming & TV',
        icon: 'television-play',
        subCategories: ['Netflix/HBO/Hulu', 'YouTube\u00A0(Long-form)', 'TikTok/Reels\u00A0(Short-form)', 'Gaming Streams (Twitch)', 'Sports Broadcasts', 'Documentaries/News'],
    },
    {
        id: 'finance',
        name: 'Finance & Investing',
        icon: 'chart-line',
        subCategories: ['Stock Market/Trading', 'Personal Budgeting', 'Cryptocurrency/NFTs', 'Real Estate', 'Entrepreneurship', 'Side Hustles'],
    },
    {
        id: 'fashion',
        name: 'Fashion & Style',
        icon: 'hanger',
        subCategories: ['Streetwear', 'Luxury & High-End Brands', 'Sustainable Fashion', 'Thrift/Vintage\u00A0Shopping', 'Style & Grooming Tips', 'Cosmetics & Skincare'],
    },
    {
        id: 'automotive',
        name: 'Automotive',
        icon: 'car',
        subCategories: ['Cars/Bikes Reviews', 'Car Modifications/DIY', 'Racing & Motorsport', 'Vintage & Classic Cars', 'Electric\u00A0Vehicles\u00A0(EVs)', 'Auto Repair/Maintenance'],
    },
];

const SuccessRewardModal = ({ visible, onClose, awardedAmount, navigation, userRole }) => {
  const handleOKPress = () => {
    onClose();
    
    // ✅ FIXED: Navigate to correct dashboard with award info
    if (userRole === 'creator') {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'CreatorDashboard',
          params: { 
            awardedAmount: awardedAmount,
            showMessage: `₹${awardedAmount} added to your wallet!`
          }
        }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: 'FillerDashboard',
          params: { 
            awardedAmount: awardedAmount,
            showSurveyUnlockPopup: true
          }
        }],
      });
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.rewardModalContent}>
          <View style={styles.checkmarkCircle}>
            <MaterialIcons name="check" size={40} color="#fff" />
          </View>

          <Text style={styles.rewardModalTitle}>Profile Complete! 🎉</Text>
          <Text style={styles.rewardModalMessage}>
            You have successfully completed your profile!
          </Text>
          
          <View style={styles.notificationBox}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#FF7E1D" />
            <Text style={styles.notificationText}>
              PKR {awardedAmount} has been added to your wallet
            </Text>
          </View>

          <Text style={styles.additionalMessage}>
            {userRole === 'creator' 
              ? 'You can now create and publish surveys!' 
              : 'You can now participate in surveys and earn more!'}
          </Text>

          <TouchableOpacity onPress={handleOKPress} style={styles.rewardModalButtonContainer}>
            <LinearGradient
              colors={['#FF7E1D', '#FFD464']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rewardModalButtonGradient}
            >
              <Text style={styles.rewardModalButtonText}>
                {userRole === 'creator' ? 'Go to Creator Dashboard' : 'Go to Filler Dashboard'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const SubCategoryModalComponent = ({ visible, onClose, category, selectedInterests, saveSubInterests }) => {
    const [tempSelectedSubs, setTempSelectedSubs] = useState([]);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        if (visible && category) {
            const currentSubs = selectedInterests[category.id] || [];
            setTempSelectedSubs(currentSubs);
            setModalError('');
        }
    }, [visible, category, selectedInterests]);

    if (!category) return null;

    const currentSubCount = tempSelectedSubs.length;

    const toggleLocalSubInterest = (subInterest) => {
        setModalError('');

        setTempSelectedSubs(prevSubs => {
            if (prevSubs.includes(subInterest)) {
                return prevSubs.filter(item => item !== subInterest);
            } else {
                if (prevSubs.length >= MAX_SUB_CATEGORIES) {
                    setModalError(`You can select a maximum of ${MAX_SUB_CATEGORIES} interests in this category.`);
                    return prevSubs;
                }
                return [...prevSubs, subInterest];
            }
        });
    };

    const handleDone = () => {
        if (tempSelectedSubs.length === 0) {
            setModalError(`Please select at least one sub-interest for ${category.name}, or tap the back arrow to deselect the main category.`);
            return;
        }
        
        saveSubInterests(category.id, tempSelectedSubs);
    };

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={visible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                        <MaterialIcons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Interests in {category.name}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView contentContainerStyle={styles.modalContent}>
                    {modalError ? <Text style={styles.modalErrorText}>{modalError}</Text> : null}

                    <View style={styles.subCategoryListWrapper}>
                               <LinearGradient
                                    colors={['#FFD464', '#FCF3E7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.subCategoryGradientBorderModal}
                               >
                                    <View style={styles.subCategoryInnerContentModal}>
                                                    {category.subCategories.map((sub, index) => {
                                                        const isSubSelected = tempSelectedSubs.includes(sub);
                                                        const isDisabled = currentSubCount >= MAX_SUB_CATEGORIES && !isSubSelected;

                                                        return (
                                                            <TouchableOpacity
                                                                key={index}
                                                                style={[
                                                                    styles.subCategoryItem,
                                                                    isSubSelected && styles.subCategoryItemSelected,
                                                                    isDisabled && styles.subCategoryItemDisabled
                                                                ]}
                                                                onPress={() => toggleLocalSubInterest(sub)}
                                                                disabled={isDisabled}
                                                            >
                                                                <MaterialIcons
                                                                    name={isSubSelected ? 'check-circle' : 'radio-button-unchecked'}
                                                                    size={18}
                                                                    color={isSubSelected ? '#FFFFFF' : (isDisabled ? '#ccc' : '#999')}
                                                                    style={{ marginRight: 5 }}
                                                                />
                                                                <Text style={[
                                                                    styles.subCategoryTextModal,
                                                                    isSubSelected && styles.subCategoryTextSelected,
                                                                    isDisabled && styles.subCategoryTextDisabled
                                                                ]}>
                                                                    {sub}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                    </View>
                               </LinearGradient>
                    </View>
                </ScrollView>

                <TouchableOpacity 
                    onPress={handleDone} 
                    style={styles.modalDoneButtonContainer}
                >
                    <LinearGradient
                        colors={['#FF7E1D', '#FFD464']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.saveButtonGradient}
                    >
                        <Text style={styles.saveButtonText}>Done</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
};

const SubCategoryModal = memo(SubCategoryModalComponent);

const InterestAndHobbiesScreen = ({ navigation, route }) => {
    const currentStep = 4;
    const totalSteps = 4;
    const progress = (currentStep / totalSteps) * 100;

    const [selectedInterests, setSelectedInterests] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [userRole, setUserRole] = useState('');
    const [shouldAwardBonus, setShouldAwardBonus] = useState(false);
    const [comingFrom, setComingFrom] = useState('');

    const mainCategoryCount = Object.keys(selectedInterests).length;

    useEffect(() => {
        const getUserRole = async () => {
            try {
                const userSession = await AsyncStorage.getItem('@supabase_session');
                if (userSession) {
                    const session = JSON.parse(userSession);
                    const role = session.user.user_metadata?.user_role || 'filler';
                    console.log('👤 Detected user role from session:', role);
                    setUserRole(role);
                }
            } catch (error) {
                console.error('Error getting user role:', error);
            }
        };

        getUserRole();
        
        // Also check route params (as fallback)
        if (route.params) {
            console.log('Route params in Interest screen:', route.params);
            if (route.params.userRole) {
                console.log('Setting user role from params:', route.params.userRole);
                setUserRole(route.params.userRole);
            }
            if (route.params.shouldAwardBonus) {
                setShouldAwardBonus(true);
            }
            if (route.params.comingFrom) {
                setComingFrom(route.params.comingFrom);
            }
        }
    }, [route.params]);

    const toggleMainCategory = (categoryItem) => {
        const categoryId = categoryItem.id;
        const isCurrentlySelected = selectedInterests.hasOwnProperty(categoryId);

        if (!isCurrentlySelected && mainCategoryCount >= MAX_MAIN_CATEGORIES) {
            setError(`You can select a maximum of ${MAX_MAIN_CATEGORIES} main categories.`);
            return;
        }

        setError('');
        setCurrentCategory(categoryItem);
        setModalVisible(true);
    };

    const saveSubInterests = useCallback((categoryId, updatedSubInterests) => {
        setSelectedInterests(prev => {
            const newState = { ...prev };

            if (updatedSubInterests.length === 0) {
                delete newState[categoryId];
            } else {
                newState[categoryId] = updatedSubInterests;
            }

            return newState;
        });
        setModalVisible(false);
    }, []);

    const handleSave = async () => {
        const totalMainSelections = Object.keys(selectedInterests).length;

        if (totalMainSelections === 0) {
            setError('Please select at least one main interest category and its sub-interests to finish your profile.');
            return;
        }

        if (totalMainSelections > MAX_MAIN_CATEGORIES) {
            setError(`You have selected more than the maximum allowed ${MAX_MAIN_CATEGORIES} main categories. Please adjust.`);
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const userSession = await AsyncStorage.getItem('@supabase_session');
            if (!userSession) {
                Alert.alert("Authentication Error", "User session expired or not found. Please log in again.");
                navigation.navigate('SignIn'); 
                return;
            }

            const session = JSON.parse(userSession);
            const accessToken = session.access_token;
            const authUserID = session.user.id; 

            // ✅ FIXED: Get user role from session
            const userRole = session.user.user_metadata?.user_role || 'filler';
            console.log("Final step - User role:", userRole);

            const payload = {
                hobbies_data: selectedInterests,
                profile_completed: true,
                profile_completed_at: new Date().toISOString(),
                profile_completed_step: 4,
            };

            console.log('Final payload:', payload);

            const response = await fetch(`${REST_API_URL}?user_id=eq.${authUserID}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Prefer': 'return=representation', 
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log('Profile completion saved successfully.');
                
                try {
                    // First get current wallet balance
                    const getWalletResponse = await fetch(`${REST_API_URL}?user_id=eq.${authUserID}&select=wallet_balance`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'apikey': SUPABASE_ANON_KEY,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    let currentBalance = 0;
                    if (getWalletResponse.ok) {
                        const walletData = await getWalletResponse.json();
                        if (walletData && walletData.length > 0) {
                            currentBalance = walletData[0].wallet_balance || 0;
                        }
                    }
                    
                    // Calculate new balance
                    const newBalance = currentBalance + AWARD_AMOUNT;
                    
                    // ✅ UPDATED: Set different reward reason for creator
                    const rewardReason = userRole === 'creator' 
                      ? 'Profile completion bonus (Creator)' 
                      : 'Profile completion bonus';
                      
                    // Update wallet with new balance
                    const updateWalletResponse = await fetch(`${REST_API_URL}?user_id=eq.${authUserID}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                            'apikey': SUPABASE_ANON_KEY,
                        },
                        body: JSON.stringify({ 
                            wallet_balance: newBalance,
                            last_reward_received: new Date().toISOString(),
                            reward_reason: rewardReason
                        }),
                    });
                    
                    if (updateWalletResponse.ok) {
                        console.log(`✅ Wallet updated: ${currentBalance} + ${AWARD_AMOUNT} = ${newBalance}`);
                        
                        // Show success modal
                        setSuccessModalVisible(true);
                    } else {
                        const errorText = await updateWalletResponse.text();
                        console.error('Wallet update failed:', errorText);
                        Alert.alert("Error", "Could not update wallet balance. Please contact support.");
                        setIsLoading(false);
                    }
                } catch (walletError) {
                    console.error('Error updating wallet:', walletError);
                    Alert.alert("Error", "Failed to update wallet balance. Please contact support.");
                    setIsLoading(false);
                }
                
            } else {
                const errorText = await response.text();
                console.error('Update Failed:', response.status, errorText);
                Alert.alert("Save Error", "Could not save profile completion.");
                setIsLoading(false);
            }

        } catch (apiError) {
            console.error("Network Error:", apiError);
            Alert.alert("System Error", "An unexpected error occurred.");
            setIsLoading(false);
        }
    };

    const renderCategoryItem = (item) => {
        const isSelected = selectedInterests[item.id] && selectedInterests[item.id].length > 0;
        const currentSubCount = selectedInterests[item.id] ? selectedInterests[item.id].length : 0;
        const isDisabled = !isSelected && mainCategoryCount >= MAX_MAIN_CATEGORIES;

        return (
            <View key={item.id} style={styles.categoryWrapper}>
                <TouchableOpacity
                    style={[
                        styles.categoryButton,
                        isSelected && styles.categoryButtonSelected,
                        isDisabled && styles.categoryButtonDisabled
                    ]}
                    onPress={() => toggleMainCategory(item)}
                    disabled={isDisabled || isLoading}
                >
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={30}
                        color={isSelected ? '#fff' : '#FF7E1D'}
                    />
                    <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                        {item.name}
                    </Text>
                    {isSelected && (
                                         <View style={styles.badge}>
                                             <Text style={styles.badgeText}>{currentSubCount}</Text>
                                         </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
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
                <View style={styles.navIcon} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradientContainer}
                        >
                            <MaterialIcons name="favorite" size={24} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.cardTitle}>Interest & Hobbies</Text>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.gridContainer}>
                        {INTEREST_DATA.map(renderCategoryItem)}
                    </View>

                    <TouchableOpacity 
                        onPress={handleSave} 
                        style={[
                            styles.saveButtonContainer,
                            isLoading && styles.saveButtonDisabled
                        ]}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.saveButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={20} color="#fff" />
                                    <Text style={styles.saveButtonText}>Save & Finish</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SubCategoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                category={currentCategory}
                selectedInterests={selectedInterests}
                saveSubInterests={saveSubInterests}
            />

            <SuccessRewardModal
                visible={successModalVisible}
                onClose={() => setSuccessModalVisible(false)}
                awardedAmount={AWARD_AMOUNT}
                navigation={navigation}
                userRole={userRole}
            />
        </View>
    );
};

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
    navIcon: {
        padding: 5,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
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
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    categoryWrapper: {
        width: '48%',
        marginBottom: 10,
    },
    categoryButton: {
        width: '100%',
        height: 90,
        backgroundColor: '#f7f7f7',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#f7f7f7',
    },
    categoryButtonSelected: {
        backgroundColor: '#FF7E1D',
        borderColor: '#FF7E1D',
        shadowColor: '#FF7E1D',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    categoryButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#e0e0e0',
    },
    categoryText: {
        marginTop: 5,
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    categoryTextSelected: {
        color: '#fff',
    },
    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF7E1D',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF7E1D',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FCF3E7',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    modalCloseButton: {
        padding: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    modalContent: {
        paddingBottom: 20,
    },
    modalErrorText: {
        fontSize: 14,
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '500',
    },
    subCategoryListWrapper: {
        width: '100%',
        alignSelf: 'center',
    },
    subCategoryGradientBorderModal: {
        borderRadius: 15,
        padding: 1,
        marginTop: 10,
        backgroundColor: '#fff',
    },
    subCategoryInnerContentModal: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    subCategoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginVertical: 3,
        borderRadius: 10,
    },
    subCategoryItemSelected: {
        backgroundColor: '#FF7E1D',
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    subCategoryItemDisabled: {
        opacity: 0.6,
        backgroundColor: '#f7f7f7',
    },
    subCategoryTextModal: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    subCategoryTextSelected: {
        color: '#fff',
        fontWeight: '600',
    },
    subCategoryTextDisabled: {
        color: '#999',
        fontWeight: 'normal',
    },
    modalDoneButtonContainer: {
        paddingTop: 10,
        paddingBottom: 20,
        width: '100%',
        alignSelf: 'center',
    },
    saveButtonContainer: {
        marginTop: 30,
        alignSelf: 'flex-start',
        width: '100%',
    },
    saveButtonDisabled: {
        opacity: 0.7, 
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(28, 42, 57, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardModalContent: {
        width: width * 0.85,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 30,
        alignItems: 'center',
    },
    checkmarkCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#3CB371',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    rewardModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1C2A39',
        marginBottom: 10,
    },
    rewardModalMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 25,
    },
    notificationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5E6',
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#FFD464',
        width: '100%',
        justifyContent: 'center',
    },
    notificationText: {
        fontSize: 14,
        color: '#FF7E1D',
        marginLeft: 8,
        fontWeight: '600',
    },
    additionalMessage: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    rewardModalButtonContainer: {
        width: '100%',
    },
    rewardModalButtonGradient: {
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    rewardModalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default InterestAndHobbiesScreen;