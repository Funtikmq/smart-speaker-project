import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import styles from '../../styles/home/OrbAnimationStyles';
import type { AgentPhase } from '../../agent';

interface OrbAnimationProps {
  coreSize: number;
  ringFieldSize: number;
  agentPhase: AgentPhase;
}

export default function OrbAnimation({ coreSize, ringFieldSize, agentPhase }: OrbAnimationProps) {
  const isListening = agentPhase === 'listening';
  const isSpeakingPhase = agentPhase === 'speaking';
  const isProcessingOrResponding = agentPhase === 'processing' || agentPhase === 'responding';
  const isConnecting = agentPhase === 'connecting';
  const isIdle = agentPhase === 'idle';
  const pulse = useRef(new Animated.Value(0)).current;
  const outerWave = useRef(new Animated.Value(0)).current;
  const innerGlow = useRef(new Animated.Value(0)).current;
  const responsePulse = useRef(new Animated.Value(0)).current;
  const responseSpin = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0.5)).current;
  const wave2 = useRef(new Animated.Value(0.8)).current;
  const wave3 = useRef(new Animated.Value(1)).current;
  const wave4 = useRef(new Animated.Value(0.7)).current;
  const wave5 = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const outerWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerWave, {
          toValue: 1,
          duration: isListening || isSpeakingPhase ? 1200 : 3200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(outerWave, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    const innerGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(innerGlow, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const responsePulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(responsePulse, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(responsePulse, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    const responseSpinLoop = Animated.loop(
      Animated.timing(responseSpin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    // Wave speed depends on who is speaking
    const baseDuration = isListening ? 500 : isSpeakingPhase ? 900 : 850;
    const waves = [wave1, wave2, wave3, wave4, wave5].map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: baseDuration + index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35 + index * 0.12,
            duration: baseDuration + index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    pulseLoop.start();
    outerWaveLoop.start();
    innerGlowLoop.start();
    responsePulseLoop.start();
    responseSpinLoop.start();
    waves.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 120);
    });

    return () => {
      pulseLoop.stop();
      outerWaveLoop.stop();
      innerGlowLoop.stop();
      responsePulseLoop.stop();
      responseSpinLoop.stop();
      waves.forEach((animation) => animation.stop());
    };
  }, [pulse, outerWave, innerGlow, responsePulse, responseSpin, wave1, wave2, wave3, wave4, wave5, agentPhase]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const glowScale = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.04],
  });

  const glowOpacity = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.42],
  });

  const waveScale = outerWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.18],
  });

  const waveOpacity = outerWave.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.18, 0.08, 0],
  });

  const responseScale = responsePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const responseRotation = responseSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });


  return (
    <View
      style={[
        styles.ringsField,
        {
          width: ringFieldSize,
          height: ringFieldSize,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.travelWave,
          {
            width: ringFieldSize * 0.76,
            height: ringFieldSize * 0.76,
            borderRadius: (ringFieldSize * 0.76) / 2,
            transform: [{ scale: waveScale }],
            opacity: (isListening || isSpeakingPhase) ? waveOpacity : 0,
            borderColor: isListening ? 'rgba(77,155,255,0.4)' : isSpeakingPhase ? 'rgba(242,157,78,0.28)' : 'rgba(242,157,78,0.28)'
          },
        ]}
      />

      <View
        style={[
          styles.staticRing,
          {
            width: ringFieldSize * 0.92,
            height: ringFieldSize * 0.92,
            borderRadius: (ringFieldSize * 0.92) / 2,
          },
        ]}
      />
      <View
        style={[
          styles.staticRing,
          {
            width: ringFieldSize * 0.78,
            height: ringFieldSize * 0.78,
            borderRadius: (ringFieldSize * 0.78) / 2,
          },
        ]}
      />
      <View
        style={[
          styles.staticRing,
          {
            width: ringFieldSize * 0.64,
            height: ringFieldSize * 0.64,
            borderRadius: (ringFieldSize * 0.64) / 2,
          },
        ]}
      />

      <View
        style={[
          styles.glowOrb,
          {
            width: coreSize + 70,
            height: coreSize + 70,
            borderRadius: (coreSize + 70) / 2,
            opacity: isResponding ? 0.7 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.glowPulse,
            {
              transform: [
                { scale: isResponding ? responseScale : glowScale },
                { rotate: isResponding ? responseRotation : '0deg' },
              ],
              opacity: isResponding ? 0.6 : glowOpacity,
            },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.orbOuter,
          {
            width: coreSize + 32,
            height: coreSize + 32,
            borderRadius: (coreSize + 32) / 2,
            transform: [{ scale: isResponding ? responseScale : pulseScale }],
            opacity: isResponding ? 1 : pulseOpacity,
          },
        ]}
      >
        <View
          style={[
            styles.orbRing,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              borderColor: isProcessingOrResponding ? '#48C78E' : isListening ? 'rgba(77,155,255,0.4)' : WARM_BORDER,
            },
          ]}
        >
          <View style={styles.orbInner}>
            <View style={styles.waveWrap}>
              {(isListening || isSpeakingPhase) ? (
                // Wave bars: blue for user (listening), orange for assistant (speaking)
                <>
                  <Animated.View style={[styles.waveBar, { height: 12, transform: [{ scaleY: wave1 }], backgroundColor: isListening ? '#4D9BFF' : '#F29D4E' }]} />
                  <Animated.View style={[styles.waveBar, { height: 18, transform: [{ scaleY: wave2 }], backgroundColor: isListening ? '#4D9BFF' : '#F29D4E' }]} />
                  <Animated.View style={[styles.waveBar, { height: 30, transform: [{ scaleY: wave3 }], backgroundColor: isListening ? '#4D9BFF' : '#F29D4E' }]} />
                  <Animated.View style={[styles.waveBar, { height: 20, transform: [{ scaleY: wave4 }], backgroundColor: isListening ? '#4D9BFF' : '#F29D4E' }]} />
                  <Animated.View style={[styles.waveBar, { height: 13, transform: [{ scaleY: wave5 }], backgroundColor: isListening ? '#4D9BFF' : '#F29D4E' }]} />
                </>
              ) : isProcessingOrResponding ? (
                <View style={styles.responseGlyphWrap}>
                  <Animated.View style={{ transform: [{ rotate: responseRotation }] }}>
                    <Text style={[styles.responseGlyph, { color: '#48C78E' }]}>↻</Text>
                  </Animated.View>
                </View>
              ) : isConnecting ? (
                <Animated.View style={{ transform: [{ scale: pulseScale }], opacity: pulseOpacity }}>
                  <View style={[styles.idleDot, { backgroundColor: '#FF9800', width: 14, height: 14, borderRadius: 7 }]} />
                </Animated.View>
              ) : (
                <View style={styles.idleDot} />
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

import { Text } from 'react-native';
