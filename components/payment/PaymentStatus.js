import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const PaymentStatus = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { message, statusColor, amount } = route.params;
    const scaleValue = new Animated.Value(0);

    useEffect(() => {
        Animated.spring(scaleValue, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('MainApp', { screen: 'HomeTab' });
    };

    const isSuccess = statusColor === 'green';

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.iconContainer,
                        { transform: [{ scale: scaleValue }] },
                        { backgroundColor: isSuccess ? '#E8F5E9' : '#FFEBEE' }
                    ]}
                >
                    <MaterialIcons
                        name={isSuccess ? 'check-circle' : 'error'}
                        size={80}
                        color={isSuccess ? '#4CAF50' : '#F44336'}
                    />
                </Animated.View>

                <Text style={[styles.status, { color: isSuccess ? '#2E7D32' : '#C62828' }]}>
                    {isSuccess ? 'Success!' : 'Failed!'}
                </Text>

                <Text style={styles.message}>{message}</Text>

                {amount && (
                    <View style={styles.amountContainer}>
                        <Text style={styles.amountLabel}>Amount</Text>
                        <Text style={styles.amount}>₹{parseFloat(amount).toFixed(2)}</Text>
                    </View>
                )}

                <View style={styles.detailsContainer}>
                    <Text style={styles.timestamp}>
                        {new Date().toLocaleString()}
                    </Text>
                    {isSuccess && (
                        <Text style={styles.transactionId}>
                            Transaction ID: {Math.random().toString(36).substring(2, 15)}
                        </Text>
                    )}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.button, { backgroundColor: isSuccess ? '#4CAF50' : '#F44336' }]}
                onPress={handleContinue}
            >
                <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    status: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    message: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    amountContainer: {
        backgroundColor: '#F5F5F5',
        padding: 20,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    amountLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    detailsContainer: {
        width: '100%',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
    },
    timestamp: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    transactionId: {
        fontSize: 14,
        color: '#666',
    },
    button: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PaymentStatus;