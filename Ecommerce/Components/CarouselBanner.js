import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function CarouselBanner({ banners }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });

        // Auto-scroll carousel
        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % banners.length;
            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        }, 4000);

        return () => clearInterval(interval);
    }, [currentIndex, banners.length]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const renderBanner = ({ item }) => {
        return (
            <View style={styles.bannerItem}>
                <View style={[styles.bannerContent, { backgroundColor: item.backgroundColor }]}>
                    <View style={styles.bannerTextContainer}>
                        {item.discount && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{item.discount}</Text>
                            </View>
                        )}
                        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                        <Text style={styles.bannerTitle}>{item.title}</Text>
                    </View>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.bannerImage}
                        resizeMode="contain"
                    />
                </View>
            </View>
        );
    };

    const handleScroll = (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderBanner}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
            />

            <View style={styles.paginationContainer}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === currentIndex && styles.paginationDotActive,
                        ]}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 200,
        width: '100%',
    },
    bannerItem: {
        width: width,
        paddingHorizontal: 16,
    },
    bannerContent: {
        flexDirection: 'row',
        borderRadius: 16,
        overflow: 'hidden',
        height: '100%',
        padding: 16,
        justifyContent: 'space-between',
    },
    bannerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    discountBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    discountText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    bannerSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: 8,
    },
    bannerImage: {
        width: 100,
        height: '100%',
    },
    paginationContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 8,
        alignSelf: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#FFFFFF',
        width: 16,
    },
});