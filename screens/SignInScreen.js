import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Theme from '../components/Theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignInScreen = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      emailOrPhone: '',
      password: '',
    };

    // Email/Phone validation
    if (!emailOrPhone) {
      newErrors.emailOrPhone = 'Email or phone number is required';
      isValid = false;
    } else if (emailOrPhone.includes('@')) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailOrPhone)) {
        newErrors.emailOrPhone = 'Please enter a valid email address';
        isValid = false;
      }
    } else {
      // Phone validation
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(emailOrPhone)) {
        newErrors.emailOrPhone = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters long';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const response = await axios.post(
        `https://newapi.odhpay.com/register/user_login/`,
        {
          "email_or_number": emailOrPhone,
          "password": password,
        },
        { headers }
      );

      if (response.status === 200) {
        console.log(response.data);
        navigation.navigate('MainApp', { screen: 'HomeTab' })
        await AsyncStorage.setItem("access_token", response.data.access_token);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.status, error.response?.data);

        if (error.response?.status === 400) {
          setErrors(prev => ({ ...prev, emailOrPhone: 'Invalid email/phone or password' }));
          // Alert.alert("Error", "Invalid email/phone or password");
        } else if (error.response?.status === 401) {
          Alert.alert("Error", "Unauthorized access");
        } else {
          Alert.alert("Error", "Failed to sign in. Please try again.");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.form}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={[styles.inputContainer, errors.emailOrPhone && styles.inputError]}>
          <MaterialIcons name="person" size={20} color={Theme.colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email or phone number"
            value={emailOrPhone}
            onChangeText={(text) => {
              setEmailOrPhone(text);
              setErrors(prev => ({ ...prev, emailOrPhone: '' }));
            }}
            keyboardType={"numeric"}
            autoCapitalize="none"
            maxLength={10}
          />
        </View>
        {errors.emailOrPhone ? (
          <Text style={styles.errorText}>{errors.emailOrPhone}</Text>
        ) : null}

        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputContainer, errors.password && styles.inputError]}>
          <MaterialIcons name="lock-outline" size={20} color={Theme.colors.primary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors(prev => ({ ...prev, password: '' }));
            }}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={!showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={Theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        <View style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignSelf: 'center', marginTop: 16, padding: 8 }}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={{ color: "black", textDecorationLine: 'underline' }}>New Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reset Password</Text>

            <TouchableOpacity
              style={styles.resetOption}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('ForgotPassword');
              }}
            >
              <MaterialIcons name="chat" size={24} color={Theme.colors.primary} />
              <Text style={styles.optionText}>Reset via SMS</Text>
              <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetOption}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('ForgotPasswordScreen', { method: 'email' });
              }}
            >
              <MaterialIcons name="mail" size={24} color={Theme.colors.primary} />
              <Text style={styles.optionText}>Reset via Email</Text>
              <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.secondary,
  },
  form: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Theme.colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Theme.colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordLink: {
    alignSelf: 'center',
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 24,
  },
  resetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: Theme.colors.text,
    marginLeft: 16,
  },
});

export default SignInScreen;