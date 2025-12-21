import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { supabase } from '../../supabaseClient';

// Supabase Configuration
const SUPABASE_URL = 'https://oyavjqycsjfcnzlshdsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YXZqcXljc2pmY256bHNoZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTgwMjcsImV4cCI6MjA3NTczNDAyN30.22cwyIWSBmhLefCvobdbH42cPSTnw_NmSwbwaYvyLy4';

const DraftsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [drafts, setDrafts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadDrafts();
    }
  }, [isFocused]);

  const loadDrafts = async () => {
    try {
      setRefreshing(true);
      
      // ✅ GET JWT TOKEN
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        Alert.alert("Session Expired", "Please sign in again");
        return;
      }
      
      console.log('Fetching drafts with JWT token...');
      
      // ✅ USE TOKEN IN REST API
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/surveys?select=*&status=eq.draft&order=updated_at.desc`, 
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
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      const draftsData = await response.json();
      console.log('✅ Drafts fetched:', draftsData.length);
      
      const transformedDrafts = (draftsData || []).map(survey => {
        let questionsArray = [];
        try {
          if (survey.questions) {
            if (Array.isArray(survey.questions)) {
              questionsArray = survey.questions;
            } else if (typeof survey.questions === 'string') {
              questionsArray = JSON.parse(survey.questions);
            } else if (typeof survey.questions === 'object') {
              questionsArray = Object.values(survey.questions);
            }
          }
        } catch (parseError) {
          console.error('Error parsing questions:', parseError);
          questionsArray = [];
        }
        
        if (!Array.isArray(questionsArray)) {
          questionsArray = [];
        }
        
        return {
          id: survey.id.toString(),
          formHeading: survey.title || "Untitled Survey",
          formDescription: survey.description || "No description",
          selectedCategory: survey.category || "General",
          isPublicForm: survey.is_public_form || false,
          questions: questionsArray,
          demographicFilters: survey.demographic_filters || {},
          updatedAt: survey.updated_at || new Date().toISOString(),
          createdAt: survey.created_at || new Date().toISOString(),
          plan: survey.plan || 'basic',
          responses: survey.responses_collected || 0,
          price: survey.price || 0,
          user_id: survey.user_id // Added for debugging
        };
      });
      
      setDrafts(transformedDrafts);
      
    } catch (error) {
      console.error('Error loading drafts:', error);
      Alert.alert("Error", "Failed to load drafts from database");
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadDrafts();
  };

  // ✅ FIXED: handleEditDraft function
  const handleEditDraft = (draft) => {
    console.log('Editing draft with questions:', draft.questions);
    
    // Fix options if they're stored as object instead of array
    const fixedQuestions = (draft.questions || []).map((q, index) => {
      let optionsArray = [];
      if (q.options) {
        if (Array.isArray(q.options)) {
          optionsArray = q.options;
        } else if (typeof q.options === 'object') {
          optionsArray = Object.values(q.options);
        } else if (typeof q.options === 'string') {
          try {
            optionsArray = JSON.parse(q.options);
          } catch (e) {
            optionsArray = [q.options];
          }
        }
      }
      
      // Ensure minimum 3 options
      if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType)) {
        while (optionsArray.length < 3) {
          optionsArray.push('');
        }
      }
      
      return {
        id: q.id || index + 1,
        questionText: q.questionText || '',
        questionType: q.questionType || 'multiple_choice',
        options: optionsArray,
        isRequired: q.isRequired !== undefined ? q.isRequired : true,
        media: q.media || null
      };
    });
    
    // Ensure at least one question
    if (fixedQuestions.length === 0) {
      fixedQuestions.push({
        id: 1,
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', '', ''],
        isRequired: true,
        media: null
      });
    }
    
    const safeDraftData = {
      ...draft,
      questions: fixedQuestions
    };
    
    console.log('Safe draft data for editing:', safeDraftData);
    navigation.navigate('CreateNewSurvey', { draftData: safeDraftData });
  };

  const handleDeleteDraft = async (draft) => {
    Alert.alert(
      "Delete Draft",
      `Are you sure you want to delete "${draft.formHeading}"?`,
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
                `${SUPABASE_URL}/rest/v1/surveys?id=eq.${draft.id}`,
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
                throw new Error('Failed to delete draft');
              }

              const updatedDrafts = drafts.filter(d => d.id !== draft.id);
              setDrafts(updatedDrafts);
              
              Alert.alert("Success", "Draft deleted successfully!");
              
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert("Error", "Failed to delete draft from database");
            }
          }
        }
      ]
    );
  };

  const handlePreviewDraft = (draft) => {
    const safeFormData = {
      ...draft,
      questions: Array.isArray(draft.questions) ? draft.questions : []
    };
    
    console.log('Previewing draft with safe questions:', safeFormData.questions);
    navigation.navigate('PreviewScreen', { formData: safeFormData });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
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

  const getQuestionCountText = (questions) => {
    const count = questions?.length || 0;
    return `${count} question${count !== 1 ? 's' : ''}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Customer Feedback': '#FF6B6B',
      'Market Research': '#4ECDC4',
      'Employee Satisfaction': '#45B7D1',
      'Product Feedback': '#96CEB4',
      'Academic Research': '#FFEAA7',
      'Event Feedback': '#DDA0DD',
      'Healthcare Survey': '#98D8C8',
      'User Experience': '#F7DC6F',
      'Brand Awareness': '#BB8FCE',
      'Social Research': '#85C1E9'
    };
    return colors[category] || '#FF7800';
  };

  const EmptyDraftsState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="clipboard-text-outline" 
        size={80} 
        color="#FFD464" 
      />
      <Text style={styles.emptyStateTitle}>No Drafts Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        You haven't saved any survey drafts yet. Start creating your first survey!
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

  const DraftCard = ({ draft, index }) => (
    <TouchableOpacity 
      style={styles.draftCard}
      onPress={() => handleEditDraft(draft)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FFF8E1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.draftTitle} numberOfLines={2}>
              {draft.formHeading}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(draft.selectedCategory) }]}>
              <Text style={styles.categoryText}>{draft.selectedCategory || 'Uncategorized'}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSelectedDraft(selectedDraft === draft.id ? null : draft.id)}
          >
            <MaterialIcons name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.draftDescription} numberOfLines={2}>
          {draft.formDescription || 'No description provided'}
        </Text>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="help-circle-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {getQuestionCountText(draft.questions)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color="#666" />
            <Text style={styles.statText}>
              {draft.isPublicForm ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Updated {formatDate(draft.updatedAt)}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.previewButton}
              onPress={() => handlePreviewDraft(draft)}
            >
              <MaterialIcons name="visibility" size={18} color="#FF7800" />
              <Text style={styles.previewButtonText}>Preview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditDraft(draft)}
            >
              <MaterialIcons name="edit" size={18} color="#fff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedDraft === draft.id && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                handleEditDraft(draft);
                setSelectedDraft(null);
              }}
            >
              <MaterialIcons name="edit" size={20} color="#666" />
              <Text style={styles.menuItemText}>Edit Draft</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                handlePreviewDraft(draft);
                setSelectedDraft(null);
              }}
            >
              <MaterialIcons name="visibility" size={20} color="#666" />
              <Text style={styles.menuItemText}>Preview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={() => {
                handleDeleteDraft(draft);
                setSelectedDraft(null);
              }}
            >
              <MaterialIcons name="delete-outline" size={20} color="#FF6B6B" />
              <Text style={[styles.menuItemText, styles.deleteMenuText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>Survey Drafts</Text>
            <Text style={styles.headerSubtitle}>
              {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
            </Text>
          </View>
          
          <View style={{ width: 28 }} />
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
        {drafts.length === 0 ? (
          <EmptyDraftsState />
        ) : (
          <>
            <View style={styles.draftsList}>
              <Text style={styles.sectionTitle}>Your Drafts</Text>
              {drafts.map((draft, index) => (
                <DraftCard 
                  key={draft.id} 
                  draft={draft} 
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
  draftsList: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  draftCard: {
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
  draftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    padding: 4,
  },
  draftDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  statsSection: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
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
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD464',
    marginRight: 8,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF7800',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF7800',
  },
  editButtonText: {
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
  },
  deleteMenuItem: {
    borderBottomWidth: 0,
  },
  deleteMenuText: {
    color: '#FF6B6B',
  },
});

export default DraftsScreen;