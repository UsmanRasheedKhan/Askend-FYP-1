import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

const { width } = Dimensions.get('window');

// Bottom Tab Item Component
const TabItem = ({ iconName, label, isCurrent, onPress }) => (
    <TouchableOpacity
        style={styles.tabItem}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={isCurrent ? "#fff" : "rgba(255, 255, 255, 0.6)"}
        />
        <Text
            style={[
                styles.tabLabel,
                { color: isCurrent ? "#fff" : "rgba(255, 255, 255, 0.6)" },
            ]}
        >
            {label}
        </Text>
    </TouchableOpacity>
);

// Recent Activity Card Component
const ActivityCard = ({ type, amount, time }) => {
    const normalizedType = (type || '').toLowerCase();
    const isCredit = normalizedType.includes('reward') || normalizedType.includes('bonus');
    const iconName = isCredit ? 'plus-circle' : 'minus-circle';
    const iconColor = isCredit ? '#00C853' : '#FF3B30';
    const amountColor = isCredit ? '#00C853' : '#FF3B30';
    const amountPrefix = isCredit ? '+ Rs. ' : '- Rs. ';
    const numericAmount = Number(amount) || 0;

    return (
        <View style={styles.activityCard}>
            <LinearGradient
                colors={isCredit ? ['#00C853', '#64DD17'] : ['#FF3B30', '#FF7043']}
                style={styles.activityIconGradient}
            >
                <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
            </LinearGradient>
            
            <View style={styles.activityDetails}>
                <Text style={styles.activityType}>{type}</Text>
                <Text style={styles.activityTime}>{time}</Text>
            </View>
            
            <Text style={[styles.activityAmount, { color: amountColor }]}>
                {amountPrefix}{numericAmount.toLocaleString()}
            </Text>
        </View>
    );
};

