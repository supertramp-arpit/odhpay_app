import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Canvas,
  Group,
  Image,
  Mask,
  Path,
  Rect,
  Skia,
} from '@shopify/react-native-skia';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

// Threshold percentage to auto-reveal (like Google Pay - 50%)
const REVEAL_THRESHOLD = 50;

export const ScratchCard = ({ style, children, image, img_id, onScratchProgress, onScratchComplete }) => {

  // Zustand state. updateScratchStatus also persists the id to AsyncStorage —
  // there is no backend "scratched" flag (the reward is already credited),
  // so reveal state is device-local. (An old scratch_voucher API call here
  // pointed at a dev LAN IP and never worked; removed.)
  const { scratchCards, updateScratchStatus } = useAppStore();

  const [[width, height], setSize] = useState([0, 0]);
  const path = useRef(Skia.Path.Make());
  const [scratchedPixels, setScratchedPixels] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isAutoRevealing, setIsAutoRevealing] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lastPos = useRef({ x: 0, y: 0 });

  // Check if the current card is revealed from Zustand
  const isRevealed = scratchCards.find(card => card.id === img_id)?.IsScratched || false;

  // Mark canvas as ready after a small delay to ensure overlay is rendered first
  useEffect(() => {
    if (image && width && height && !isRevealed) {
      // Small delay to ensure canvas overlay renders before showing content
      const timer = setTimeout(() => {
        setIsCanvasReady(true);
      }, 50);
      return () => clearTimeout(timer);
    } else if (isRevealed) {
      setIsCanvasReady(true);
    }
  }, [image, width, height, isRevealed]);

  // Auto-reveal animation like Google Pay
  const triggerAutoReveal = useCallback(() => {
    if (isAutoRevealing || isRevealed) return;
    
    setIsAutoRevealing(true);
    
    // Smooth fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      updateScratchStatus(img_id);
      onScratchComplete?.();
    });
  }, [isAutoRevealing, isRevealed, img_id]);

  useEffect(() => {
    const totalArea = width * height;
    if (!totalArea) return;
    const scratchedPercentage = (scratchedPixels / totalArea) * 100;

    // Notify parent of progress
    onScratchProgress?.(scratchedPercentage);

    // Auto-reveal at threshold (50% like Google Pay)
    if (scratchedPercentage >= REVEAL_THRESHOLD && !isRevealed && !isAutoRevealing) {
      triggerAutoReveal();
    }
  }, [scratchedPixels, width, height, isRevealed, isAutoRevealing, triggerAutoReveal]);

  const handleTouchStart = ({ nativeEvent }) => {
    if (isRevealed || isAutoRevealing) return;
    setIsActive(true);
    const { locationX, locationY } = nativeEvent;
    lastPos.current = { x: locationX, y: locationY };
    path.current.moveTo(locationX, locationY);
  };

  const handleScratch = ({ nativeEvent }) => {
    if (isRevealed || !isActive || isAutoRevealing) return;

    const { locationX, locationY } = nativeEvent;
    
    // Calculate actual distance moved for more accurate scratching
    const dx = locationX - lastPos.current.x;
    const dy = locationY - lastPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    path.current.lineTo(locationX, locationY);
    lastPos.current = { x: locationX, y: locationY };

    // Calculate scratched area based on stroke width and distance
    const strokeWidth = 60;
    const scratchedArea = distance * strokeWidth;
    setScratchedPixels((prev) => prev + scratchedArea);
  };

  const handleTouchEnd = () => {
    setIsActive(false);
  };

  return (
    <View
      onLayout={(e) => {
        setSize([e.nativeEvent.layout.width, e.nativeEvent.layout.height]);
      }}
      style={[styles.container, style]}>
      {Boolean(image && width && height) && (
        <>
          {/* Only show content after canvas is ready to prevent flash */}
          <View style={[styles.content, { opacity: isCanvasReady ? 1 : 0 }]}>
            {children}
          </View>
          {!isRevealed && (
            <Animated.View style={[styles.canvasContainer, { opacity: fadeAnim }]}>
              <Canvas
                style={styles.canvas}
                onTouchStart={handleTouchStart}
                onTouchMove={handleScratch}
                onTouchEnd={handleTouchEnd}>
                <Mask
                  mode="luminance"
                  mask={
                    <Group>
                      <Rect x={0} y={0} width={width} height={height} color="white" />
                      <Path
                        path={path.current}
                        color="black"
                        style="stroke"
                        strokeJoin="round"
                        strokeCap="round"
                        strokeWidth={60}
                      />
                    </Group>
                  }>
                  <Image
                    image={image}
                    fit="cover"
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                  />
                </Mask>
              </Canvas>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 300,
    height: 280,
    overflow: 'hidden',
    borderRadius: 20,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  canvas: {
    flex: 1,
    borderRadius: 20,
  },
});
