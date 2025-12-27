import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { useRegisterStore } from '../../store';
import { ActivityIndicator } from 'react-native-paper';

const EmailVerification = () => {
  const route = useRoute();
  const { email } = route.params;
  const navigation = useNavigation();

  // Zustand store
  const { otpSent, emailVerifyOtp, resetOtpState, userRegister } = useRegisterStore();
  
  const [code, setCode] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const inputsRef = useRef([]);

  // Focus first box on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Handle navigation when OTP verification is successful
  useEffect(() => {
    if (otpSent) {
      resetOtpState();
      navigation.navigate("UserInformation");
    }
  }, [otpSent, navigation]);

  // Timer countdown for resend OTP
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(countdown);
  }, [timer]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.join('').length === 6) {
      handleOtpSubmit();
    }
  }, [code]);

  const handleCodeChange = (index, text) => {
    const digit = text.replace(/\D/g, '').slice(-1); // only keep last digit
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && code[index] === '') {
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpSubmit = () => {
    const enteredOtp = code.join('');
    if (enteredOtp.length !== 6) return;
    emailVerifyOtp({ otp: enteredOtp, email });
  };

  const handleResendCode = () => {
    if (canResend) {
      userRegister(email); // Resend OTP action
      setTimer(45);
      setCanResend(false);
    }
  };

  const circleLength = 2 * Math.PI * 15;
  const dashOffset = circleLength * (1 - timer / 45);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>We just sent an OTP</Text>
      <Text style={styles.description}>Enter the security code we sent to: {email}</Text>

      {/* OTP Input Fields */}
      <View style={styles.codeInputContainer}>
        {code.map((value, index) => (
          <TextInput
            key={index}
            ref={(input) => (inputsRef.current[index] = input)}
            style={styles.codeInput}
            maxLength={1}
            keyboardType="number-pad"
            value={value}
            onChangeText={(text) => handleCodeChange(index, text)}
            onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
          />
        ))}
      </View>

      {/* Resend OTP Section */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't get the code?</Text>
        <View style={styles.resendRight}>
          <TouchableOpacity onPress={handleResendCode} disabled={!canResend} activeOpacity={0.8}>
            <Text style={[styles.resendLink, !canResend && styles.disabledText]}>Resend it</Text>
          </TouchableOpacity>

          {/* Timer Animation */}
          {timer > 0 && (
            <View style={styles.timerContainer}>
              <Text style={styles.timer}>{timer}s</Text>
              <Svg width={25} height={25} viewBox="0 0 50 50">
                <Circle cx="25" cy="25" r="15" stroke="gray" strokeWidth="4" fill="transparent" />
                <Circle
                  cx="25"
                  cy="25"
                  r="15"
                  stroke="#000000"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circleLength}
                  strokeDashoffset={dashOffset}
                />
              </Svg>
            </View>
          )}
        </View>
      </View>

      {/* Submit OTP Button */}
      <TouchableOpacity style={styles.button} onPress={handleOtpSubmit}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {info.loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" style={{ transform: [{ scale: 1 }] }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  description: { marginBottom: 20, color: '#888' },
  codeInputContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 20,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resendText: { flex: 1 },
  resendRight: { flexDirection: 'row', alignItems: 'center' },
  resendLink: { color: '#000000' },
  disabledText: { color: '#aaa' },
  timerContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  timer: { marginLeft: 5 },
  button: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

export default EmailVerification;
