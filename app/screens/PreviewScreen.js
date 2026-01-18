import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// --- Small visual helpers ---
const RadioVisual = ({ selected }) => (
    <View style={[styles.visualCircle, selected && styles.visualCircleSelected]}>
        {selected && <View style={styles.visualDot} />}
    </View>
);

const CheckboxVisual = ({ checked }) => (
    checked ? (
        <View style={[styles.visualCheckbox, styles.visualCheckboxChecked]}>
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
        </View>
    ) : (
        <View style={styles.visualCheckbox} />
    )
);

// Star component
const StarRatingVisual = ({ maxStars = 5, initialRating = 3.5 }) => {
    const stars = [];
    const fullStars = Math.floor(initialRating);
    const hasHalfStar = initialRating - fullStars >= 0.5;

    for (let i = 1; i <= maxStars; i++) {
        let name = 'star-outline';
        let color = '#FFD464';

        if (i <= fullStars) {
            name = 'star';
        } else if (i === fullStars + 1 && hasHalfStar) {
            name = 'star-half-full';
        }

        stars.push(
            <MaterialCommunityIcons
                key={i}
                name={name}
                size={34} 
                color={color}
                style={{ marginHorizontal: 2 }}
            />
        );
    }

    return (
        <View style={styles.starsContainer}>
            <View style={styles.starsRow}>
                {stars}
            </View>
            <View style={styles.starLabelsRow}>
                <Text style={styles.starLabelLeft}>Not likely</Text>
                <Text style={styles.starLabelRight}>Very likely</Text>
            </View>
        </View>
    );
};

// Linear Scale / Slider Visual
const LinearScaleVisual = ({ min = 1, max = 5, initialValue = 3 }) => {
    const scale = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
        <View style={styles.linearScaleContainer}>
            <View style={styles.linearScaleNumbers}>
                {scale.map(num => (
                    <Text 
                        key={num} 
                        style={[
                            styles.linearScaleNumber, 
                            num === initialValue && styles.linearScaleNumberSelected
                        ]}
                    >
                        {num}
                    </Text>
                ))}
            </View>
            <View style={styles.linearScaleLabels}>
                <Text style={styles.linearScaleLabelLeft}>Strongly Dislike</Text>
                <Text style={styles.linearScaleLabelRight}>Strongly Like</Text>
            </View>
        </View>
    );
};

// --- Question Rendering Component (Dynamic) ---
const renderQuestion = (question, index) => {
    if (!question) return null;
    
    const questionNumber = `Q${index + 1}`;
    const { questionType, questionText, options, isRequired, media } = question || {};

    let actualOptions = [];
    if (options) {
        if (Array.isArray(options)) {
            actualOptions = options;
        } else if (typeof options === 'object') {
            actualOptions = Object.values(options);
        }
    }
    
    if (!actualOptions || actualOptions.length === 0) {
        if (questionType === 'multiple_choice' || questionType === 'checkboxes' || questionType === 'dropdown') {
            actualOptions = ["Option 1", "Option 2", "Option 3"];
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
                    {actualOptions.map((option, optIndex) => (
                        <View key={optIndex} style={[styles.optionRow, optIndex === actualOptions.length - 1 && styles.lastOptionRow]}>
                            <RadioVisual selected={index === 0 && optIndex === 0} />
                            <Text style={styles.optionText}>{option}</Text>
                        </View>
                    ))}
                </View>
            );
            break;

        case 'checkboxes':
            content = (
                <View style={styles.optionsContainer}>
                    {actualOptions.map((option, optIndex) => (
                        <View key={optIndex} style={[styles.optionRow, optIndex === actualOptions.length - 1 && styles.lastOptionRow]}>
                            <CheckboxVisual checked={index === 1 && optIndex < 3} />
                            <Text style={styles.optionText}>{option}</Text>
                        </View>
                    ))}
                </View>
            );
            break;

        case 'long_answer': 
            content = (
                <View style={[styles.longTextInputContainer, styles.longAnswerHeight]}>
                    <TextInput
                        style={styles.longTextInput}
                        placeholder={question.placeholder || "Share your thoughts and suggestions..."} 
                        multiline={true}
                        numberOfLines={4}
                        editable={false}
                        placeholderTextColor="#999"
                        textAlignVertical="top" 
                    />
                </View>
            );
            break;

        case 'short_answer':
            content = (
                <View style={[styles.longTextInputContainer, styles.shortAnswerHeight]}>
                    <TextInput
                        style={styles.longTextInput}
                        placeholder={question.placeholder || "Type your answer here..."}
                        multiline={false} 
                        editable={false}
                        placeholderTextColor="#999"
                    />
                </View>
            );
            break;
            
        case 'rating': 
            content = (
                <View style={styles.ratingContainer}>
                    <StarRatingVisual initialRating={3.5} /> 
                </View>
            );
            break;

        case 'linear_scale': 
        case 'linear_rating': 
            content = (
                <View style={styles.ratingContainer}>
                    <LinearScaleVisual min={1} max={5} initialValue={3} />
                </View>
            );
            break;
            
        case 'dropdown': 
            content = (
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateText}>Select an option...</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={24} color="#555" />
                </View>
            );
            break;

        case 'file_upload': 
        case 'picture_upload': 
            content = (
                <View style={styles.uploadContainer}>
                    <MaterialIcons name="camera-alt" size={40} color="#FF7E1D" />
                    <Text style={styles.uploadText}>Tap to upload a picture</Text>
                </View>
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
                        editable={false}
                        placeholderTextColor="#999"
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
                        editable={false}
                        placeholderTextColor="#999"
                    />
                </View>
            );
            break;

        case 'time': 
            content = (
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateText}>10:30 AM</Text>
                    <MaterialCommunityIcons name="clock-outline" size={24} color="#555" />
                </View>
            );
            break;

        case 'date': 
            content = (
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateText}>01/15/2024</Text>
                    <MaterialCommunityIcons name="calendar-month-outline" size={24} color="#555" />
                </View>
            );
            break;

        default:
            content = (
                <View style={styles.fallbackContainer}>
                    <Text style={styles.fallbackText}>
                        Question type: {questionType || 'Not specified'}
                    </Text>
                    {actualOptions.length > 0 && (
                        <Text style={styles.debugText}>
                            Options: {actualOptions.join(', ')}
                        </Text>
                    )}
                </View>
            );
            break;
    }

    return (
        <View style={styles.questionCard} key={question.id || index}>
            {header}
            {mediaNode}
            {content}
        </View>
    );
};

