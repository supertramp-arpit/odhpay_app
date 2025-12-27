import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const MembershipSuccess = () => {
    const animation = React.useRef(null);

    const navigation = useNavigation();

    useEffect(() => {
        // Play animation on mount
        if (animation.current) {
            animation.current.play();
        }
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.background}
            />

            <View style={styles.content}>
                <LottieView
                    ref={animation}
                    source={{ uri: 'https://assets5.lottiefiles.com/packages/lf20_touohxv0.json' }}
                    style={styles.animation}
                    autoPlay
                    loop={false}
                />

                <Text style={styles.title}>Congratulations! 🎉</Text>
                <Text style={styles.subtitle}>Your membership has been</Text>
                <Text style={styles.highlight}>Successfully Activated</Text>

                {/* <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                        <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                        <Text style={styles.infoText}>Premium Access Granted</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="time" size={24} color="#2196F3" />
                        <Text style={styles.infoText}>Valid for 12 Months</Text>
                    </View>
                </View> */}

                <TouchableOpacity
                    style={styles.button}
                // onPress={() => router.push('/')}
                >
                    <Text style={styles.buttonText} onPress={() => navigation.goBack()}>ok</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    animation: {
        width: width * 0.7,
        height: width * 0.7,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 20,
        color: '#E0E0E0',
        marginBottom: 5,
        textAlign: 'center',
    },
    highlight: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 30,
        textAlign: 'center',
    },
    infoContainer: {
        width: '100%',
        marginBottom: 40,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    infoText: {
        color: '#ffffff',
        fontSize: 16,
        marginLeft: 10,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});


export default MembershipSuccess