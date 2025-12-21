import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

const parseQuestionList = (rawQuestions) => {
  if (!rawQuestions && rawQuestions !== 0) {
    return [];
  }

  if (Array.isArray(rawQuestions)) {
    return rawQuestions;
  }

  if (typeof rawQuestions === 'string') {
    try {
      const parsed = JSON.parse(rawQuestions);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse questions string', error);
      return [];
    }
  }

  if (rawQuestions && typeof rawQuestions === 'object') {
    return Object.values(rawQuestions);
  }

  return [];
};

const getQuestionKey = (question, index) => {
  if (!question) {
    return `question-${index}`;
  }
  if (question.id !== undefined && question.id !== null) {
    return question.id.toString();
  }
  if (question.questionId !== undefined && question.questionId !== null) {
    return question.questionId.toString();
  }
  return `question-${index}`;
};

const buildInitialResponses = (questionList = []) => {
  const initial = {};
  questionList.forEach((question, index) => {
    const key = getQuestionKey(question, index);
    if (question?.questionType === 'checkboxes') {
      initial[key] = [];
    } else if (['rating', 'linear_scale', 'linear_rating'].includes(question?.questionType)) {
      initial[key] = null;
    } else if (['file_upload', 'picture_upload'].includes(question?.questionType)) {
      initial[key] = null;
    } else {
      initial[key] = '';
    }
  });
  return initial;
};

const hydrateResponsesFromAnswers = (answerList = [], questionList = []) => {
  if (!Array.isArray(answerList) || answerList.length === 0) {
    return {};
  }

  const indexFallbackMap = new Map();
  answerList.forEach((entry, idx) => {
    const matchKey = entry?.questionId ?? entry?.question_id ?? null;
    if (matchKey !== null && matchKey !== undefined) {
      indexFallbackMap.set(matchKey.toString(), entry);
    }
    if (entry?.questionText) {
      indexFallbackMap.set(`text:${entry.questionText}`, entry);
    }
    indexFallbackMap.set(`idx:${idx}`, entry);
  });

  const hydrated = {};
  questionList.forEach((question, index) => {
    const key = getQuestionKey(question, index);
    const questionId = question?.id ?? question?.questionId;
    let answerEntry = null;

    if (questionId !== undefined && questionId !== null) {
      answerEntry = indexFallbackMap.get(questionId.toString());
    }

    if (!answerEntry && question?.questionText) {
      answerEntry = indexFallbackMap.get(`text:${question.questionText}`);
    }

    if (!answerEntry) {
      answerEntry = indexFallbackMap.get(`idx:${index}`);
    }

    if (answerEntry) {
      hydrated[key] = answerEntry.answer ?? '';
    }
  });

  return hydrated;
};

