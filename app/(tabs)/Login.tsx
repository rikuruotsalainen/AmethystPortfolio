import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Nappi from '@/components/Button';
import {
  GoogleSignin,
  statusCodes,
  SignInResponse,
} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import BirthdayModal from '@/components/DatePicker';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    '946110492595-2boqsje3qba3aoj6uo3npvsooj8rrfp0.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: [
    'profile',
    'email',
    'openid',
    'https://www.googleapis.com/auth/user.birthday.read',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
});

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showModal, setShowModal] = useState(false); // State for modal visibility

  const signInWithGoogle = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: SignInResponse = await GoogleSignin.signIn();

      if (userInfo.data) {
        const { idToken, user } = userInfo.data;

        if (idToken) {
          const googleCredential = auth.GoogleAuthProvider.credential(idToken);
          const userCredential = await auth().signInWithCredential(
            googleCredential
          );
          const firebaseUser = userCredential.user;

          console.log('User signed in with Firebase:', firebaseUser);

          const { accessToken } = await GoogleSignin.getTokens();

          let userBirthday = null;

          if (accessToken) {
            const response = await fetch(
              `https://people.googleapis.com/v1/people/me?personFields=birthdays`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            const data = await response.json();
            console.log('Full People API Response:', data);

            if (data && data.birthdays && data.birthdays.length > 0) {
              const birthday = data.birthdays[0].date;
              console.log('User Birthday:', birthday);
              userBirthday = birthday;
            } else {
              console.log(
                'Birthday is not available or not found in the response.'
              );
            }
          } else {
            console.log('Access token is not available.');
          }

          const givenName = user.givenName || 'Guest';
          navigation.navigate('Menu', { givenName, userBirthday });
        } else {
          console.error('idToken is not available:', userInfo);
          Alert.alert('Sign-In Error', 'No valid idToken returned.');
        }
      } else {
        console.error('userInfo.data is null:', userInfo);
        Alert.alert('Sign-In Error', 'No valid user information returned.');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const navigateAsGuest = () => {
    setShowModal(true); // Avataan birthday modaali kun kirjaudutaan vieraana
  };

  const handleSubmitBirthday = (birthday: { day: number; month: number }) => {
    const givenName = 'Guest';
    setShowModal(false); // Kun pvm valittu, suljetaan modaali
    navigation.navigate('Menu', { givenName, userBirthday: birthday });
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {isSigningIn ? (
          <ActivityIndicator size="large" color="#ffffff" />
        ) : (
          <>
            <Nappi title="Login with Google" onPress={signInWithGoogle} />
            <Nappi title="Continue as a guest" onPress={navigateAsGuest} />
          </>
        )}
      </View>

      {showModal && (
        <BirthdayModal
          isVisible={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitBirthday}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '40%',
  },
});

export default LoginScreen;
