import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
// import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with 16px padding on each side and 16px between cards

export default function CategoryCard({ category }) {
    // const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.container}
        // onPress={() => router.push(`/category/${category.id}`)}
        >
            <Image
                source={{ uri: category.image }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <Text style={styles.name}>{category.name}</Text>
                <Text style={styles.count}>{category.count} items</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: cardWidth,
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    count: {
        fontSize: 12,
        color: '#BBBBBB',
    },
});