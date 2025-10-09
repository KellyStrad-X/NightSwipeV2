import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // Animation values
  const fullMoonOpacity = useRef(new Animated.Value(1)).current;
  const fullMoonTranslateX = useRef(new Animated.Value(0)).current;
  const crescentOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation sequence
    startAnimation();
  }, []);

  const startAnimation = () => {
    // Sequence:
    // 1. Full moon appears (already visible, add subtle glow)
    // 2. Moon swipes left off screen (0.5-1s)
    // 3. Crescent logo fades in (1-1.5s)
    // 4. Hold 0.5s
    // 5. Transition to app

    Animated.sequence([
      // Step 1: Fade in glow behind moon (300ms)
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),

      // Step 2: Hold moon for a moment (200ms)
      Animated.delay(200),

      // Step 3: Swipe moon left off screen (800ms)
      Animated.parallel([
        Animated.timing(fullMoonTranslateX, {
          toValue: -width,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fullMoonOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),

      // Step 4: Fade in crescent logo (600ms)
      Animated.timing(crescentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      // Step 5: Hold crescent (500ms)
      Animated.delay(500),
    ]).start(() => {
      // Animation complete - transition to app
      if (onFinish) {
        onFinish();
      }
    });
  };

  const skipAnimation = () => {
    // Stop all animations and immediately finish
    fullMoonOpacity.stopAnimation();
    fullMoonTranslateX.stopAnimation();
    crescentOpacity.stopAnimation();
    glowOpacity.stopAnimation();

    if (onFinish) {
      onFinish();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={skipAnimation}>
      <View style={styles.container}>
        {/* Dark gradient background with glow effect */}
        <View style={styles.backgroundGradient}>
          {/* Radial glow effect */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowOpacity,
              },
            ]}
          />
        </View>

        {/* Full moon logo (swipes left) */}
        <Animated.View
          style={[
            styles.fullMoonContainer,
            {
              opacity: fullMoonOpacity,
              transform: [{ translateX: fullMoonTranslateX }],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo-full-moon.png')}
            style={styles.fullMoonImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Crescent "NightSwipe" logo (fades in) */}
        <Animated.View
          style={[
            styles.crescentContainer,
            {
              opacity: crescentOpacity,
            },
          ]}
        >
          <Image
            source={require('../../assets/logo-crescent.png')}
            style={styles.crescentImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(98, 0, 238, 0.15)', // Purple glow
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
    elevation: 20,
  },
  fullMoonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMoonImage: {
    width: width * 0.4,
    height: width * 0.4,
  },
  crescentContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crescentImage: {
    width: width * 0.7,
    height: width * 0.3,
  },
});
