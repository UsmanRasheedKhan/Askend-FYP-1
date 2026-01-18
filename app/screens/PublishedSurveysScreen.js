import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

// Supabase Configuration
const SUPABASE_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4';

const PublishedSurveysScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [publishedSurveys, setPublishedSurveys] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadCurrentUser();
    }
  }, [isFocused]);

  // ✅ FIRST: Load current authenticated user
  const loadCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        Alert.alert("Session Expired", "Please sign in again");
        navigation.navigate('SignIn');
        return;
      }
      
      const userId = session.user.id;
      setCurrentUserId(userId);
      console.log('👤 Current User ID:', userId.substring(0, 8) + '...');
      
      // Now load surveys for this user
      await loadPublishedSurveys(userId);
      
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert("Error", "Failed to load user session");
    }
  };

  // ✅ SECOND: Load published surveys ONLY for current user
  const loadPublishedSurveys = async (userId) => {
    try {
      setRefreshing(true);
      
      // ✅ GET JWT TOKEN
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        Alert.alert("Session Expired", "Please sign in again");
        return;
      }
      
      console.log('🔍 Fetching published surveys for user:', userId.substring(0, 8) + '...');
      
      // ✅ IMPORTANT: Filter by BOTH status=published AND user_id=currentUser
      // Using RPC for better filtering or direct query
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/surveys?select=*&and=(status.eq.published,user_id.eq.${userId})&order=created_at.desc`, 
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        // Try alternative query format
        console.log('Trying alternative query format...');
        const altResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/surveys?select=*&status=eq.published&user_id=eq.${userId}&order=created_at.desc`, 
          {
            method: 'GET',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!altResponse.ok) {
          const errorText = await altResponse.text();
          console.error('Error Response:', errorText);
          throw new Error(`Failed to fetch surveys: ${altResponse.status}`);
        }
        
        const surveys = await altResponse.json();
        console.log('✅ Published Surveys fetched (alternative):', surveys.length);
        processSurveys(surveys);
      } else {
        const surveys = await response.json();
        console.log('✅ Published Surveys fetched:', surveys.length);
        processSurveys(surveys);
      }
      
    } catch (error) {
      console.error('Error loading published surveys:', error);
      
      // Fallback: Try using supabase client directly
      try {
        console.log('🔄 Trying fallback with supabase client...');
        const { data: surveys, error: supabaseError } = await supabase
          .from('surveys')
          .select('*')
          .eq('status', 'published')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw supabaseError;
        }
        
        console.log('✅ Fallback successful:', surveys?.length || 0);
        processSurveys(surveys || []);
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        Alert.alert(
          "Connection Error", 
          `Failed to load your surveys.\n\nError: ${error.message}`
        );
        setPublishedSurveys([]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Helper function to process surveys
  const processSurveys = (surveys) => {
    const transformedSurveys = surveys.map(survey => ({
      id: survey.id.toString(),
      title: survey.title || "Untitled Survey",
      description: survey.description || "No description provided",
      category: survey.category || "General",
      plan: survey.plan || 'basic',
      planName: survey.plan_name || 'Basic Plan',
      isPublicForm: survey.is_public_form || false,
      responsesCollected: survey.responses_collected || 0,
      totalResponses: survey.total_responses || 100,
      price: survey.price || 300,
      questions: survey.questions || [],
      demographicFilters: survey.demographic_filters || {},
      createdAt: survey.created_at || new Date().toISOString(),
      updatedAt: survey.updated_at || new Date().toISOString(),
      status: survey.status || 'published',
      isDraft: survey.is_draft || false,
      user_id: survey.user_id,
      // Add these for preview compatibility
      formHeading: survey.title || "Untitled Survey",
      formDescription: survey.description || "No description provided"
    }));
    
    console.log('📊 Surveys loaded for current user:', transformedSurveys.length);
    if (transformedSurveys.length > 0) {
      console.log('Sample survey:', {
        title: transformedSurveys[0].title,
        user_id: transformedSurveys[0].user_id?.substring(0, 8) + '...'
      });
    }
    
    setPublishedSurveys(transformedSurveys);
  };

  const onRefresh = async () => {
    if (currentUserId) {
      await loadPublishedSurveys(currentUserId);
    } else {
      await loadCurrentUser();
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      return 'Recent';
    }
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'basic': return '#4CAF50';
      case 'standard': return '#FF9800';
      case 'premium': return '#E91E63';
      case 'custom': return '#7C58FF';
      default: return '#FF7800';
    }
  };

  const getPlanIcon = (plan) => {
    switch(plan) {
      case 'basic': return 'chart-line';
      case 'standard': return 'chart-bar';
      case 'premium': return 'chart-box';
      case 'custom': return 'cog';
      default: return 'chart-bar';
    }
  };

  const getDisplayPlanName = (planName) => {
    if (!planName) return 'Basic Plan';
    
    if (planName.toLowerCase().includes('plan')) {
      return planName;
    }
    
    return `${planName} Plan`;
  };

  const getProgressPercentage = (survey) => {
    if (!survey.totalResponses || survey.totalResponses === 0) return 0;
    return (survey.responsesCollected / survey.totalResponses) * 100;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    if (percentage >= 50) return '#FFC107';
    return '#F44336';
  };

  const handleViewSurvey = (survey) => {
    console.log('Viewing published survey:', survey.title);
    
    // Navigate to ViewPublishedSurveyScreen
    navigation.navigate('ViewPublishedSurveyScreen', { 
      survey: survey
    });
  };

  const handleDeleteSurvey = async (survey) => {
    Alert.alert(
      "Delete Survey",
      `Are you sure you want to delete "${survey.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // ✅ GET JWT TOKEN
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              
              if (!token) {
                Alert.alert("Session Expired", "Please sign in again");
                return;
              }
              
              // ✅ IMPORTANT: Verify this survey belongs to current user
              if (survey.user_id !== currentUserId) {
                Alert.alert("Unauthorized", "You cannot delete this survey");
                return;
              }
              
              const deleteResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/surveys?id=eq.${survey.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Prefer': 'return=minimal'
                  }
                }
              );

              if (!deleteResponse.ok) {
                throw new Error('Failed to delete survey from database');
              }

              const updatedSurveys = publishedSurveys.filter(s => s.id !== survey.id);
              setPublishedSurveys(updatedSurveys);
              
              Alert.alert("Success", "Survey deleted successfully!");
              
            } catch (error) {
              console.error('Error deleting survey:', error);
              Alert.alert("Error", "Failed to delete survey from database.");
            }
          }
        }
      ]
    );
  };

  const handleFinishSurvey = async (survey) => {
    Alert.alert(
      "Finish Survey",
      `Are you sure you want to mark "${survey.title}" as finished?\n\n✅ Survey will move to Finished Surveys\n✅ Finished count will update in Dashboard`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Finish Survey", 
          style: "default",
          onPress: async () => {
            try {
              console.log('Finishing survey:', survey.id, survey.title);
              
              // ✅ GET JWT TOKEN
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              
              if (!token) {
                Alert.alert("Session Expired", "Please sign in again");
                return;
              }
              
              // ✅ IMPORTANT: Verify this survey belongs to current user
              if (survey.user_id !== currentUserId) {
                Alert.alert("Unauthorized", "You cannot modify this survey");
                return;
              }
              
              // ✅ UPDATE survey status to 'finished'
              const updateResponse = await fetch(
                `${SUPABASE_URL}/rest/v1/surveys?id=eq.${survey.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    status: 'finished',
                    is_draft: false,
                    updated_at: new Date().toISOString()
                  })
                }
              );

              console.log('Update response status:', updateResponse.status);
              
              if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Error finishing survey:', errorText);
                throw new Error('Failed to finish survey in database');
              }

              // ✅ Remove from local state
              const updatedSurveys = publishedSurveys.filter(s => s.id !== survey.id);
              setPublishedSurveys(updatedSurveys);
              
              // ✅ SUCCESS - Show options
              Alert.alert(
                "Survey Finished Successfully! ✅", 
                `"${survey.title}" has been moved to Finished Surveys.`,
                [
                  { 
                    text: "Go to Dashboard",
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [
                          { 
                            name: 'CreatorDashboard', 
                            params: { 
                              refresh: true,
                              showMessage: `"${survey.title}" marked as finished!`
                            } 
                          }
                        ],
                      });
                    }
                  },
                  {
                    text: "Stay Here",
                    style: 'cancel',
                    onPress: () => {
                      if (currentUserId) {
                        loadPublishedSurveys(currentUserId);
                      }
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('Error finishing survey:', error);
              Alert.alert(
                "Error Finishing Survey", 
                "Failed to finish survey. Please try again."
              );
            }
          }
        }
      ]
    );
  };

  const handleViewAnalytics = (survey) => {
    const progressPercentage = getProgressPercentage(survey);
    
    Alert.alert(
      `📊 Analytics for: ${survey.title}`,
      `📝 Description: ${survey.description}\n\n` +
      `🏷️ Category: ${survey.category}\n` +
      `🌐 Type: ${survey.isPublicForm ? "Public Form" : "Private Form"}\n` +
      `📈 Progress: ${survey.responsesCollected}/${survey.totalResponses} responses\n` +
      `🎯 Completion: ${progressPercentage.toFixed(1)}%\n` +
      `💰 Estimated Value: PKR ${survey.price}\n` +
      `📅 Published: ${formatDate(survey.createdAt)}\n` +
      `🔄 Last Updated: ${formatDate(survey.updatedAt)}\n` +
      `👤 User ID: ${survey.user_id?.substring(0, 8)}...`,
      [
        { text: "OK" }
      ]
    );
  };

  const EmptyPublishedState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="send-check" 
        size={80} 
        color="#FFD464" 
      />
      <Text style={styles.emptyStateTitle}>No Published Surveys</Text>
      <Text style={styles.emptyStateSubtitle}>
        You haven't published any surveys yet. Create and publish your first survey!
      </Text>
      <TouchableOpacity 
        style={styles.createSurveyButton}
        onPress={() => navigation.navigate('CreateNewSurvey')}
      >
        <LinearGradient
          colors={['#FF7800', '#FFD464']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createButtonGradient}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.createButtonText}>Create New Survey</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const PublishedSurveyCard = ({ survey, index }) => {
    const progressPercentage = getProgressPercentage(survey);
    const progressColor = getProgressColor(progressPercentage);
    const isCompleted = progressPercentage >= 100;

    return (
      <TouchableOpacity 
        style={styles.surveyCardTouchable}
        onPress={() => handleViewSurvey(survey)}
        activeOpacity={0.7}
      >
        <View style={styles.surveyCard}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF8E1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleSection}>
                <View style={styles.titleRow}>
                  <View style={[styles.surveyIcon, { backgroundColor: getPlanColor(survey.plan) }]}>
                    <MaterialCommunityIcons 
                      name={getPlanIcon(survey.plan)} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={styles.surveyTitle} numberOfLines={2}>
                    {survey.title}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  isCompleted ? styles.completedBadge : styles.liveBadge
                ]}>
                  <MaterialCommunityIcons 
                    name={isCompleted ? "check-circle" : "check-circle"} 
                    size={14} 
                    color={isCompleted ? "#fff" : "#4CAF50"} 
                  />
                  <Text style={[
                    styles.statusText,
                    isCompleted ? styles.completedText : styles.liveText
                  ]}>
                    {isCompleted ? 'COMPLETED' : 'LIVE'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedSurvey(selectedSurvey?.id === survey.id ? null : survey);
                }}
              >
                <MaterialIcons name="more-vert" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.surveyDescription} numberOfLines={2}>
              {survey.description}
            </Text>

            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="chart-bar" size={16} color="#666" />
                <Text style={styles.statText}>
                  {getDisplayPlanName(survey.planName)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialIcons name="category" size={16} color="#666" />
                <Text style={styles.statText}>
                  {survey.category}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name={survey.isPublicForm ? "earth" : "lock"} 
                  size={16} 
                  color="#666" 
                />
                <Text style={styles.statText}>
                  {survey.isPublicForm ? "Public" : "Private"}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>
                  {isCompleted ? '✅ Completed' : 'Responses Progress'}
                </Text>
                <Text style={[
                  styles.progressPercentage,
                  isCompleted && styles.completedPercentage
                ]}>
                  {progressPercentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(progressPercentage, 100)}%`,
                      backgroundColor: progressColor
                    }
                  ]}
                />
              </View>
              
              <View style={styles.progressStats}>
                <Text style={styles.progressCount}>
                  {survey.responsesCollected} collected
                </Text>
                <Text style={styles.progressTotal}>
                  of {survey.totalResponses} total
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                Published {formatDate(survey.createdAt)}
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.analyticsButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleViewAnalytics(survey);
                  }}
                >
                  <MaterialIcons name="analytics" size={18} color="#fff" />
                  <Text style={styles.analyticsButtonText}>View Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedSurvey?.id === survey.id && (
              <View style={styles.dropdownMenu}>
                {!isCompleted && (
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => {
                      handleFinishSurvey(survey);
                      setSelectedSurvey(null);
                    }}
                  >
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4CAF50" />
                    <Text style={[styles.menuItemText, { color: '#4CAF50' }]}>Finish Survey</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.deleteMenuItem]}
                  onPress={() => {
                    handleDeleteSurvey(survey);
                    setSelectedSurvey(null);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.menuItemText, styles.deleteMenuText]}>Delete Survey</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FF7800", "#FFD464"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Published Surveys</Text>
            <Text style={styles.headerSubtitle}>
              {publishedSurveys.length} survey{publishedSurveys.length !== 1 ? 's' : ''} published
            </Text>
            {currentUserId && (
              <Text style={styles.userIdText}>
                User: {currentUserId.substring(0, 8)}...
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <MaterialIcons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7800']}
            tintColor="#FF7800"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {publishedSurveys.length === 0 ? (
          <EmptyPublishedState />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="chart-bar" size={30} color="#FF7800" />
                <Text style={styles.statNumber}>{publishedSurveys.length}</Text>
                <Text style={styles.statLabel}>Active Surveys</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-circle" size={30} color="#4CAF50" />
                <Text style={styles.statNumber}>
                  {publishedSurveys.reduce((sum, survey) => sum + survey.responsesCollected, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Responses</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={{ fontSize: 30, color: "#7C58FF", fontWeight: 'bold' }}>RS</Text>
                <Text style={styles.statNumber}>
                  {publishedSurveys.reduce((sum, survey) => sum + survey.price, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </View>

            <View style={styles.surveysList}>
              <Text style={styles.sectionTitle}>Your Published Surveys</Text>
              {publishedSurveys.map((survey, index) => (
                <PublishedSurveyCard 
                  key={survey.id} 
                  survey={survey} 
                  index={index}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={styles.createNewSurveyButton}
              onPress={() => navigation.navigate('CreateNewSurvey')}
            >
              <LinearGradient
                colors={['#FF7800', '#FFD464']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createNewSurveyGradient}
              >
                <MaterialIcons name="add" size={24} color="#fff" />
                <Text style={styles.createNewSurveyText}>Create New Survey</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  userIdText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
  refreshButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createSurveyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#FF7800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  surveysList: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  createNewSurveyButton: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF7800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  createNewSurveyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  createNewSurveyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  surveyCardTouchable: {
    marginBottom: 15,
  },
  surveyCard: {
    borderRadius: 15,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD464',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  surveyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  liveBadge: {
    backgroundColor: '#E8F5E9',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  liveText: {
    color: '#4CAF50',
  },
  completedText: {
    color: '#fff',
  },
  menuButton: {
    padding: 4,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  progressSection: {
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF7800',
  },
  completedPercentage: {
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressCount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  progressTotal: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 15,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF7800',
  },
  analyticsButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  deleteMenuText: {
    color: '#FF6B6B',
  },
});

export default PublishedSurveysScreen;