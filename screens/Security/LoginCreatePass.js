import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Theme from '../../components/Theme';

const LoginCreatePass = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const handleContinue = () => {
    if (!isValidPassword(newPassword)) {
      setError('Password must be at least 8 characters, including a letter and a number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    navigation.navigate('VerificationCompleted');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create new password</Text>

      {/* New Password Input */}
      <Text style={styles.label}>Create password</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Enter your new password" 
          secureTextEntry={!isPasswordVisible} 
          value={newPassword} 
          onChangeText={setNewPassword} 
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
          <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Input */}
      <Text style={styles.label}>Confirm password</Text>
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Confirm your password" 
          secureTextEntry={!isConfirmPasswordVisible} 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
        />
        <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
          <Ionicons name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.passwordRequirements}>
        At least 8 characters, containing a letter and a number
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const isValidPassword = (password) => {
  return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Theme.colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  passwordRequirements: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: Theme.colors.secondary,
    textAlign: 'center',
    fontSize: 18,
  },
});

export default LoginCreatePass;