const ViewPublishedSurveyScreen = ({ navigation, route }) => {
  const incomingSurvey = route.params?.survey || {};
  const surveyIdFromParams = route.params?.surveyId || incomingSurvey?.id;
  const isFillMode = route.name === 'FillSurveyScreen' || route.params?.mode === 'fill';
  const readonlyResponses = route.params?.readonlyResponses;

  const [surveyData, setSurveyData] = useState(incomingSurvey);
  const [questions, setQuestions] = useState(() => parseQuestionList(incomingSurvey?.questions));
  const [responses, setResponses] = useState(() => buildInitialResponses(parseQuestionList(incomingSurvey?.questions)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const fillStartRef = useRef(Date.now());

  const formHeading = surveyData?.title || surveyData?.formHeading || 'Untitled Survey';
  const formDescription = surveyData?.description || surveyData?.formDescription || 'No description provided';

  useEffect(() => {
    if (route.params?.survey) {
      const updatedSurvey = route.params?.survey;
      setSurveyData(updatedSurvey);
      setQuestions(parseQuestionList(updatedSurvey?.questions));
    }
  }, [route.params?.survey]);

  useEffect(() => {
    setResponses(buildInitialResponses(questions));
    setActiveDropdown(null);
    fillStartRef.current = Date.now();
  }, [questions]);
  useEffect(() => {
    if (!readonlyResponses || !questions.length) {
      return;
    }
    const hydrated = hydrateResponsesFromAnswers(readonlyResponses, questions);
    if (Object.keys(hydrated).length > 0) {
      setResponses(prev => ({ ...prev, ...hydrated }));
    }
  }, [readonlyResponses, questions]);


  useEffect(() => {
    if (!isFillMode) {
      setActiveDropdown(null);
    }
  }, [isFillMode]);

  useEffect(() => {
    if (!isFillMode) {
      return;
    }
    if (questions.length > 0) {
      return;
    }
    if (!surveyIdFromParams) {
      return;
    }

    let isMounted = true;

    const fetchSurveyDetails = async () => {
      try {
        setIsLoadingSurvey(true);
        setHasLoadError(false);
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyIdFromParams)
          .single();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const parsedQuestions = parseQuestionList(data?.questions);
        setSurveyData(prev => ({ ...prev, ...data, questions: parsedQuestions }));
        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Error loading survey details:', error);
        if (isMounted) {
          setHasLoadError(true);
          Alert.alert('Unable to load survey', error.message || 'Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSurvey(false);
        }
      }
    };

    fetchSurveyDetails();

    return () => {
      isMounted = false;
    };
  }, [isFillMode, surveyIdFromParams, questions.length]);

  const handleSingleSelect = (key, value) => {
    if (!isFillMode) {
      return;
    }
    setResponses(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxToggle = (key, option) => {
    if (!isFillMode) {
      return;
    }
    setResponses(prev => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(option);
      const updated = exists ? current.filter(item => item !== option) : [...current, option];
      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  const mockFileAttach = (key) => {
    if (!isFillMode) {
      return;
    }
    const fakeFileName = `upload-${new Date().getTime()}.jpg`;
    handleSingleSelect(key, fakeFileName);
  };

  const getScaleRange = (question) => {
    const min = Number(question?.scaleMin) || 1;
    const max = Number(question?.scaleMax) || 5;
    if (Number.isNaN(min) || Number.isNaN(max) || max <= min) {
      return [1, 2, 3, 4, 5];
    }
    return Array.from({ length: max - min + 1 }, (_, idx) => min + idx);
  };

  const validateResponses = () => {
    const missing = [];
    questions.forEach((question, index) => {
      if (!question?.isRequired) {
        return;
      }
      const key = getQuestionKey(question, index);
      const value = responses[key];
      const isEmpty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        missing.push(question?.questionText || `Question ${index + 1}`);
      }
    });
    return missing;
  };

  const handleSubmit = async () => {
    if (!isFillMode || isSubmitting) {
      return;
    }

    const missing = validateResponses();
    if (missing.length) {
      const previewList = missing.slice(0, 3).map(item => `• ${item}`).join('\n');
      const suffix = missing.length > 3 ? '\n• ...and more' : '';
      Alert.alert(
        'Complete Required Questions',
        `${previewList}${suffix}` || 'Please answer all required questions.',
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const session = sessionData?.session;
      if (!session) {
        Alert.alert('Authentication Required', 'Please sign in again to submit responses.');
        setIsSubmitting(false);
        return;
      }

      const surveyIdNumeric = Number(surveyData?.id || surveyIdFromParams);
      if (!surveyIdNumeric) {
        Alert.alert('Missing Survey', 'Unable to determine which survey to submit.');
        setIsSubmitting(false);
        return;
      }

      const { data: existingRows, error: existingError } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', surveyIdNumeric)
        .eq('user_id', session.user.id);

      if (existingError) {
        throw existingError;
      }

      if (Array.isArray(existingRows) && existingRows.length > 0) {
        Alert.alert('Already Filled', 'You have already submitted this survey.');
        setIsSubmitting(false);
        return;
      }

      const formattedAnswers = questions.map((question, index) => ({
        questionId: question?.id || question?.questionId || index + 1,
        questionText: question?.questionText || `Question ${index + 1}`,
        questionType: question?.questionType || 'text',
        answer: responses[getQuestionKey(question, index)] ?? null,
      }));

      const timeTakenSeconds = Math.max(1, Math.round((Date.now() - (fillStartRef.current || Date.now())) / 1000));
      const deviceInfo = `${Platform.OS} ${Platform.Version || ''}`.trim();

      const rewardValue = Number(surveyData?.price) || 0;

      const { error: insertError } = await supabase
        .from('survey_responses')
        .insert([
          {
            survey_id: surveyIdNumeric,
            user_id: session.user.id,
            response_data: formattedAnswers,
            status: 'completed',
            completed_at: new Date().toISOString(),
            time_taken_seconds: timeTakenSeconds,
            device_info: deviceInfo,
            reward_amount: rewardValue,
            payment_status: 'pending',
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      const currentCount = Number(surveyData?.responses_collected ?? surveyData?.responsesCollected ?? 0);
      const nextCount = currentCount + 1;

      await supabase
        .from('surveys')
        .update({ responses_collected: nextCount })
        .eq('id', surveyIdNumeric);

      setSurveyData(prev => ({
        ...prev,
        responses_collected: nextCount,
        responsesCollected: nextCount,
      }));

      navigation.navigate('FillerDashboard', {
        refreshKey: Date.now(),
        defaultSurveyTab: 'filled',
        successSurveyTitle: formHeading,
        awardedAmount: rewardValue,
      });
    } catch (error) {
      console.error('Error submitting responses:', error);
      Alert.alert('Submission Failed', error.message || 'Unable to submit responses. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    console.log('ViewPublishedSurvey received data:', surveyData);
    console.log('Questions count:', questions.length);
  }, [surveyData, questions]);

  if (isLoadingSurvey) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7E1D" />
          <Text style={styles.loadingText}>Loading survey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!surveyData || Object.keys(surveyData).length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FF7800" />
        <Text style={{ fontSize: 18, color: '#666', marginTop: 20 }}>
          {hasLoadError ? 'Unable to load this survey' : 'No survey data found'}
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.goBackButton}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Question Rendering Component (View Only) ---
  const renderQuestion = (question, index) => {
    if (!question) {
      return null;
    }

    const questionNumber = `Q${index + 1}`;
    const { questionType, questionText, options, isRequired, media, placeholder } = question || {};
    const questionKey = getQuestionKey(question, index);
    const currentValue = responses[questionKey];
    const checkboxSelections = Array.isArray(currentValue) ? currentValue : [];

    let actualOptions = [];
    if (options) {
      if (Array.isArray(options)) {
        actualOptions = options;
      } else if (typeof options === 'object') {
        actualOptions = Object.values(options);
      }
    }

    actualOptions = actualOptions
      .map(option => {
        if (typeof option === 'string') {
          return option.trim();
        }
        if (option && typeof option === 'object') {
          return option.text || option.label || option.value || '';
        }
        return '';
      })
      .filter(Boolean);

    if (!actualOptions || actualOptions.length === 0) {
      if (questionType === 'multiple_choice' || questionType === 'checkboxes' || questionType === 'dropdown') {
        actualOptions = ['Option 1', 'Option 2', 'Option 3'];
      }
    }

    const mediaNode = media ? (
      <View style={styles.mediaContainer}>
        {media.type === 'image' ? (
          <Image
            source={{ uri: media.uri }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mediaIcon, { backgroundColor: media.iconColor || '#FFD464' }]}>
            <MaterialCommunityIcons
              name={media.iconName || 'image-outline'}
              size={28}
              color="#fff"
            />
          </View>
        )}
      </View>
    ) : null;

    const header = (
      <View style={styles.questionHeader}>
        <LinearGradient
          colors={['#FF7E1D', '#FFD464']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.questionNumberCircle}
        >
          <Text style={styles.questionNumberText}>{questionNumber}</Text>
        </LinearGradient>
        <View style={styles.questionHeaderText}>
          <Text style={styles.questionText}>{questionText || `Question ${index + 1}`}</Text>
          {isRequired && <Text style={styles.requiredMarker}>*</Text>}
        </View>
      </View>
    );

    let content;

    switch (questionType) {
      case 'multiple_choice':
      case 'radio_choice':
        content = (
          <View style={styles.optionsContainer}>
            {actualOptions.map((option, optIndex) => {
              const isSelected = currentValue === option;
              return (
                <TouchableOpacity
                  key={`${questionKey}-${optIndex}`}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  onPress={isFillMode ? () => handleSingleSelect(questionKey, option) : undefined}
                  activeOpacity={isFillMode ? 0.85 : 1}
                  disabled={!isFillMode}
                >
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
        break;

      case 'checkboxes':
        content = (
          <View style={styles.optionsContainer}>
            {actualOptions.map((option, optIndex) => {
              const isChecked = checkboxSelections.includes(option);
              return (
                <TouchableOpacity
                  key={`${questionKey}-${optIndex}`}
                  style={[styles.optionRow, isChecked && styles.optionRowSelected]}
                  onPress={isFillMode ? () => handleCheckboxToggle(questionKey, option) : undefined}
                  activeOpacity={isFillMode ? 0.85 : 1}
                  disabled={!isFillMode}
                >
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                    {isChecked && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={[styles.optionText, isChecked && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
        break;

      case 'long_answer':
        content = (
          <View style={[styles.longTextInputContainer, styles.longAnswerHeight]}>
            <TextInput
              style={styles.longTextInput}
              placeholder={placeholder || 'Share your thoughts and suggestions...'}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              textAlignVertical="top"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      case 'short_answer':
        content = (
          <View style={[styles.longTextInputContainer, styles.shortAnswerHeight]}>
            <TextInput
              style={styles.longTextInput}
              placeholder={placeholder || 'Type your answer here...'}
              placeholderTextColor="#999"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      case 'rating':
        content = (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(value => {
                  const isActive = Number(currentValue) >= value;
                  return (
                    <TouchableOpacity
                      key={`${questionKey}-star-${value}`}
                      onPress={isFillMode ? () => handleSingleSelect(questionKey, value) : undefined}
                      activeOpacity={isFillMode ? 0.8 : 1}
                      disabled={!isFillMode}
                    >
                      <MaterialCommunityIcons
                        name={isActive ? 'star' : 'star-outline'}
                        size={34}
                        color={isActive ? '#FFB84D' : '#C4C4C4'}
                        style={styles.ratingStar}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.starLabelsRow}>
                <Text style={styles.starLabelLeft}>Not likely</Text>
                <Text style={styles.starLabelRight}>Very likely</Text>
              </View>
            </View>
          </View>
        );
        break;

      case 'linear_scale':
      case 'linear_rating': {
        const scaleRange = getScaleRange(question);
        content = (
          <View style={styles.ratingContainer}>
            <View style={styles.linearScaleContainer}>
              <View style={styles.linearScaleNumbers}>
                {scaleRange.map(num => {
                  const isActive = Number(currentValue) === num;
                  return (
                    <TouchableOpacity
                      key={`${questionKey}-scale-${num}`}
                      style={[styles.linearScaleNumberBubble, isActive && styles.linearScaleNumberSelected]}
                      onPress={isFillMode ? () => handleSingleSelect(questionKey, num) : undefined}
                      activeOpacity={isFillMode ? 0.8 : 1}
                      disabled={!isFillMode}
                    >
                      <Text style={[styles.linearScaleNumber, isActive && styles.linearScaleNumberTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.linearScaleLabels}>
                <Text style={styles.linearScaleLabelLeft}>Strongly Dislike</Text>
                <Text style={styles.linearScaleLabelRight}>Strongly Like</Text>
              </View>
            </View>
          </View>
        );
        break;
      }

      case 'dropdown':
        content = (
          <View>
            <TouchableOpacity
              style={styles.dropdownSelector}
              onPress={() => {
                if (!isFillMode) {
                  return;
                }
                setActiveDropdown(activeDropdown === questionKey ? null : questionKey);
              }}
              activeOpacity={isFillMode ? 0.85 : 1}
              disabled={!isFillMode}
            >
              <Text style={currentValue ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                {currentValue || 'Select an option'}
              </Text>
              <MaterialIcons
                name={activeDropdown === questionKey ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#555"
              />
            </TouchableOpacity>
            {isFillMode && activeDropdown === questionKey && (
              <View style={styles.dropdownOptionsWrapper}>
                {actualOptions.map((option, optIndex) => (
                  <TouchableOpacity
                    key={`${questionKey}-dropdown-${optIndex}`}
                    style={styles.dropdownOptionRow}
                    onPress={() => {
                      handleSingleSelect(questionKey, option);
                      setActiveDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
        break;

      case 'file_upload':
      case 'picture_upload':
        content = (
          <TouchableOpacity
            style={[styles.uploadContainer, currentValue && styles.uploadContainerFilled]}
            onPress={() => mockFileAttach(questionKey)}
            activeOpacity={isFillMode ? 0.85 : 1}
            disabled={!isFillMode}
          >
            <MaterialIcons name={currentValue ? 'check-circle' : 'cloud-upload'} size={40} color="#FF7E1D" />
            <Text style={styles.uploadText}>
              {currentValue ? 'Mock file attached' : 'Tap to upload a file'}
            </Text>
            {currentValue && <Text style={styles.uploadFileName}>{currentValue}</Text>}
          </TouchableOpacity>
        );
        break;

      case 'phone':
      case 'phone_number':
        content = (
          <View style={styles.iconTextInputContainer}>
            <FontAwesome name="phone" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#999"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      case 'email':
        content = (
          <View style={styles.iconTextInputContainer}>
            <MaterialIcons name="email" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      case 'time':
        content = (
          <View style={styles.iconTextInputContainer}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="HH:MM"
              placeholderTextColor="#999"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      case 'date':
        content = (
          <View style={styles.iconTextInputContainer}>
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              value={currentValue || ''}
              onChangeText={(text) => handleSingleSelect(questionKey, text)}
              editable={isFillMode}
            />
          </View>
        );
        break;

      default:
        content = (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>
              Question type: {questionType || 'Not specified'}
            </Text>
          </View>
        );
        break;
    }

    return (
      <View style={styles.questionCard} key={questionKey}>
        {header}
        {mediaNode}
        {content}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* ✅ SIMPLE Header - No preview text */}
          <View style={styles.fixedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
              </TouchableOpacity>

              {/* ✅ Simple title - no gradient */}
              <Text style={styles.headerTitle}>{formHeading}</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Header Card */}
            <View style={styles.formHeader}>
              <View style={styles.formHeaderInner}>
                <View style={styles.formIconBox}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={28} color="#fff" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  {/* ✅ Simple form title - no gradient */}
                  <Text style={styles.formTitle}>{formHeading}</Text>
                  {/* Description */}
                  <Text style={styles.formDescription}>{formDescription}</Text>
                </View>
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>{questions.length} questions</Text>
                </View>
              </View>
            </View>

            {/* Questions Cards */}
            {questions.length > 0 ? (
              questions.map((question, index) => renderQuestion(question, index))
            ) : (
              <View style={styles.noQuestionsContainer}>
                <MaterialCommunityIcons name="help-circle-outline" size={40} color="#FFD464" />
                <Text style={styles.noQuestionsText}>No questions in this survey</Text>
              </View>
            )}

          </ScrollView>

          {isFillMode && questions.length > 0 && (
            <View style={styles.submitFooter}>
              <TouchableOpacity
                style={[styles.submitButtonWrapper, isSubmitting && styles.submitButtonDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#FF7E1D', '#FFB347']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  <MaterialIcons
                    name={isSubmitting ? 'hourglass-top' : 'send'}
                    size={22}
                    color="#fff"
                    style={styles.submitButtonIcon}
                  />
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Submitting...' : 'Submit responses'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.submitHint}>You can review your answers before sending.</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', 
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  // --- Simple Header ---
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF8F1', 
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDEA',
    paddingBottom: 20,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 6,
    marginTop: 4,
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 140, 
  },

  // --- Form Header Card ---
  formHeader: {
    marginTop: 0,
    marginBottom: 16,
  },
  formHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    borderLeftWidth: 0.001, 
    borderLeftColor: '#000',
    backgroundColor: '#FFF8F1',
    borderColor: '#000',
    borderWidth: 0.001,
  },
  formIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF7E1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  formDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  questionBadge: {
    position: 'absolute',
    top: -15,
    right: 0,
    backgroundColor: '#FFF7EE',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFDCA8',
    shadowColor: '#FF7E1D',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  questionBadgeText: {
    color: '#FF7E1D',
    fontWeight: '700',
    fontSize: 12,
  },

  // --- Question Card Styles ---
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 0, 
    borderColor: '#F0EDEA', 
    borderWidth: 1, 
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  questionNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  questionHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginRight: 4,
  },
  requiredMarker: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },

  // --- Options (Radio/Checkbox) - EMPTY ---
  optionsContainer: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0EDEA',
    backgroundColor: '#FBFBFB',
  },
  optionRowSelected: {
    borderColor: '#FFBF80',
    backgroundColor: '#FFF6EC',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#DADADA',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FF8A3C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF8A3C',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DADADA',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxBoxChecked: {
    borderColor: '#FF8A3C',
    backgroundColor: '#FF8A3C',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#C04D00',
  },

  // --- Media Styles ---
  mediaContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  mediaImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
  },
  mediaIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Long/Short Answer ---
  longTextInputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0EDEA',
    backgroundColor: '#FBFBFB',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  longAnswerHeight: {
    minHeight: 100,
    paddingVertical: 10,
  },
  shortAnswerHeight: {
    height: 48,
    justifyContent: 'center',
  },
  longTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },

  // --- Input with Icon ---
  iconTextInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EDEA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FBFBFB',
    marginTop: 8,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },

  // --- Rating ---
  ratingContainer: {
    marginTop: 10,
  },
  starsContainer: {
    backgroundColor: '#FBFBFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0EDEA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStar: {
    marginHorizontal: 2,
  },
  starLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  starLabelLeft: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  starLabelRight: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  
  // --- Linear Rating ---
  linearScaleContainer: {
    backgroundColor: '#FBFBFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0EDEA',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 8,
  },
  linearScaleNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  linearScaleNumberBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  linearScaleNumberSelected: {
    backgroundColor: '#FFE5CD',
    borderColor: '#FFB066',
  },
  linearScaleNumber: {
    width: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  linearScaleNumberTextActive: {
    color: '#C04D00',
    fontWeight: '700',
  },
  linearScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  linearScaleLabelLeft: {
    fontSize: 12,
    color: '#999',
  },
  linearScaleLabelRight: {
    fontSize: 12,
    color: '#999',
  },

  // --- Date / Time / Dropdown ---
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EDEA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FBFBFB',
    marginTop: 8,
  },
  dropdownOptionsWrapper: {
    borderWidth: 1,
    borderColor: '#FFE0C0',
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEFE0',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownPlaceholderText: {
    fontSize: 15,
    color: '#999',
  },
  dropdownSelectedText: {
    fontSize: 15,
    color: '#C04D00',
    fontWeight: '600',
  },
  
  // --- Picture Upload ---
  uploadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    borderWidth: 2,
    borderColor: '#FFDCA8',
    borderRadius: 10,
    borderStyle: 'dashed',
    backgroundColor: '#FFF8F1',
    marginTop: 8,
  },
  uploadContainerFilled: {
    borderStyle: 'solid',
    borderColor: '#FFB066',
    backgroundColor: '#FFF1E3',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF7E1D',
    fontWeight: '600',
  },
  uploadFileName: {
    marginTop: 4,
    fontSize: 12,
    color: '#A35613',
  },

  // --- Fallback Styles ---
  fallbackContainer: {
    padding: 15,
    backgroundColor: '#FFF8F1',
    borderRadius: 8,
    marginTop: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: '#FF7E1D',
    fontWeight: '600',
  },

  // --- No Questions State ---
  noQuestionsContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF8F1',
    borderRadius: 10,
    marginTop: 20,
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#FF7E1D',
    fontWeight: '600',
    marginTop: 10,
  },

  // --- Submit Footer ---
  submitFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2EEE9',
    backgroundColor: '#FFFFFF',
  },
  submitButtonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  submitHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  // --- Error State ---
  goBackButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF7E1D',
    borderRadius: 8,
  },
});

export default ViewPublishedSurveyScreen;