// --- MAIN PREVIEW SCREEN COMPONENT ---
const PreviewScreen = ({ navigation, route }) => {
    const formData = route.params?.formData || {};

    // ✅ FIX: Safe extraction with defaults
    const formHeading = formData?.formHeading || "Untitled Survey";
    const formDescription = formData?.formDescription || "No description provided";
    
    // ✅ FIX: Ensure questions is always an array
    const questions = Array.isArray(formData?.questions) ? formData.questions : [];
    
    // ✅ Get draft ID from formData
    const draftId = formData.id || formData.draftId;

    // Debug
    React.useEffect(() => {
        if (formData) {
            console.log('Preview screen received form data:', formData);
            console.log('Draft ID:', draftId);
            console.log('Questions count:', questions.length);
        }
    }, [formData]);

    if (!formData || Object.keys(formData).length === 0) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#FF7800" />
                <Text style={{ fontSize: 18, color: '#666', marginTop: 20 }}>No survey data found</Text>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.goBackButton}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleEditSurvey = () => {
        navigation.goBack();
    };

    const handlePublishSurvey = () => {
        console.log('Validating survey before publishing...');
        
        // ✅ Validate entire form (heading, description, category, questions/options)
        const validationErrors = [];

        const category = formData?.selectedCategory || formData?.category;

        if (!formHeading || formHeading.trim() === '') {
            validationErrors.push('Form heading is required');
        }

        if (!formDescription || formDescription.trim() === '') {
            validationErrors.push('Form description is required');
        }

        if (!category) {
            validationErrors.push('Form category is required');
        }
        
        questions.forEach((question, index) => {
            const questionNumber = index + 1;
            
            // Check if question text is empty
            if (!question?.questionText || question.questionText.trim() === '') {
                validationErrors.push(`Question ${questionNumber}: question text is missing`);
            }
            
            // Check if question types with options have complete options
            if (['multiple_choice', 'checkboxes', 'dropdown'].includes(question?.questionType)) {
                const optionsArray = Array.isArray(question?.options)
                    ? question.options
                    : question?.options && typeof question.options === 'object'
                        ? Object.values(question.options)
                        : [];

                if (optionsArray.length === 0) {
                    validationErrors.push(`Question ${questionNumber}: no options provided`);
                } else {
                    // Check for empty options
                    const emptyOptions = optionsArray.filter(opt => !opt || opt.toString().trim() === '');
                    if (emptyOptions.length > 0) {
                        validationErrors.push(`Question ${questionNumber}: ${emptyOptions.length} option(s) are empty`);
                    }
                }
            }
        });
        
        // If there are validation errors, show alert and offer to edit
        if (validationErrors.length > 0) {
            const errorMessage = validationErrors.join('\n');
            Alert.alert(
                "Incomplete Survey Form",
                `Please complete the following before publishing:\n\n${errorMessage}\n\nAll questions must have text and complete options.`,
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Edit Survey", 
                        onPress: handleEditSurvey 
                    }
                ]
            );
            return;
        }
        
        console.log('Validation passed. Navigating to ChoosePlan with draftId:', draftId);
        
        // ✅ FIX: Pass draftId correctly
        navigation.navigate('ChoosePlanScreen', { 
            draftId: draftId,  // ✅ CORRECT: Pass draftId
            formData: formData,  // ✅ Pass complete form data
            surveyTitle: formHeading 
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.container}>
                    {/* Fixed Top Header */}
                    <View style={styles.fixedHeader}>
                        <View style={{ flexDirection: 'column' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                    <MaterialIcons name="arrow-back-ios" size={24} color="#333" />
                                </TouchableOpacity>

                                {/* Gradient text for "Survey Preview" */}
                                <MaskedView
                                    maskElement={<Text style={styles.headerTitleMask}>Survey Preview</Text>}
                                >
                                    <LinearGradient
                                        colors={['#FF7E1D', '#FFD464']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={[styles.headerTitle, { opacity: 0 }]}>Survey Preview</Text>
                                    </LinearGradient>
                                </MaskedView>
                            </View>

                            <Text style={styles.headerSubtitle}>Here's how your survey will appear to users.</Text>
                        </View>

                        <View style={styles.headerStatus}>
                            <View style={styles.greenDot} />
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
                                    {/* Form Title with Gradient */}
                                    <MaskedView
                                        maskElement={<Text style={styles.formTitleMask}>{formHeading}</Text>}
                                    >
                                        <LinearGradient
                                            colors={['#374151', '#693B32', '#92400E']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            <Text style={[styles.formTitle, { opacity: 0 }]}>{formHeading}</Text>
                                        </LinearGradient>
                                    </MaskedView>
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
                                <Text style={styles.noQuestionsText}>No questions added yet</Text>
                            </View>
                        )}

                    </ScrollView>

                    {/* Preview Actions (Fixed bottom buttons) */}
                    <View style={styles.previewActions}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditSurvey}>
                            <MaterialIcons name="edit" size={18} color="#FF7E1D" />
                            <Text style={styles.editButtonText}> Edit Survey</Text>
                        </TouchableOpacity>

                        <LinearGradient
                             colors={['#FFD464', '#FF7E1D']} 
                             start={{ x: 0, y: 0 }}
                             end={{ x: 1, y: 0 }}
                             style={styles.publishButtonGradient}
                        >
                            <TouchableOpacity style={styles.publishButton} onPress={handlePublishSurvey}>
                                <Text style={styles.publishButtonText}>Publish</Text>
                                <MaterialIcons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* Bottom message */}
                    <View style={styles.bottomMessageContainer}>
                        <Text style={styles.publishSuccessMessage}>
                            Ready to go live! Your survey looks amazing!
                        </Text>
                    </View>
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
    // --- Fixed Top Header ---
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
        paddingBottom: 2,
    },
    headerTitleMask: {
        fontSize: 20,
        fontWeight: '700',
        color: 'black', 
        paddingTop: 5,
        marginLeft: 6,
        backgroundColor: 'transparent',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        marginLeft: 42, 
        fontWeight: '500',
    },
    headerStatus: {
        width: 28,
        alignItems: 'flex-end',
        marginTop: -10,
    },
    greenDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#8EE07C',
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 160, 
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
    formTitleMask: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black', 
        backgroundColor: 'transparent',
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

    // --- Options (Radio/Checkbox) ---
    optionsContainer: {
        marginTop: 4,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 4,
    },
    lastOptionRow: {
        marginBottom: 0,
    },
    visualCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visualCircleSelected: {
        borderColor: '#FF7E1D',
    },
    visualDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF7E1D',
    },
    visualCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visualCheckboxChecked: {
        backgroundColor: '#FF7E1D',
        borderColor: '#FF7E1D',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
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
    linearScaleNumber: {
        width: 30,
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    linearScaleNumberSelected: {
        color: '#FF7E1D',
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
    dateInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0EDEA',
        borderRadius: 10,
        padding: 12,
        backgroundColor: '#FBFBFB',
        marginTop: 8,
        height: 48,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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
    uploadText: {
        marginTop: 8,
        fontSize: 14,
        color: '#FF7E1D',
        fontWeight: '600',
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
    debugText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
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

    // --- Fixed Bottom Action Bar ---
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 0,
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFDCA8',
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    editButtonText: {
        color: '#FF7E1D',
        fontWeight: '700',
        fontSize: 16,
        marginLeft: 6,
    },
    publishButtonGradient: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    publishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },

    // --- Bottom Message ---
    bottomMessageContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 4,
        paddingBottom: 15,
        backgroundColor: '#fff',
    },
    publishSuccessMessage: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
    },

    // --- Error State ---
    goBackButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#FF7E1D',
        borderRadius: 8,
    },
});

export default PreviewScreen;