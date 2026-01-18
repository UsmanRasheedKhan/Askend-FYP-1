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

const FinishedSurveysScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [finishedSurveys, setFinishedSurveys] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadFinishedSurveys();
    }
  }, [isFocused]);

  const loadFinishedSurveys = async () => {
    try {
      setRefreshing(true);
      
      // ✅ GET JWT TOKEN
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        Alert.alert("Session Expired", "Please sign in again");
        return;
      }
      
      console.log('Fetching finished surveys with JWT token...');
      
      // ✅ USE TOKEN IN REST API
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/surveys?select=*&status=eq.finished&order=updated_at.desc`, 
        {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`, // ✅ IMPORTANT
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response:', errorText);
        throw new Error(`Failed to fetch surveys: ${response.status}`);
      }

      const surveys = await response.json();
      console.log('✅ Finished Surveys fetched:', surveys.length);
      
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
        status: survey.status || 'finished',
        isDraft: survey.is_draft || false,
        user_id: survey.user_id // Added for debugging
      }));
      
      setFinishedSurveys(transformedSurveys);
      
    } catch (error) {
      console.error('Error loading finished surveys:', error);
      Alert.alert(
        "Connection Error", 
        `Failed to load finished surveys from database. Please check your internet connection.`
      );
      setFinishedSurveys([]);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadFinishedSurveys();
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

  const getCompletionPercentage = (survey) => {
    if (!survey.totalResponses || survey.totalResponses === 0) return 100;
    return (survey.responsesCollected / survey.totalResponses) * 100;
  };

  const handleRepublishSurvey = (survey) => {
    Alert.alert(
      "Re-publish Survey",
      `Do you want to re-publish "${survey.title}"?\n\nThis will move it back to Published Surveys.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Re-publish", 
          style: "default",
          onPress: async () => {
            try {
              // ✅ GET JWT TOKEN
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;
              
              if (!token) {
                Alert.alert("Session Expired", "Please sign in again");
                return;
              }
              
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
                    status: 'published',
                    updated_at: new Date().toISOString()
                  })
                }
              );

              if (!updateResponse.ok) {
                throw new Error('Failed to re-publish survey');
              }

              const updatedSurveys = finishedSurveys.filter(s => s.id !== survey.id);
              setFinishedSurveys(updatedSurveys);
              
              Alert.alert(
                "Survey Re-published! ✅", 
                `"${survey.title}" has been moved back to Published Surveys.`,
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
                    text: "Stay Here",
                    style: 'cancel',
                    onPress: () => {
                      loadFinishedSurveys();
                    }
                  }
                ]
              );
              
            } catch (error) {
              console.error('Error re-publishing survey:', error);
              Alert.alert("Error", "Failed to re-publish survey. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleDeleteSurvey = (survey) => {
    Alert.alert(
      "Delete Finished Survey",
      `Are you sure you want to delete "${survey.title}"?\n\nThis action cannot be undone.`,
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

              const updatedSurveys = finishedSurveys.filter(s => s.id !== survey.id);
              setFinishedSurveys(updatedSurveys);
              
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

  const handleViewAnalytics = (survey) => {
    const completionPercentage = getCompletionPercentage(survey);
    
    Alert.alert(
      `📊 Completed Survey: ${survey.title}`,
      `📝 Description: ${survey.description}\n\n` +
      `🏷️ Category: ${survey.category}\n` +
      `🌐 Type: ${survey.isPublicForm ? "Public Form" : "Private Form"}\n` +
      `✅ Final Results: ${survey.responsesCollected}/${survey.totalResponses} responses\n` +
      `🎯 Completion Rate: ${completionPercentage.toFixed(1)}%\n` +
      `💰 Total Value: PKR ${survey.price}\n` +
      `📅 Originally Published: ${formatDate(survey.createdAt)}\n` +
      `🏁 Finished On: ${formatDate(survey.updatedAt)}`,
      [
        { text: "OK" }
      ]
    );
  };

  const EmptyFinishedState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="check-circle-outline" 
        size={80} 
        color="#FFD464" 
      />
      <Text style={styles.emptyStateTitle}>No Finished Surveys</Text>
      <Text style={styles.emptyStateSubtitle}>
        You haven't finished any surveys yet. Finish a published survey to see it here!
      </Text>
      
      <View style={styles.tipBox}>
        <MaterialCommunityIcons name="lightbulb-on" size={20} color="#FF7800" />
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>How to finish a survey:</Text>
        </Text>
        <Text style={styles.tipSteps}>
          1. Go to Published Surveys{"\n"}
          2. Click ••• on a survey{"\n"}
          3. Select "Finish Survey"
        </Text>
      </View>
    </View>
  );

  const FinishedSurveyCard = ({ survey, index }) => {
    const completionPercentage = getCompletionPercentage(survey);

    return (
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
                { backgroundColor: '#E8F5E9' }
              ]}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={14} 
                  color="#4CAF50" 
                />
                <Text style={[
                  styles.statusText,
                  { color: '#4CAF50' }
                ]}>
                  FINISHED
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
              <Text style={{ fontSize: 14, color: "#666", fontWeight: 'bold' }}>RS</Text>
              <Text style={styles.statText}>
                {survey.price}
              </Text>
            </View>
          </View>

          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Final Results</Text>
              <Text style={styles.resultsPercentage}>
                {completionPercentage.toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.resultsBar}>
              <View 
                style={[
                  styles.resultsFill,
                  { 
                    width: `${Math.min(completionPercentage, 100)}%`,
                    backgroundColor: completionPercentage >= 100 ? '#4CAF50' : '#FF9800'
                  }
                ]}
              />
            </View>
            
            <View style={styles.resultsStats}>
              <Text style={styles.resultsCount}>
                {survey.responsesCollected} responses collected
              </Text>
              <Text style={styles.resultsTotal}>
                Target: {survey.totalResponses} responses
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>
                Finished {formatDate(survey.updatedAt)}
              </Text>
              <Text style={styles.publishedDate}>
                Published {formatDate(survey.createdAt)}
              </Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.analyticsButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewAnalytics(survey);
                }}
              >
                <MaterialIcons name="analytics" size={18} color="#fff" />
                <Text style={styles.analyticsButtonText}>View Results</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedSurvey?.id === survey.id && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  handleRepublishSurvey(survey);
                  setSelectedSurvey(null);
                }}
              >
                <MaterialCommunityIcons name="send" size={20} color="#FF9800" />
                <Text style={[styles.menuItemText, { color: '#FF9800' }]}>Re-publish</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, styles.deleteMenuItem]}
                onPress={() => {
                  handleDeleteSurvey(survey);
                  setSelectedSurvey(null);
                }}
              >
                <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
                <Text style={[styles.menuItemText, styles.deleteMenuText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
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
            <Text style={styles.headerTitle}>Finished Surveys</Text>
            <Text style={styles.headerSubtitle}>
              {finishedSurveys.length} survey{finishedSurveys.length !== 1 ? 's' : ''} completed
            </Text>
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
        {finishedSurveys.length === 0 ? (
          <EmptyFinishedState />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="flag-checkered" size={30} color="#FF7800" />
                <Text style={styles.statNumber}>{finishedSurveys.length}</Text>
                <Text style={styles.statLabel}>Finished Surveys</Text>
              </View>
              
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="check-circle" size={30} color="#FF9800" />
                <Text style={styles.statNumber}>
                  {finishedSurveys.reduce((sum, survey) => sum + survey.responsesCollected, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Responses</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={{ fontSize: 30, color: "#4CAF50", fontWeight: 'bold' }}>RS</Text>
                <Text style={styles.statNumber}>
                  {finishedSurveys.reduce((sum, survey) => sum + survey.price, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </View>

            <View style={styles.surveysList}>
              <Text style={styles.sectionTitle}>Completed Surveys</Text>
              {finishedSurveys.map((survey, index) => (
                <FinishedSurveyCard 
                  key={survey.id} 
                  survey={survey} 
                  index={index}
                />
              ))}
            </View>
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
    color: 'rgba(255, 255, 255, 0.9)',
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
    paddingTop: 60,
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
    marginBottom: 25,
  },
  tipBox: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFE8B3',
  },
  tipText: {
    fontSize: 14,
    color: '#664D00',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  tipBold: {
    fontWeight: '700',
  },
  tipSteps: {
    fontSize: 13,
    color: '#664D00',
    lineHeight: 20,
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
  surveyCard: {
    marginBottom: 15,
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
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  resultsSection: {
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resultsPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF7800',
  },
  resultsBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  resultsFill: {
    height: '100%',
    borderRadius: 4,
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultsCount: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  resultsTotal: {
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
  dateInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#FF7800',
    fontWeight: '600',
    marginBottom: 4,
  },
  publishedDate: {
    fontSize: 11,
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

export default FinishedSurveysScreen;