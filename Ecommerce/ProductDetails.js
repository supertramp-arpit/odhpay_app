import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChevronLeft, Star, Heart, ShoppingCart, Truck, Check } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
    const navigation = useNavigation();
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    // Animation values
    const notificationOffset = useSharedValue(-100);

    // Product data (in a real app, this would come from an API)
    const product = {
        id: 1,
        name: 'Loop Silicone Strong Magnetic Watch',
        description: 'Constructed with high-quality silicone material, the Loop Silicone Strong Magnetic Watch ensures a comfortable and secure fit on your wrist. The soft and flexible silicone is gentle on the skin, making it ideal for extended wear.',
        price: 15.25,
        originalPrice: 29.99,
        discount: '49% OFF',
        rating: 4.8,
        reviewCount: 2495,
        inStock: true,
        freeShipping: true,
        colors: ['#FFFFFF', '#87CEEB', '#9370DB', '#4169E1', '#808080'],
        images: [
            'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg',
            'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg',
            'https://images.pexels.com/photos/9978933/pexels-photo-9978933.jpeg',
        ],
    };

    const notificationAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: notificationOffset.value }],
        };
    });

    useEffect(() => {
        if (showNotification) {
            notificationOffset.value = withTiming(0, {
                duration: 300,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });

            const timer = setTimeout(() => {
                notificationOffset.value = withTiming(-100, {
                    duration: 300,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                });

                setTimeout(() => {
                    setShowNotification(false);
                }, 300);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [showNotification]);

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const increaseQuantity = () => {
        setQuantity(quantity + 1);
    };

    const addToCart = () => {
        setShowNotification(true);
        // Add to cart logic would go here
    };

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
    };

    return (
        <View style={styles.container}>

            {/* Floating notification */}
            {showNotification && (
                <Animated.View style={[styles.notification, notificationAnimatedStyle]}>
                    <Check size={20} color="#1DD1B0" />
                    <Text style={styles.notificationText}>The product has been added to your cart</Text>
                    <TouchableOpacity
                        style={styles.viewCartButton}
                    // onPress={() => router.push('/(tabs)/cart')}
                    >
                        <Text style={styles.viewCartText}>View Cart</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft color="#FFFFFF" size={24} />
                </TouchableOpacity>

                {/* Product Images */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: product.images[0] }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />

                    {/* Image dots indicator */}
                    <View style={styles.dotsContainer}>
                        {product.images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    index === 0 && styles.activeDot
                                ]}
                            />
                        ))}
                    </View>

                    {/* Wishlist button */}
                    <TouchableOpacity
                        style={styles.wishlistButton}
                        onPress={toggleWishlist}
                    >
                        <Heart
                            size={20}
                            color={isWishlisted ? "#E74C3C" : "#FFFFFF"}
                            fill={isWishlisted ? "#E74C3C" : "transparent"}
                        />
                    </TouchableOpacity>

                    {/* Discount badge */}
                    <View style={styles.badgeContainer}>
                        <View style={[styles.badge, styles.discountBadge]}>
                            <Text style={styles.discountText}>49% OFF</Text>
                        </View>

                        <View style={[styles.badge, styles.topRatedBadge]}>
                            <Text style={styles.badgeText}>Top Rated</Text>
                        </View>
                    </View>
                </View>

                {/* Product info */}
                <View style={styles.infoContainer}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.productTitle}>{product.name}</Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                            <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((_, index) => (
                                <Star
                                    key={index}
                                    size={16}
                                    color={index < Math.floor(product.rating) ? "#FFC107" : "#8E8E93"}
                                    fill={index < Math.floor(product.rating) ? "#FFC107" : "transparent"}
                                />
                            ))}
                        </View>
                        <Text style={styles.reviewCount}>
                            {product.rating} ({product.reviewCount} reviews)
                        </Text>
                    </View>

                    {/* Free shipping */}
                    {product.freeShipping && (
                        <View style={styles.shippingContainer}>
                            <Truck size={16} color="#1DD1B0" />
                            <Text style={styles.shippingText}>Free Shipping</Text>
                        </View>
                    )}

                    {/* Description */}
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {product.description}
                        <Text style={styles.readMore}> Read more</Text>
                    </Text>

                    {/* Color selection */}
                    <Text style={styles.colorTitle}>Color</Text>
                    <View style={styles.colorContainer}>
                        {product.colors.map((color, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: color },
                                    selectedColor === index && styles.selectedColor
                                ]}
                                onPress={() => setSelectedColor(index)}
                            />
                        ))}
                    </View>

                    {/* Quantity */}
                    <Text style={styles.quantityTitle}>Quantity</Text>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={decreaseQuantity}
                        >
                            <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.quantityText}>{quantity}</Text>

                        <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={increaseQuantity}
                        >
                            <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom buttons */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.buyNowButton}
                // onPress={() => router.push('/checkout/shipping')}
                >
                    <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={addToCart}
                >
                    <ShoppingCart size={20} color="#000000" />
                    <Text style={styles.addToCartText}>Add To Cart</Text>
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
    notification: {
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    notificationText: {
        color: '#FFFFFF',
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    viewCartButton: {
        marginLeft: 8,
    },
    viewCartText: {
        color: '#1DD1B0',
        fontWeight: 'bold',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width: '100%',
        height: 400,
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    dotsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#FFFFFF',
        width: 24,
    },
    wishlistButton: {
        position: 'absolute',
        top: 50,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: 100,
        left: 16,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginBottom: 8,
    },
    discountBadge: {
        backgroundColor: '#E74C3C',
    },
    topRatedBadge: {
        backgroundColor: '#3498DB',
    },
    discountText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    badgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    infoContainer: {
        padding: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        marginRight: 16,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1DD1B0',
    },
    originalPrice: {
        fontSize: 16,
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 8,
    },
    reviewCount: {
        fontSize: 14,
        color: '#8E8E93',
    },
    shippingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(29, 209, 176, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    shippingText: {
        color: '#1DD1B0',
        marginLeft: 6,
        fontWeight: '500',
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#BBBBBB',
        marginBottom: 16,
    },
    readMore: {
        color: '#1DD1B0',
        fontWeight: 'bold',
    },
    colorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    colorContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#333333',
    },
    selectedColor: {
        borderWidth: 2,
        borderColor: '#1DD1B0',
    },
    quantityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
        width: 40,
        textAlign: 'center',
    },
    bottomContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333333',
        backgroundColor: '#1A1A1A',
    },
    buyNowButton: {
        flex: 1,
        backgroundColor: '#222222',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginRight: 12,
    },
    buyNowText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    addToCartButton: {
        flex: 1,
        backgroundColor: '#1DD1B0',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});