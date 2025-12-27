import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LoginSignUp() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const predefinedPhoneNumber = '+11';
  const predefinedEmail = 'a';

  const handleSendOTP = () => {
    if (phoneNumber === predefinedPhoneNumber || email === predefinedEmail) {
      navigation.navigate('OTPScreen', { phoneNumber, email });
    } else {
      Alert.alert("Error", "Phone number or email is incorrect.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Just need phone number or email to login or create a new account
        </Text>

        <TextInput
          style={styles.input}
          placeholder="+8882201101"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <Text style={styles.or}>or</Text>
        <TextInput
          style={styles.input}
          placeholder="ramaeralegal@gmail.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.terms}>
          By Login or Register, you accept the terms of use and our privacy policy.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSendOTP}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.smsText}>Send code to SMS?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.secondary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    marginTop: 40,
  },

  input: {
    width: "100%",
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: Theme.colors.secondary,
  },
  or: {
    color: "black",
    marginVertical: 5,
  },
  terms: {
    fontSize: 12,
    color: "gray",
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#8A2BE2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: Theme.colors.secondary,
    fontSize: 16,
  },
  smsText: {
    color: "#8A2BE2",
    fontSize: 14,
  },
});



