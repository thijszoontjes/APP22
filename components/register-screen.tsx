import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require('@/assets/images/login-header.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Account aanmaken</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Naam"
            placeholderTextColor="#7a7a7a"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#7a7a7a"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Telefoonnummer"
            placeholderTextColor="#7a7a7a"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Wachtwoord"
            placeholderTextColor="#7a7a7a"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
            <Image
              source={require('@/assets/images/eye.png')}
              style={styles.eyeImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Wachtwoord herhalen"
            placeholderTextColor="#7a7a7a"
            secureTextEntry={!showRepeat}
          />
          <TouchableOpacity onPress={() => setShowRepeat((prev) => !prev)}>
            <Image
              source={require('@/assets/images/eye.png')}
              style={styles.eyeImg}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitText}>Registreer</Text>
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text style={styles.backLink}>Terug naar inloggen</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const ORANGE = '#ff8a00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hero: {
    height: 260,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  badge: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -32,
    height: 64,
    width: 128,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 90,
    height: 60,
    borderRadius: 30,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#fff',
    flexDirection: 'row',
  },
  badgeTail: {
    position: 'absolute',
    right: 16,
    bottom: -2,
    width: 18,
    height: 24,
    backgroundColor: ORANGE,
    transform: [{ skewY: '-12deg' }],
  },
  badgeText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
  },
  form: {
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    color: '#121212',
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingVertical: 0,
  },
  eyeImg: {
    width: 22,
    height: 22,
    tintColor: '#b4b4b4',
  },
  submitButton: {
    height: 38,
    backgroundColor: ORANGE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    width: 160,
    alignSelf: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backLink: {
    marginTop: 18,
    color: '#6b82ff',
    fontSize: 15,
    textAlign: 'center',
  },
});
