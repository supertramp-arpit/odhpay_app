import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useImage } from '@shopify/react-native-skia';
import { X, Check, Gift, Clock3 } from 'lucide-react-native';

import { ScratchCard } from './ScratchCard';
import { formatDate, formatINR } from '../../utils/helper';
import { color, space, radius, type, tabularNums, elevation, hitSlop8 } from '../../theme/tokens';

// Assets
import ScratchImage from '../../assets/1.png';

const CARD_SIZE = { width: 300, height: 280 };

const ScratchReward = ({ item, onClose }) => {
    const [isScratched, setIsScratched] = useState(false);
    const [scratchProgress, setScratchProgress] = useState(0);
    const image = useImage(ScratchImage);

    // Reveal animation — one restrained spring, no confetti circus
    const contentScale = useRef(new Animated.Value(0.9)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isScratched) {
            Animated.parallel([
                Animated.spring(contentScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 90,
                    useNativeDriver: true,
                }),
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isScratched, contentScale, contentOpacity]);

    const instruction = isScratched
        ? 'Reward added to your wallet'
        : scratchProgress > 20
            ? 'Almost there — keep scratching'
            : 'Scratch the card to reveal your reward';

    if (!image) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Preparing your reward…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Close — always reachable, also before scratching */}
            <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={onClose}
                hitSlop={hitSlop8}
                accessibilityRole="button"
                accessibilityLabel="Close"
            >
                <X size={20} color={color.textInverse} strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.cardShadow}>
                <ScratchCard
                    style={styles.scratchCard}
                    image={image}
                    img_id={item.id}
                    onScratchProgress={setScratchProgress}
                    onScratchComplete={() => setIsScratched(true)}
                >
                    {/* Revealed content — quiet paper card */}
                    <View style={styles.revealCard}>
                        <Animated.View
                            style={[
                                styles.revealInner,
                                isScratched && {
                                    opacity: contentOpacity,
                                    transform: [{ scale: contentScale }],
                                },
                            ]}
                        >
                            <View style={styles.rewardDisc}>
                                <Gift size={26} color={color.successFg} strokeWidth={1.75} />
                            </View>
                            <Text style={styles.wonLabel}>You’ve won</Text>
                            <Text style={styles.wonAmount}>{formatINR(item.amount)}</Text>
                            <View style={styles.creditedBadge}>
                                <Check size={12} color={color.successFg} strokeWidth={2.5} />
                                <Text style={styles.creditedBadgeText}>Added to wallet</Text>
                            </View>
                            <View style={styles.dateRow}>
                                <Clock3 size={12} color={color.textTertiary} strokeWidth={2} />
                                <Text style={styles.dateText}>
                                    {item.receivedDate ? formatDate(item.receivedDate) : 'Recently'}
                                </Text>
                            </View>
                        </Animated.View>
                    </View>
                </ScratchCard>
            </View>

            {/* Instruction */}
            <Text
                style={[
                    styles.instructionText,
                    isScratched && { color: color.successBg },
                ]}
            >
                {instruction}
            </Text>

            {/* Done */}
            {isScratched && onClose && (
                <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={onClose}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                >
                    <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.lg,
        alignSelf: 'stretch',
    },
    loadingText: {
        ...type.bodySm,
        color: color.textInverse,
    },
    closeIconBtn: {
        alignSelf: 'flex-end',
        width: 40,
        height: 40,
        borderRadius: radius.pill,
        backgroundColor: color.pressTintInverse,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.md,
    },

    cardShadow: {
        borderRadius: radius.lg,
        ...elevation.level2,
    },
    scratchCard: {
        ...CARD_SIZE,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },

    // Revealed content
    revealCard: {
        flex: 1,
        backgroundColor: color.surface,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealInner: {
        alignItems: 'center',
        padding: space.lg,
    },
    rewardDisc: {
        width: 60,
        height: 60,
        borderRadius: radius.pill,
        backgroundColor: color.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: space.md,
    },
    wonLabel: {
        ...type.bodySm,
        color: color.textSecondary,
    },
    wonAmount: {
        ...type.display,
        ...tabularNums,
        color: color.moneyCredit,
        marginTop: space.xs,
        marginBottom: space.md,
    },
    creditedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.successBg,
        borderRadius: radius.pill,
        paddingVertical: space.xs,
        paddingHorizontal: space.md,
        marginBottom: space.md,
    },
    creditedBadgeText: {
        ...type.micro,
        color: color.successFg,
        marginLeft: space.xs,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        ...type.caption,
        ...tabularNums,
        color: color.textTertiary,
        marginLeft: space.xs,
    },

    instructionText: {
        ...type.bodySm,
        color: color.gray300,
        marginTop: space.lg,
        textAlign: 'center',
    },

    doneBtn: {
        minHeight: 48,
        minWidth: 160,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color.surface,
        borderRadius: radius.md,
        paddingHorizontal: space.xl,
        marginTop: space.base,
    },
    doneBtnText: {
        ...type.button,
        color: color.ink900,
    },
});

export default ScratchReward;
