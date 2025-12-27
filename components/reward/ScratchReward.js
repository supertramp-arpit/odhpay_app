import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { ScratchCard } from './ScratchCard';
import { useImage } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Theme from '../Theme';

// Assets
import ScratchImage from '../../assets/1.png';
import { formatDate } from '../../utils/helper';

const getRandomNumber = () => Math.floor(Math.random() * 100);

const ScratchReward = ({ item, onClose }) => {
    const [randomNumber, setRandomNumber] = useState(getRandomNumber());
    const [isScratched, setIsScratched] = useState(false);
    const [scratchProgress, setScratchProgress] = useState(0);
    const image = useImage(ScratchImage);
    
    // Animations
    const celebrationScale = useRef(new Animated.Value(0)).current;
    const celebrationOpacity = useRef(new Animated.Value(0)).current;
    const contentScale = useRef(new Animated.Value(0.8)).current;

    // Trigger celebration animation when scratched
    useEffect(() => {
        if (isScratched) {
            Animated.parallel([
                Animated.spring(celebrationScale, {
                    toValue: 1,
                    friction: 4,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(celebrationOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(contentScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isScratched]);

    const handleScratchProgress = (percentage) => {
        setScratchProgress(percentage);
    };

    const handleScratchComplete = () => {
        setIsScratched(true);
    };

    if (!image) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialIcons name="hourglass-empty" size={32} color="#6366f1" />
                    <Text style={styles.loading}>Preparing your reward...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* Card Wrapper */}
            <View style={styles.cardWrapper}>
                <View style={styles.cardShadow}>
                    <ScratchCard
                        key={`scratch-${randomNumber}`}
                        style={styles.scratchCard}
                        image={image}
                        img_id={item.id}
                        onScratchProgress={handleScratchProgress}
                        onScratchComplete={handleScratchComplete}
                    >
                        {/* Reward Content (revealed after scratching) */}
                        <LinearGradient
                            colors={['#1e293b', '#0f172a']}
                            style={styles.card}
                        >
                            {/* Decorative elements */}
                            <View style={styles.decorCircle1} />
                            <View style={styles.decorCircle2} />
                            
                            {/* Celebration Icon */}
                            <Animated.View style={[
                                styles.celebrationBox,
                                {
                                    transform: [{ scale: isScratched ? celebrationScale : 1 }],
                                    opacity: isScratched ? celebrationOpacity : 1,
                                }
                            ]}>
                                <MaterialIcons name="celebration" size={36} color="#fbbf24" />
                            </Animated.View>
                            
                            {/* Reward Text */}
                            <Animated.View style={{
                                transform: [{ scale: isScratched ? contentScale : 1 }],
                                alignItems: 'center',
                            }}>
                                <Text style={styles.congratsText}>Congratulations!</Text>
                                <Text style={styles.cardText}>You've received</Text>
                                
                                {/* Amount Display */}
                                <View style={styles.amountContainer}>
                                    <LinearGradient
                                        colors={['#10b981', '#059669']}
                                        style={styles.amountBadge}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Text style={styles.currencySymbol}>₹</Text>
                                        <Text style={styles.rewardText}>{item.amount}</Text>
                                    </LinearGradient>
                                </View>
                            </Animated.View>
                            
                            {/* Date Footer */}
                            <View style={styles.dateContainer}>
                                <MaterialIcons name="schedule" size={14} color="#64748b" />
                                <Text style={styles.cardDate}>{formatDate(item.receivedDate)}</Text>
                            </View>
                        </LinearGradient>
                    </ScratchCard>
                </View>
            </View>

            {/* Dynamic Instruction Text */}
            <View style={styles.instructionBox}>
                {isScratched ? (
                    <>
                        <MaterialIcons name="check-circle" size={20} color="#10b981" />
                        <Text style={[styles.instructionText, { color: '#10b981' }]}>
                            Reward added to wallet!
                        </Text>
                    </>
                ) : scratchProgress > 20 ? (
                    <>
                        <MaterialIcons name="auto-awesome" size={20} color="#fbbf24" />
                        <Text style={[styles.instructionText, { color: '#fbbf24' }]}>
                            Almost there! Keep scratching...
                        </Text>
                    </>
                ) : (
                    <>
                        <MaterialIcons name="touch-app" size={20} color="#a5b4fc" />
                        <Text style={styles.instructionText}>
                            Scratch to reveal your reward
                        </Text>
                    </>
                )}
            </View>

            {/* Close Button when scratched */}
            {isScratched && onClose && (
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={onClose}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#6366f1', '#8b5cf6']}
                        style={styles.closeButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.closeButtonText}>Awesome!</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loading: {
        fontWeight: '600',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
        color: '#94a3b8',
    },
    
    // Header
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#f1f5f9',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    
    // Card Wrapper
    cardWrapper: {
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: 300,
        height: 280,
    },
    cardShadow: {
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    scratchCard: {
        borderRadius: 20,
        width: 300,
        height: 280,
        overflow: 'hidden',
    },
    
    // Revealed Card Content
    card: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    decorCircle1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    celebrationBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    congratsText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fbbf24',
        marginBottom: 4,
    },
    cardText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#94a3b8',
        marginBottom: 16,
    },
    
    // Amount
    amountContainer: {
        marginBottom: 16,
    },
    amountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginRight: 4,
    },
    rewardText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    
    // Date
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    cardDate: {
        fontSize: 12,
        color: '#64748b',
        marginLeft: 6,
    },
    
    // Instruction
    instructionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: 'rgba(165, 180, 252, 0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    instructionText: {
        fontSize: 13,
        color: '#a5b4fc',
        marginLeft: 8,
        fontWeight: '500',
    },
    
    // Close Button
    closeButton: {
        marginTop: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    closeButtonGradient: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ScratchReward;
