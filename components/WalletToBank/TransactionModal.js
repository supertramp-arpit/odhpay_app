import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TransactionModal = ({ visible, onClose, status, message }) => {
  const isSuccess = status === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            {isSuccess ? (
              <CheckCircle2 size={64} color="#4CAF50" />
            ) : (
              <XCircle size={64} color="#F44336" />
            )}
          </View>
          
          <Text style={styles.title}>
            {isSuccess ? 'Transaction Successful' : 'Transaction Failed'}
          </Text>
          
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: isSuccess ? '#4CAF50' : '#F44336' }
            ]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>
              {isSuccess ? 'Back to Home' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TransactionModal;