import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- CORE SCREEN IMPORTS ---
import PasswordUpdateScreen from "./app/screens/PasswordUpdateScreen";
import SignInScreen from "./app/screens/SignInScreen";
import SignUpScreen from "./app/screens/SignUpScreen";
import HomeScreen from "./app/screens/HomeScreen";
import RoleSelectionScreen from "./app/screens/RoleSelectionScreen";
import FillerDashboardScreen from "./app/screens/FillerDashboardScreen.js";
import CreatorDashboardScreen from "./app/screens/CreatorDashboardScreen.js";
import ForgotPasswordScreen from "./app/screens/ForgotPasswordScreen";
import OtpVerificationScreen from "./app/screens/OtpVerificationScreen";
import CreateNewSurveyScreen from "./app/screens/CreateNewSurveyScreen";
import PreviewScreen from './app/screens/PreviewScreen';
import DraftsScreen from './app/screens/DraftsScreen';
import ChoosePlanScreen from './app/screens/ChoosePlanScreen';
import PublishedSurveysScreen from './app/screens/PublishedSurveysScreen';
import FinishedSurveysScreen from './app/screens/FinishedSurveysScreen';
import ViewPublishedSurveyScreen from './app/screens/ViewPublishedSurveyScreen';
import ProfileViewScreen from './app/screens/ProfileViewScreen';
import ChangePassword from './app/screens/ChangePassword';
import WalletScreen from './app/screens/WalletScreen';
// --- PROFILE COMPLETION FLOW IMPORTS ---
import ProfileCompletionScreen from "./app/screens/ProfileCompletionScreen";
import ContactInfoScreen from "./app/screens/ContactInfoScreen.js";
import ProfessionalInfoScreen from "./app/screens/ProfessionalInfoScreen";
import InterestAndHobbiesScreen from "./app/screens/InterestAndHobbiesScreen";

const Stack = createNativeStackNavigator();

// ----------------------------------------------------------------
// Deep Linking Configuration
// ----------------------------------------------------------------
const linking = {
  prefixes: ["askend://"],
  config: {
    screens: {
      PasswordUpdateScreen: "update-password",
      SignIn: "auth/callback",
      Home: "home",
    },
  },
};

// ----------------------------------------------------------------

const AppNavigator = () => {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="SignIn"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* --- Authentication & Dashboard Screens --- */}
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="PasswordUpdateScreen" component={PasswordUpdateScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="FillerDashboard" component={FillerDashboardScreen} />
        <Stack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
        <Stack.Screen name="CreateNewSurvey" component={CreateNewSurveyScreen} />
        <Stack.Screen name="PreviewScreen" component={PreviewScreen} />
        <Stack.Screen name="DraftsScreen" component={DraftsScreen} />
        <Stack.Screen name="ChoosePlanScreen" component={ChoosePlanScreen} />
        <Stack.Screen name="PublishedSurveysScreen" component={PublishedSurveysScreen} />
        <Stack.Screen name="FinishedSurveysScreen"  component={FinishedSurveysScreen} />
        <Stack.Screen name="ViewPublishedSurveyScreen" component={ViewPublishedSurveyScreen} />
        <Stack.Screen name="FillSurveyScreen" component={ViewPublishedSurveyScreen} />
        <Stack.Screen name="ProfileViewScreen" component={ProfileViewScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="WalletScreen" component={WalletScreen} />
        
        {/* --- PROFILE COMPLETION FLOW (Steps 1, 2, 3, 4) --- */}
        <Stack.Screen name="ProfileCompletionScreen" component={ProfileCompletionScreen} />
        <Stack.Screen name="ContactInfo" component={ContactInfoScreen} />
        <Stack.Screen name="ProfessionalInfo" component={ProfessionalInfoScreen} />
        <Stack.Screen name="InterestAndHobbies" component={InterestAndHobbiesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;