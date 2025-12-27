import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Star, Heart } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with 16px padding on each side and 16px between cards

export default function ProductCard({ product }) {

    const navigation = useNavigation();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <TouchableOpacity
                activeOpacity={0.9}
                // onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => navigation.navigate('ProductDetails')}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: product.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <TouchableOpacity style={styles.wishlistButton}>
                        <Heart size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.colorsContainer}>
                    {product.colors.slice(0, 3).map((color, index) => (
                        <View
                            key={index}
                            style={[
                                styles.colorDot,
                                { backgroundColor: color }
                            ]}
                        />
                    ))}
                    {product.colors.length > 3 && (
                        <Text style={styles.moreColorsText}>+{product.colors.length - 3}</Text>
                    )}
                </View>

                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                    <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                </View>

                <View style={styles.ratingContainer}>
                    <Star size={14} color="#FFC107" fill="#FFC107" />
                    <Text style={styles.rating}>{product.rating}</Text>
                    <Text style={styles.reviewCount}>({product.reviews})</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: cardWidth,
        marginBottom: 24,
    },
    imageContainer: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    wishlistButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 4,
        borderWidth: 1,
        borderColor: '#333333',
    },
    moreColorsText: {
        fontSize: 10,
        color: '#8E8E93',
    },
    name: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 4,
        height: 40,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1DD1B0',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 12,
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        fontSize: 12,
        color: '#BBBBBB',
        marginLeft: 4,
        marginRight: 2,
    },
    reviewCount: {
        fontSize: 12,
        color: '#8E8E93',
    },
});