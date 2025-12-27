import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown } from 'lucide-react-native';

export default function ShippingScreen() {
    const router = useRouter();
    const [shippingForm, setShippingForm] = useState({
        fullName: '',
        phoneNumber: '',
        province: '',
        city: '',
        streetAddress: '',
        postalCode: '',
    });

    const [errors, setErrors] = useState({});

    const handleInputChange = (field, value) => {
        setShippingForm({
            ...shippingForm,
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

        if (!shippingForm.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!shippingForm.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        }

        if (!shippingForm.province.trim()) {
            newErrors.province = 'Province is required';
        }

        if (!shippingForm.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!shippingForm.streetAddress.trim()) {
            newErrors.streetAddress = 'Street address is required';
        }

        if (!shippingForm.postalCode.trim()) {
            newErrors.postalCode = 'Postal code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            router.push('/checkout/payment');
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
                    <View style={[styles.progressIcon, styles.activeProgressIcon]}>
                        <Text style={styles.progressIconText}>1</Text>
                    </View>
                    <Text style={[styles.progressText, styles.activeProgressText]}>Shipping</Text>
                </View>

                <View style={styles.progressLine} />

                <View style={styles.progressStep}>
                    <View style={styles.progressIcon}>
                        <Text style={styles.progressIconText}>2</Text>
                    </View>
                    <Text style={styles.progressText}>Payment</Text>
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
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.fullName && styles.inputError,
                            ]}
                            placeholder="Enter full name"
                            placeholderTextColor="#666666"
                            value={shippingForm.fullName}
                            onChangeText={(text) => handleInputChange('fullName', text)}
                        />
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
                        <View style={[
                            styles.phoneInputContainer,
                            errors.phoneNumber && styles.inputError,
                        ]}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>🇵🇰</Text>
                                <Text style={styles.countryCodeText}>+92</Text>
                                <ChevronDown color="#8E8E93" size={16} />
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Enter phone number"
                                placeholderTextColor="#666666"
                                keyboardType="phone-pad"
                                value={shippingForm.phoneNumber}
                                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                            />
                        </View>
                        {errors.phoneNumber && (
                            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Province <Text style={styles.requiredStar}>*</Text></Text>
                        <TouchableOpacity
                            style={[
                                styles.selectInput,
                                errors.province && styles.inputError,
                            ]}
                            onPress={() => {
                                // In a real app, we would show province selection modal/dropdown
                                handleInputChange('province', 'Sindh');
                            }}
                        >
                            <Text style={styles.selectInputText}>
                                {shippingForm.province || 'Select Province'}
                            </Text>
                            <ChevronDown color="#8E8E93" size={20} />
                        </TouchableOpacity>
                        {errors.province && (
                            <Text style={styles.errorText}>{errors.province}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>City <Text style={styles.requiredStar}>*</Text></Text>
                        <TouchableOpacity
                            style={[
                                styles.selectInput,
                                errors.city && styles.inputError,
                            ]}
                            onPress={() => {
                                // In a real app, we would show city selection modal/dropdown
                                handleInputChange('city', 'Karachi');
                            }}
                        >
                            <Text style={styles.selectInputText}>
                                {shippingForm.city || 'Select City'}
                            </Text>
                            <ChevronDown color="#8E8E93" size={20} />
                        </TouchableOpacity>
                        {errors.city && (
                            <Text style={styles.errorText}>{errors.city}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Street Address <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.streetAddress && styles.inputError,
                            ]}
                            placeholder="Enter street address"
                            placeholderTextColor="#666666"
                            value={shippingForm.streetAddress}
                            onChangeText={(text) => handleInputChange('streetAddress', text)}
                        />
                        {errors.streetAddress && (
                            <Text style={styles.errorText}>{errors.streetAddress}</Text>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Postal Code <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.postalCode && styles.inputError,
                            ]}
                            placeholder="Enter postal code"
                            placeholderTextColor="#666666"
                            keyboardType="number-pad"
                            value={shippingForm.postalCode}
                            onChangeText={(text) => handleInputChange('postalCode', text)}
                        />
                        {errors.postalCode && (
                            <Text style={styles.errorText}>{errors.postalCode}</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                >
                    <Text style={styles.submitButtonText}>Save</Text>
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
    scrollContent: {
        paddingBottom: 100,
    },
    formContainer: {
        paddingHorizontal: 16,
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
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#222222',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        overflow: 'hidden',
    },
    countryCode: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRightWidth: 1,
        borderRightColor: '#333333',
    },
    countryCodeText: {
        color: '#FFFFFF',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFFFFF',
        fontSize: 16,
    },
    selectInput: {
        backgroundColor: '#222222',
        borderWidth: 1,
        borderColor: '#333333',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectInputText: {
        color: '#666666',
        fontSize: 16,
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