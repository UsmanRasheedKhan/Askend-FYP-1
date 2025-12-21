import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useIsFocused, useRoute } from "@react-navigation/native";
import { supabase } from "../../supabaseClient";

const CreatorDashboardScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const route = useRoute();
  
  const [draftsCount, setDraftsCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (isFocused) {
      loadUserData();
    }
    
    if (route.params?.showMessage) {
      setMessage(route.params.showMessage);
      setTimeout(() => setMessage(''), 3000);
    }
    
    if (route.params?.awardedAmount && route.params.awardedAmount > 0) {
      setWalletBalance(prev => {
        const newBalance = prev + route.params.awardedAmount;
        console.log(`✅ Creator Wallet updated: ${prev} + ${route.params.awardedAmount} = ${newBalance}`);
        return newBalance;
      });
      
      navigation.setParams({ awardedAmount: undefined });
    }
    
    if (route.params?.refreshKey) {
      loadUserData();
      navigation.setParams({ refreshKey: undefined });
    }
    
    if (route.params?.isProfileComplete !== undefined) {
      console.log('Profile completion status:', route.params.isProfileComplete);
    }
  }, [isFocused, route.params]);

  const awardCreatorProfileBonus = async (userId) => {
    try {
      const { data: walletData, error: walletError } = await supabase
        .from('user_profiles')
        .select('wallet_balance, reward_reason')
        .eq('user_id', userId)
        .single();
      
      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        return false;
      }
      
      // Check if already received creator bonus
      if (walletData?.reward_reason === 'Profile completion bonus (Creator)') {
        console.log('Creator already received profile completion bonus');
        return true;
      }
      
      const currentBalance = walletData?.wallet_balance || 0;
      const newBalance = currentBalance + 50;
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          wallet_balance: newBalance,
          last_reward_received: new Date().toISOString(),
          reward_reason: 'Profile completion bonus (Creator)'
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return false;
      }
      
      console.log(`✅ Creator awarded ₹50: ${currentBalance} → ${newBalance}`);
      setWalletBalance(newBalance);
      
      Alert.alert(
        "Profile Complete! 🎉",
        "₹50 has been added to your wallet for completing your profile.\n\nYou can now create surveys!",
        [{ text: "OK" }]
      );
      
      return true;
    } catch (error) {
      console.error('Error in awardCreatorProfileBonus:', error);
      return false;
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert("Session Expired", "Please sign in again");
        navigation.navigate("SignIn");
        return false;
      }

      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !profileData) {
        Alert.alert(
          "Complete Your Profile First",
          "Please complete your profile before creating surveys.",
          [
            { 
              text: "OK", 
              onPress: () => navigation.navigate('ProfileCompletionScreen', { 
                userRole: 'creator',
                comingFrom: 'creator_dashboard'
              }) 
            },
            { 
              text: "Cancel", 
              style: "cancel" 
            }
          ]
        );
        return false;
      }

      const requiredFields = ['full_name', 'gender', 'date_of_birth', 'marital_status'];
      const isProfileComplete = requiredFields.every(field => 
        profileData[field] && profileData[field].toString().trim() !== ''
      );

      if (!isProfileComplete) {
        Alert.alert(
          "Complete Your Profile First",
          "Please complete all profile details before creating surveys.",
          [
            { 
              text: "Complete Profile", 
              onPress: () => navigation.navigate('ProfileCompletionScreen', { 
                userRole: 'creator',
                comingFrom: 'creator_dashboard'
              }) 
            },
            { 
              text: "Cancel", 
              style: "cancel" 
            }
          ]
        );
        return false;
      }

      const userRole = user.user_metadata?.user_role;
      if (userRole === 'creator') {
        await awardCreatorProfileBonus(user.id);
      }

      return true;
    } catch (error) {
      console.error('Error checking profile:', error);
      return false;
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Session Expired", "Please sign in again");
        navigation.navigate("SignIn");
        return;
      }
      
      setCurrentUser(user);
      
      if (user.user_metadata?.full_name) {
        const firstName = user.user_metadata.full_name.split(' ')[0];
        setUserName(firstName);
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (!profileError && profileData?.full_name) {
          const firstName = profileData.full_name.split(' ')[0];
          setUserName(firstName);
        } else {
          setUserName(user.email?.split('@')[0] || 'Creator');
        }
      }
      
      const { data: walletData, error: walletError } = await supabase
        .from('user_profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single();
      
      if (!walletError && walletData?.wallet_balance !== undefined) {
        setWalletBalance(walletData.wallet_balance);
      }
      
      await loadUserSurveys(user.id);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadUserSurveys = async (userId) => {
    try {
      const { count: draftsCount, error: draftsError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .eq('user_id', userId);
      
      if (draftsError) {
        console.error('Drafts count error:', draftsError);
      } else {
        setDraftsCount(draftsCount || 0);
      }

      const { count: publishedCount, error: publishedError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('user_id', userId);
      
      if (publishedError) {
        console.error('Published count error:', publishedError);
      } else {
        setPublishedCount(publishedCount || 0);
      }

      const { count: finishedCount, error: finishedError } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'finished')
        .eq('user_id', userId);
      
      if (finishedError) {
        console.error('Finished count error:', finishedError);
      } else {
        setFinishedCount(finishedCount || 0);
      }

    } catch (error) {
      console.error('Error loading user surveys:', error);
      Alert.alert("Error", "Failed to load surveys data");
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    if (currentUser) {
      await loadUserSurveys(currentUser.id);
    } else {
      await loadUserData();
    }
    setRefreshing(false);
  };

  const handleDraftsPress = () => {
    navigation.navigate('DraftsScreen');
  };

  const handlePublishedPress = () => {
    navigation.navigate('PublishedSurveysScreen');
  };

  const handleFinishedPress = () => {
    if (finishedCount > 0) {
      navigation.navigate('FinishedSurveysScreen');
    } else {
      Alert.alert(
        "No Finished Surveys",
        "You haven't finished any surveys yet.\n\nTo finish a survey:\n1. Go to Published Surveys\n2. Click ••• on a survey\n3. Select 'Finish Survey'\n\nIt will then appear here!",
        [
          { 
            text: "Go to Published", 
            onPress: () => navigation.navigate('PublishedSurveysScreen')
          },
          { text: "OK", style: "cancel" }
        ]
      );
    }
  };

  const handleNavigateToCreateSurvey = async () => {
    const canProceed = await checkProfileCompletion();
    if (canProceed) {
      navigation.navigate('CreateNewSurvey');
    }
  };

  const handleCreateNewSurvey = async () => {
    const canProceed = await checkProfileCompletion();
    if (canProceed) {
      navigation.navigate("CreateNewSurvey");
    }
  };

  const handleNavigateToWallet = () => {
    navigation.navigate('WalletScreen');
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7800" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF7800", "#FFD464"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>
              Welcome, {userName} 👋
            </Text>
            <Text style={styles.headerSubtitle}>
              Design and Manage your surveys
            </Text>
          </View>

          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons
              name="clipboard-edit-outline"
              size={35}
              color="#fff"
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.walletButton}
          onPress={handleNavigateToWallet}
        >
          <MaterialIcons name="account-balance-wallet" size={18} color="#FF7800" />
          <Text style={styles.walletText}>Rs {walletBalance}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="refresh" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {message ? (
        <View style={styles.messageBanner}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={['#FF7800']}
            tintColor="#FF7800"
          />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Surveys</Text>
          <Text style={styles.surveyCountNote}>
            Total: {draftsCount + publishedCount + finishedCount}
          </Text>
        </View>

        <SurveyStatusCard
          iconName="pencil-outline"
          title="Drafts"
          description="Work in progress"
          count={draftsCount}
          onPress={handleDraftsPress}
          disabled={draftsCount === 0}
        />

        <SurveyStatusCard
          iconName="send"
          title="Published"
          description="Live and collecting"
          count={publishedCount}
          onPress={handlePublishedPress}
          disabled={publishedCount === 0}
        />

        <SurveyStatusCard
          iconName="check-circle-outline"
          title="Finished"
          description="Analysis ready"
          count={finishedCount}
          onPress={handleFinishedPress}
          disabled={finishedCount === 0}
        />

        <View style={styles.extraSpacing} />

        <TouchableOpacity
          style={styles.fabButtonInScroll}
          onPress={handleCreateNewSurvey}
        >
          <LinearGradient
            colors={["#FF7800", "#FFD464"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabGradient}
          >
            <MaterialIcons name="add" size={35} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        
      </ScrollView>

      <LinearGradient
        colors={["#FF7800", "#FFD464"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomNav}
      >
        <TabItem 
          iconName="clipboard-list" 
          label="Surveys" 
          isCurrent={true} 
          onPress={() => {}} 
        />
        
        <TabItem 
          iconName="plus-circle-outline" 
          label="Create" 
          isCurrent={false} 
          onPress={handleNavigateToCreateSurvey}
        />

        <TabItem 
          iconName="account" 
          label="Profile" 
          isCurrent={false} 
          onPress={() => navigation.navigate('ProfileViewScreen')}
        />
      </LinearGradient>
    </View>
  );
};

const SurveyStatusCard = ({ iconName, title, description, count, onPress, disabled }) => (
  <TouchableOpacity 
    style={[
      styles.cardContainer,
      disabled && styles.disabledCard
    ]} 
    onPress={onPress}
    disabled={disabled}
    activeOpacity={disabled ? 1 : 0.7}
  >
    <LinearGradient
      colors={["#FFFFFF", "#FFF8E1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.cardContent}>
        <LinearGradient
          colors={["#FF9933", "#FFD464"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardIconContainer}
        >
          <MaterialCommunityIcons name={iconName} size={30} color="#fff" />
        </LinearGradient>

        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>

      <LinearGradient
        colors={["#FF7800", "#FFD464"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.countBadge}
      >
        <Text style={styles.countText}>{count}</Text>
      </LinearGradient>
    </LinearGradient>
  </TouchableOpacity>
);

const TabItem = ({ iconName, label, isCurrent, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerIconContainer: {
    padding: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  walletButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 3,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF7800',
    marginLeft: 5,
  },
  refreshButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    padding: 5,
  },
  messageBanner: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  surveyCountNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: 'italic',
  },
  extraSpacing: {
    height: 20,
  },
  cardContainer: {
    marginVertical: 12,
    borderRadius: 15,
    backgroundColor: "transparent",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FFD464",
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    minHeight: 100,
    shadowColor: "#FFD464",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  cardText: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
  },
  countBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  countText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  fabButtonInScroll: {
    alignSelf: "flex-end",
    marginTop: 20,
    marginRight: 10,
    width: 70,
    height: 70,
    borderRadius: 35,
    elevation: 8,
    shadowColor: "#FF7800",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    overflow: "hidden",
    marginBottom: 50,
  },
  fabGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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

export default CreatorDashboardScreen;