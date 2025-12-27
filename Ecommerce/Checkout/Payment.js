import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function PaymentScreen() {
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState('creditCard');
    const [cardForm, setCardForm] = useState({
        cardHolderName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });
    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        // Format card number with spaces
        if (field === 'cardNumber') {
            value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        }

        // Format expiry date
        if (field === 'expiryDate') {
            value = value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
        }

        setCardForm({
            ...cardForm,
            [field]: value,
        });

        // Clear error for this field when user types
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null,
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (paymentMethod === 'creditCard') {
            if (!cardForm.cardHolderName.trim()) {
                newErrors.cardHolderName = 'Card holder name is required';
            }

            if (!cardForm.cardNumber.trim()) {
                newErrors.cardNumber = 'Card number is required';
            } else if (cardForm.cardNumber.replace(/\s/g, '').length !== 16) {
                newErrors.cardNumber = 'Card number must be 16 digits';
            }

            if (!cardForm.expiryDate.trim()) {
                newErrors.expiryDate = 'Expiry date is required';
            } else if (!/^\d{2}\/\d{2}$/.test(cardForm.expiryDate)) {
                newErrors.expiryDate = 'Invalid expiry date format (MM/YY)';
            }

            if (!cardForm.cvv.trim()) {
                newErrors.cvv = 'CVV is required';
            } else if (!/^\d{3}$/.test(cardForm.cvv)) {
                newErrors.cvv = 'CVV must be 3 digits';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            router.push('/checkout/review');
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft color="#FFFFFF" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <View style={styles.progressBar}>
                <View style={styles.progressStep}>
                    <View style={[styles.progressIcon, styles.completedProgressIcon]}>
                        <Text style={styles.progressIconText}>✓</Text>
                    </View>
                    <Text style={styles.progressText}>Shipping</Text>
                </View>

                <View style={[styles.progressLine, styles.completedProgressLine]} />

                <View style={styles.progressStep}>
                    <View style={[styles.progressIcon, styles.activeProgressIcon]}>
                        <Text style={styles.progressIconText}>2</Text>
                    </View>
                    <Text style={[styles.progressText, styles.activeProgressText]}>Payment</Text>
                </View>

                <View style={styles.progressLine} />

                <View style={styles.progressStep}>
                    <View style={styles.progressIcon}>
                        <Text style={styles.progressIconText}>3</Text>
                    </View>
                    <Text style={styles.progressText}>Review</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.paymentMethodsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.paymentMethodCard,
                            paymentMethod === 'paypal' && styles.selectedPaymentMethod,
                        ]}
                        onPress={() => setPaymentMethod('paypal')}
                    >
                        <Image
                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png' }}
                            style={styles.paymentMethodLogo}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.paymentMethodCard,
                            paymentMethod === 'googlePay' && styles.selectedPaymentMethod,
                        ]}
                        onPress={() => setPaymentMethod('googlePay')}
                    >
                        <Image
                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png' }}
                            style={styles.paymentMethodLogo}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Credit Card Information</Text>

                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Card Holder Name <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.cardHolderName && styles.inputError,
                            ]}
                            placeholder="Enter card holder name"
                            placeholderTextColor="#666666"
                            value={cardForm.cardHolderName}
                            onChangeText={(text) => handleInputChange('cardHolderName', text)}
                        />
                        {errors.cardHolderName && (
                            <Text style={styles.errorText}>{errors.cardHolderName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Card Number <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.cardNumber && styles.inputError,
                            ]}
                            placeholder="4111 1111 1111 1111"
                            placeholderTextColor="#666666"
                            keyboardType="number-pad"
                            maxLength={19} // 16 digits + 3 spaces
                            value={cardForm.cardNumber}
                            onChangeText={(text) => handleInputChange('cardNumber', text)}
                        />
                        {errors.cardNumber && (
                            <Text style={styles.errorText}>{errors.cardNumber}</Text>
                        )}
                    </View>

                    <View style={styles.rowInputs}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.inputLabel}>Expiration <Text style={styles.requiredStar}>*</Text></Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    errors.expiryDate && styles.inputError,
                                ]}
                                placeholder="MM/YY"
                                placeholderTextColor="#666666"
                                keyboardType="number-pad"
                                maxLength={5}
                                value={cardForm.expiryDate}
                                onChangeText={(text) => handleInputChange('expiryDate', text)}
                            />
                            {errors.expiryDate && (
                                <Text style={styles.errorText}>{errors.expiryDate}</Text>
                            )}
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>CVV <Text style={styles.requiredStar}>*</Text></Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    errors.cvv && styles.inputError,
                                ]}
                                placeholder="123"
                                placeholderTextColor="#666666"
                                keyboardType="number-pad"
                                maxLength={3}
                                secureTextEntry={true}
                                value={cardForm.cvv}
                                onChangeText={(text) => handleInputChange('cvv', text)}
                            />
                            {errors.cvv && (
                                <Text style={styles.errorText}>{errors.cvv}</Text>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#1A1A1A',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333333',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    activeProgressIcon: {
        backgroundColor: '#1DD1B0',
    },
    completedProgressIcon: {
        backgroundColor: '#1DD1B0',
    },
    progressIconText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    progressText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    activeProgressText: {
        color: '#1DD1B0',
        fontWeight: 'bold',
    },
    progressLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#333333',
        marginHorizontal: 8,
    },
    completedProgressLine: {
        backgroundColor: '#1DD1B0',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    paymentMethodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    paymentMethodCard: {
        flex: 1,
        height: 80,
        backgroundColor: '#222222',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: '#333333',
    },
    selectedPaymentMethod: {
        borderColor: '#1DD1B0',
        borderWidth: 2,
    },
    paymentMethodLogo: {
        width: 100,
        height: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    formContainer: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    requiredStar: {
        color: '#E74C3C',
    },
    input: {
        backgroundColor: '#222222',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFFFFF',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#E74C3C',
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 12,
        marginTop: 4,
    },
    rowInputs: {
        flexDirection: 'row',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1,
        borderTopColor: '#333333',
    },
    submitButton: {
        backgroundColor: '#1DD1B0',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});