const formatActivityTime = (timestamp) => {
    if (!timestamp) {
        return 'Just now';
    }

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return 'Pending';
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (date.toDateString() === now.toDateString()) {
        return `Today, ${timeString}`;
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return `Yesterday, ${timeString}`;
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Wallet Screen Component
const WalletScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(true);
    const [totalBalance, setTotalBalance] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [completedSurveysCount, setCompletedSurveysCount] = useState(0);

    // Get Greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const fetchWalletData = useCallback(async () => {
        try {
            setLoading(true);

            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                throw error;
            }

            if (!session) {
                setTotalBalance(0);
                setRecentActivity([]);
                setCompletedSurveysCount(0);
                return;
            }

            const { data, error: responsesError } = await supabase
                .from('survey_responses')
                .select('id,reward_amount,completed_at,payment_status')
                .eq('user_id', session.user.id)
                .order('completed_at', { ascending: false });

            if (responsesError) {
                throw responsesError;
            }

            const rows = Array.isArray(data) ? data : [];
            const total = rows.reduce((sum, row) => sum + (Number(row?.reward_amount) || 0), 0);
            const activityEntries = rows.slice(0, 5).map(row => ({
                id: row.id,
                type: row?.payment_status === 'paid' ? 'Survey Reward (Paid)' : 'Survey Reward',
                amount: Number(row?.reward_amount) || 0,
                time: formatActivityTime(row?.completed_at),
            }));

            setTotalBalance(total);
            setRecentActivity(activityEntries);
            setCompletedSurveysCount(rows.length);
        } catch (error) {
            console.error('Error loading wallet:', error);
            Alert.alert('Wallet Error', error.message || 'Unable to load wallet details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchWalletData();
        }, [fetchWalletData])
    );

    const handleWithdraw = () => {
        Alert.alert(
            'Withdraw Funds',
            'Minimum withdrawal amount is Rs. 500. Are you sure you want to proceed?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Confirm', 
                    onPress: () => {
                        if (totalBalance >= 500) {
                            Alert.alert('Success', 'Withdrawal request has been submitted. Amount will be transferred within 24 hours.');
                        } else {
                            Alert.alert('Minimum Amount Required', 'You need at least Rs. 500 to withdraw funds.');
                        }
                    },
                },
            ]
        );
    };

    // Navigation handlers
    const handleNavigateToSurveys = () => {
        // Check user role and navigate accordingly
         navigation.navigate('FillerDashboard');
    };

    const handleNavigateToWallet = () => {
        // Already on Wallet screen
    };

    const handleNavigateToProfile = () => {
        navigation.navigate('ProfileViewScreen');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#FF7E1D', '#FFD464']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading Wallet...</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Top Header with Gradient */}
            <LinearGradient
                colors={['#FF7E1D', '#FFD464']}
                style={styles.topHeader}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.headerSubtext}>Your wallet summary</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.profileButton}
                        onPress={handleNavigateToProfile}
                    >
                        <LinearGradient
                            colors={['#FF7E1D', '#FFD464', '#8A2BE2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.profileInitialsCircle}
                        >
                            <Text style={styles.profileInitialsText}>MA</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Total Balance Card */}
                <View style={styles.balanceCardContainer}>
                    <LinearGradient
                        colors={['#FFFFFF', '#FFF8E1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceCard}
                    >
                        <View style={styles.balanceHeader}>
                            <MaterialCommunityIcons 
                                name="wallet-outline" 
                                size={28} 
                                color="#FF7E1D" 
                            />
                            <Text style={styles.balanceCardTitle}>Total Balance</Text>
                        </View>

                        {/* Money Bag Icon */}
                        <View style={styles.moneyBagContainer}>
                            <LinearGradient
                                colors={['#FF7E1D', '#FFD464']}
                                style={styles.moneyBagGradient}
                            >
                                <MaterialCommunityIcons 
                                    name="sack" 
                                    size={30} 
                                    color="#fff" 
                                />
                            </LinearGradient>
                        </View>

                        <Text style={styles.totalBalanceAmount}>
                            Rs. {totalBalance.toLocaleString()}
                        </Text>
                        
                        <View style={styles.growthContainer}>
                            <MaterialCommunityIcons name="trending-up" size={18} color="#00C853" />
                            <Text style={styles.growthText}>+12.5% this month</Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Stats - REMOVED PENDING STAT CARD */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#E8F5E9', '#C8E6C9']}
                            style={styles.statCardGradient}
                        >
                            <MaterialCommunityIcons name="clipboard-check-outline" size={24} color="#00C853" />
                            <Text style={styles.statValue}>{completedSurveysCount}</Text>
                            <Text style={styles.statLabel}>Surveys Completed</Text>
                        </LinearGradient>
                    </View>
                    
                    <View style={styles.statCard}>
                        <LinearGradient
                            colors={['#FFF3E0', '#FFE0B2']}
                            style={styles.statCardGradient}
                        >
                            <MaterialCommunityIcons name="cash-plus" size={24} color="#FF7E1D" />
                            <Text style={styles.statValue}>Rs. {totalBalance.toLocaleString()}</Text>
                            <Text style={styles.statLabel}>Total Earned</Text>
                        </LinearGradient>
                    </View>
                    
                    {/* REMOVED PENDING STAT CARD - Keeping only 2 stats now */}
                </View>

                {/* Recent Activity Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.activityList}>
                    {recentActivity.length === 0 ? (
                        <Text style={styles.emptyActivityText}>No wallet activity yet. Complete a survey to earn rewards.</Text>
                    ) : (
                        recentActivity.map((activity, index) => (
                            <ActivityCard
                                key={`${activity.id || 'activity'}-${index}`}
                                type={activity.type}
                                amount={activity.amount}
                                time={activity.time}
                            />
                        ))
                    )}
                </View>

                {/* Withdraw Button ONLY - REMOVED Add Money Button */}
                <TouchableOpacity 
                    style={styles.withdrawButton}
                    onPress={handleWithdraw}
                >
                    <LinearGradient
                        colors={['#FF7E1D', '#FFD464']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.withdrawButtonGradient}
                    >
                        <MaterialCommunityIcons name="bank-transfer" size={24} color="#fff" />
                        <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* REMOVED Add Money Button */}
                
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <LinearGradient
                colors={["#FF7E1D", "#FFD464"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomNav}
            >
                <TabItem 
                    iconName="clipboard-list" 
                    label="Surveys" 
                    isCurrent={false}
                    onPress={handleNavigateToSurveys}
                />
                
                <TabItem 
                    iconName="wallet" 
                    label="Wallet" 
                    isCurrent={true}
                    onPress={handleNavigateToWallet}
                />
                
                <TabItem 
                    iconName="account" 
                    label="Profile" 
                    isCurrent={false}
                    onPress={handleNavigateToProfile}
                />
            </LinearGradient>
        </SafeAreaView>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    topHeader: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    greetingText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    headerSubtext: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    profileButton: {
        padding: 5,
    },
    profileInitialsCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    profileInitialsText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    // Balance Card
    balanceCardContainer: {
        marginTop: -40,
        marginBottom: 25,
    },
    balanceCard: {
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#FF7E1D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 126, 29, 0.1)',
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
    balanceCardTitle: {
        fontSize: 16,
        color: '#666',
        marginLeft: 10,
        fontWeight: '500',
    },
    moneyBagContainer: {
        marginVertical: 15,
    },
    moneyBagGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    totalBalanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    growthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 200, 83, 0.1)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    growthText: {
        fontSize: 14,
        color: '#00C853',
        fontWeight: '600',
        marginLeft: 5,
    },
    // Stats Cards - Updated for 2 cards only
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statCard: {
        width: (width - 50) / 2, // Adjusted for 2 cards
    },
    statCardGradient: {
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    // Activity Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    viewAllText: {
        fontSize: 14,
        color: '#FF7E1D',
        fontWeight: '500',
    },
    activityList: {
        marginBottom: 25,
    },
    emptyActivityText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginBottom: 15,
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    activityIconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    activityDetails: {
        flex: 1,
    },
    activityType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    activityTime: {
        fontSize: 13,
        color: '#999',
        marginTop: 3,
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Withdraw Button ONLY
    withdrawButton: {
        marginBottom: 30,
    },
    withdrawButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 15,
        elevation: 3,
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    // Bottom Navigation
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: 70,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
    },
    tabItem: {
        alignItems: "center",
        padding: 5,
        flex: 1,
        justifyContent: "center",
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: "bold",
    },
});

export default WalletScreen;