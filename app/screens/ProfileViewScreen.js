import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../supabaseClient";

const SUPABASE_URL = "https://oyavjqycsjfcnzlshdsu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4";
const USER_PROFILES_URL = `${SUPABASE_URL}/rest/v1/user_profiles`;

const InfoRow = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "Not provided"}</Text>
    </View>
  );
};

const SectionHeader = ({ title, iconName }) => (
  <View style={styles.sectionHeader}>
    <MaterialIcons name={iconName} size={20} color="#FF7E1D" />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

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

const getUserInitials = (fullName) => {
  if (!fullName) return "U";
  const names = fullName.split(" ");
  if (names.length >= 2)
    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  return names[0].charAt(0).toUpperCase();
};

const RoleSwitchWelcomeModal = ({ visible, onClose, fromRole, toRole }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={roleSwitchStyles.modalOverlay}>
        <View style={roleSwitchStyles.modalContent}>
          <View style={roleSwitchStyles.iconCircle}>
            <MaterialCommunityIcons 
              name="swap-horizontal" 
              size={40} 
              color="#fff" 
            />
          </View>
          
          <Text style={roleSwitchStyles.modalTitle}>
            Switched to {toRole === 'creator' ? 'Creator' : 'Filler'} Mode
          </Text>
          
          <Text style={roleSwitchStyles.modalMessage}>
            {toRole === 'creator' 
              ? 'You can now create and manage surveys. Your profile data will be used for survey targeting.'
              : 'You can now participate in surveys. Available surveys will be filtered based on your profile.'}
          </Text>
          
          <TouchableOpacity onPress={onClose} style={roleSwitchStyles.okButton}>
            <LinearGradient
              colors={['#FF7E1D', '#FFD464']}
              style={roleSwitchStyles.okButtonGradient}
            >
              <Text style={roleSwitchStyles.okButtonText}>Got it!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ProfileViewScreen = ({ navigation, route }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("U");
  const [userRole, setUserRole] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
  const [switchedFrom, setSwitchedFrom] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (route.params?.refreshedProfile) {
      fetchProfileData();
      navigation.setParams({ refreshedProfile: undefined });
    }
  }, [route.params]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        Alert.alert("Session Expired", "Please sign in again.");
        navigation.navigate("SignIn");
        return;
      }

      setUserEmail(session.user.email || "");

      const response = await fetch(
        `${USER_PROFILES_URL}?user_id=eq.${session.user.id}`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const profile = data[0];
          setProfileData(profile);
          
          // Get wallet balance
          if (profile.wallet_balance !== undefined) {
            setWalletBalance(profile.wallet_balance);
          }

          if (profile.full_name)
            setUserInitials(getUserInitials(profile.full_name));

          const userResponse = await supabase.auth.getUser();
          if (userResponse.data?.user?.user_metadata?.user_role) {
            setUserRole(userResponse.data.user.user_metadata.user_role);
          } else if (profile.user_role) {
            setUserRole(profile.user_role);
          } else {
            setUserRole("filler");
          }
          
          console.log('✅ Profile loaded successfully');
        } else {
          Alert.alert(
            "Profile Not Found",
            "Please complete your profile first."
          );
          navigation.navigate("ProfileCompletionScreen", {
            userRole: userRole,
            comingFrom: 'profile_view'
          });
        }
      } else {
        Alert.alert("Error", "Failed to fetch profile data.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "An error occurred while loading profile.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatIncome = (income) => {
    if (income === null || income === undefined || income === 0) return "Not provided";
    return `PKR ${income.toLocaleString()}`;
  };

  const formatLocation = (location) => {
    if (!location) return "Not provided";
    return location;
  };

  const formatHobbies = (hobbiesData) => {
    if (!hobbiesData || typeof hobbiesData !== "object") return "Not provided";
    let result = [];
    Object.entries(hobbiesData).forEach(([category, subcategories]) => {
      if (Array.isArray(subcategories))
        result.push(`${category}: ${subcategories.join(", ")}`);
    });
    return result.length > 0 ? result.join("\n") : "Not provided";
  };

  const handleChangePassword = () => navigation.navigate("ChangePassword");

  const handleNavigateToSurveys = () => {
    if (userRole === "filler") {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "FillerDashboard"
        }],
      });
    } else if (userRole === "creator") {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "CreatorDashboard"
        }],
      });
    } else {
      navigation.navigate("FillerDashboard");
    }
  };

  const handleNavigateToWallet = () => {
    navigation.navigate("WalletScreen", { walletBalance });
  };

  const handleNavigateToProfile = () => {};

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: "SignIn" }] });
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const toggleRoleDropdown = () => setShowRoleDropdown(!showRoleDropdown);

  const switchUserRole = async () => {
    setSwitchingRole(true);
    try {
      const newRole = userRole === "filler" ? "creator" : "filler";
      const {
        data: { user },
        error,
      } = await supabase.auth.updateUser({ data: { user_role: newRole } });

      if (error) {
        Alert.alert("Error", "Failed to switch role. Please try again.");
        return;
      }

      const oldRole = userRole;
      setUserRole(newRole);
      setShowRoleDropdown(false);
      
      setSwitchedFrom(oldRole);
      setShowRoleSwitchModal(true);
      
    } catch (error) {
      console.error("Error switching role:", error);
      Alert.alert("Error", "Failed to switch role. Please try again.");
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleRoleSwitchModalClose = () => {
    setShowRoleSwitchModal(false);
    
    if (userRole === "filler") {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "FillerDashboard",
          params: { 
            switchedFromCreator: switchedFrom === 'creator',
            refreshKey: Date.now()
          }
        }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "CreatorDashboard",
          params: { 
            refreshKey: Date.now()
          }
        }],
      });
    }
  };

  const getRoleDisplayName = () =>
    userRole === "creator" ? "Creator Account" : "Filler Account";
  const getOppositeRoleDisplayName = () =>
    userRole === "creator"
      ? "Switch to Filler Account"
      : "Switch to Creator Account";

  if (loading && !refreshing)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7E1D" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );

  if (!profileData)
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF7E1D" />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
          <LinearGradient
            colors={["#FF7E1D", "#FFD464"]}
            style={styles.retryButtonGradient}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 15 }]} 
          onPress={() => navigation.navigate("ProfileCompletionScreen")}
        >
          <LinearGradient
            colors={["#FF7E1D", "#FFD464"]}
            style={styles.retryButtonGradient}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Create Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FF7E1D", "#FFD464"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (userRole === "filler") {
                navigation.navigate("FillerDashboard");
              } else {
                navigation.navigate("CreatorDashboard");
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.logoutButtonHeader}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonHeaderText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerUserInfo}>
          <LinearGradient
            colors={["#FF7E1D", "#FFD464", "#8A2BE2"]}
            locations={[0, 1, 0.7]}
            style={styles.userInitialsCircle}
          >
            <Text style={styles.userInitialsText}>{userInitials}</Text>
          </LinearGradient>
          <View style={styles.userTextContainer}>
            <Text style={styles.usernameText}>
              {profileData.full_name || "User Name"}
            </Text>
            <Text style={styles.userEmailText}>{userEmail}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7E1D']}
            tintColor="#FF7E1D"
          />
        }
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderContainer}>
            <SectionHeader
              title="Personal Information"
              iconName="person-outline"
            />
          </View>
          <InfoRow label="Full Name" value={profileData.full_name} />
          <InfoRow label="Gender" value={profileData.gender} />
          <InfoRow
            label="Date of Birth"
            value={formatDate(profileData.date_of_birth)}
          />
          <InfoRow label="Marital Status" value={profileData.marital_status} />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderContainer}>
            <SectionHeader
              title="Contact Information"
              iconName="contact-phone"
            />
          </View>
          <InfoRow label="Mobile Number" value={profileData.mobile_number} />
          <InfoRow label="CNIC" value={profileData.cnic_number} />
          <InfoRow
            label="Location"
            value={formatLocation(profileData.location_coords)}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderContainer}>
            <SectionHeader
              title="Professional Information"
              iconName="work-outline"
            />
          </View>
          <InfoRow label="Education" value={profileData.education} />
          <InfoRow label="Major" value={profileData.major} />
          <InfoRow label="Profession" value={profileData.profession} />
          <InfoRow
            label="Monthly Income"
            value={formatIncome(profileData.monthly_income)}
          />
        </View>

        {profileData.hobbies_data &&
          Object.keys(profileData.hobbies_data).length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderContainer}>
                <SectionHeader
                  title="Interests & Hobbies"
                  iconName="favorite"
                />
              </View>
              <Text style={styles.hobbiesText}>
                {formatHobbies(profileData.hobbies_data)}
              </Text>
            </View>
          )}

        {/* Account Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderContainer}>
            <SectionHeader
              title="Account Information"
              iconName="account-circle"
            />
          </View>
          <View style={styles.roleRow}>
            <View style={styles.roleInfo}>
              <Text style={styles.roleLabel}>Account Type</Text>
              <View style={styles.roleValueContainer}>
                <LinearGradient
                  colors={["#FF7E1D", "#FFD464"]}
                  style={styles.roleBadge}
                >
                  <Text style={styles.roleBadgeText}>
                    {getRoleDisplayName()}
                  </Text>
                </LinearGradient>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editRoleButton}
              onPress={toggleRoleDropdown}
              disabled={switchingRole}
            >
              {switchingRole ? (
                <ActivityIndicator size="small" color="#FF7E1D" />
              ): (
                <LinearGradient
                  colors={["#FF7E1D", "#FFD464"]}
                  style={styles.editRoleButtonGradient}
                >
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={20}
                    color="#fff"
                  />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.roleInfoContainer}>
            <MaterialIcons name="info" size={16} color="#FF7E1D" />
            <Text style={styles.roleInfoText}>
              {userRole === "creator"
                ? "You can create and manage surveys. Your profile data will be used for survey targeting."
                : "You can participate in surveys and earn rewards. Available surveys are filtered based on your profile."}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={handleChangePassword}
        >
          <LinearGradient
            colors={["#FF7E1D", "#FFD464"]}
            style={styles.changePasswordButtonGradient}
          >
            <MaterialIcons name="lock" size={20} color="#fff" />
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        transparent={true}
        visible={showRoleDropdown}
        animationType="fade"
        onRequestClose={() => setShowRoleDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownTitle}>Switch Account Type</Text>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={switchUserRole}
              disabled={switchingRole}
            >
              <LinearGradient
                colors={["#FF7E1D", "#FFD464"]}
                style={styles.dropdownIconContainer}
              >
                <MaterialCommunityIcons
                  name={
                    userRole === "creator"
                      ? "account-outline"
                      : "clipboard-edit-outline"
                  }
                  size={24}
                  color="#fff"
                />
              </LinearGradient>
              <View style={styles.dropdownOptionText}>
                <Text style={styles.dropdownOptionTitle}>
                  {getOppositeRoleDisplayName()}
                </Text>
                <Text style={styles.dropdownOptionDescription}>
                  {userRole === "creator"
                    ? "Fill surveys and earn rewards"
                    : "Create and manage surveys"}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownCancel}
              onPress={() => setShowRoleDropdown(false)}
            >
              <Text style={styles.dropdownCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <RoleSwitchWelcomeModal
        visible={showRoleSwitchModal}
        onClose={handleRoleSwitchModalClose}
        fromRole={switchedFrom}
        toRole={userRole}
      />

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
          isCurrent={false}
          onPress={handleNavigateToWallet}
        />
        <TabItem
          iconName="account"
          label="Profile"
          isCurrent={true}
          onPress={handleNavigateToProfile}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: -25,
  },
  backButton: { padding: 8 },
  logoutButtonHeader: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  logoutButtonHeaderText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  headerUserInfo: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  userInitialsCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  userInitialsText: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  userTextContainer: { alignItems: "center", marginBottom: 10 },
  usernameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmailText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: { marginTop: 15, fontSize: 16, color: "#666" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  errorText: { fontSize: 18, color: "#333", marginTop: 15, marginBottom: 25 },
  retryButton: { width: 200 },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    paddingHorizontal: 20,
  },
  retryButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold",
    marginLeft: 10,
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 100, 
    paddingTop: 20,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 126, 29, 0.3)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeaderContainer: {
    backgroundColor: "rgba(255, 212, 100, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 15,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    marginBottom: 8,
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 14, color: "#666", marginBottom: 5 },
  roleValueContainer: { flexDirection: "row", alignItems: "center" },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  roleBadgeText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  editRoleButton: { padding: 5, marginLeft: 10 },
  editRoleButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#FF7E1D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  roleInfoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 212, 100, 0.08)",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  roleInfoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  label: { fontSize: 14, color: "#666", flex: 1 },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    paddingLeft: 10,
  },
  hobbiesText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginTop: 10,
    padding: 5,
  },
  changePasswordButton: { marginTop: 10, marginBottom: 25 },
  changePasswordButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
  },
  changePasswordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomPadding: { height: 70 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    elevation: 10,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 126, 29, 0.1)",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  dropdownIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  dropdownOptionText: { flex: 1, marginLeft: 15 },
  dropdownOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  dropdownOptionDescription: { fontSize: 13, color: "#666", lineHeight: 18 },
  dropdownCancel: {
    padding: 15,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 5,
  },
  dropdownCancelText: { fontSize: 16, color: "#FF7E1D", fontWeight: "600" },
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
  tabLabel: { fontSize: 12, marginTop: 4, fontWeight: "bold" },
});

const roleSwitchStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF7E1D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  okButton: {
    width: '100%',
  },
  okButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  okButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileViewScreen;