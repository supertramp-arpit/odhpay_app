import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Theme from '../components/Theme';
import { VideoView, useVideoPlayer } from 'expo-video';




const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const [showNextButton, setShowNextButton] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const navigation = useNavigation();

  const splashSource = useMemo(() => require('../assets/HBAPAY_Splash_screen.mp4'), []);
  const videoPlayer = useVideoPlayer(splashSource);





  useEffect(() => {
    if (!videoPlayer) return;

    const statusSub = videoPlayer.addListener('statusChange', ({ status, error }) => {
      if (status === 'readyToPlay') {
        console.log('Video Loaded');
        try {
          videoPlayer.loop = true;
          videoPlayer.play();
        } catch (err) {
          console.log('Video Play Error:', err?.message || err);
          setVideoError(err);
        }
      }
      if (error) {
        console.log('Video Error:', error);
        setVideoError(error);
      }
    });

    const timer = setTimeout(() => {
      setShowNextButton(true);
    }, 3000);

    return () => {
      statusSub?.remove?.();
      clearTimeout(timer);
    };
  }, [videoPlayer]);

  return (
    <View style={styles.container}>
     

      {!videoError && (
        <VideoView
          player={videoPlayer}
          style={styles.backgroundVideo}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
          onError={({ error }) => {
            console.log('Video Error event:', error);
            setVideoError(error);
          }}
        />
      )}
      {videoError && (
        <View style={styles.backgroundFallback} />
      )}



      {showNextButton && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondary,
  },
  gifImage: {
    width: "50%",
    height: "40%",
    position: 'absolute',
    top: '10%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: '10%',
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#ff6f61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: Theme.colors.secondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  backgroundFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: Theme.colors.primary,
  },
});

export default SplashScreen;
