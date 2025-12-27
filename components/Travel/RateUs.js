import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import Theme from '../Theme';

const { width } = Dimensions.get("window");
const isSmall = width < 375;

const RateUs = () => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Rate Us</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="star" size={32} color="#FFB800" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.heading}>Enjoying ODH Travel?</Text>
                        <Text style={styles.subText}>
                            Share your experience with us and help others discover great travel deals.
                        </Text>
                    </View>
                </View>
                
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} style={styles.starBtn}>
                            <MaterialIcons 
                                name="star-outline" 
                                size={28} 
                                color={Theme.colors.textSecondary} 
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.rateButton}>
                    <MaterialIcons name="rate-review" size={18} color={Theme.colors.surface} />
                    <Text style={styles.rateButtonText}>Rate Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 20,
    },
    header: {
        marginBottom: 12,
    },
    title: {
        fontSize: isSmall ? 18 : 20,
        fontWeight: '700',
        color: Theme.colors.text,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF9E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    heading: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.colors.text,
        marginBottom: 4,
    },
    subText: {
        fontSize: 13,
        color: Theme.colors.textSecondary,
        lineHeight: 18,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
        paddingVertical: 12,
        backgroundColor: Theme.colors.background,
        borderRadius: 12,
    },
    starBtn: {
        padding: 4,
    },
    rateButton: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    rateButtonText: {
        color: Theme.colors.surface,
        fontWeight: '700',
        fontSize: 15,
    },
});

export default RateUs;
