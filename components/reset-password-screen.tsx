import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function ResetPasswordScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/login-header.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Nieuw wachtwoord</Text>
          <Text style={styles.subtitle}>
            Kies een nieuw wachtwoord voor je account.
          </Text>

          <Text style={styles.label}>Wachtwoord</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
              <Image
                source={require('@/assets/images/eye.png')}
                style={styles.eyeImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Wachtwoord herhalen</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showRepeat}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowRepeat((prev) => !prev)}>
              <Image
                source={require('@/assets/images/eye.png')}
                style={styles.eyeImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <Link href="/login" asChild>
            <TouchableOpacity style={styles.ctaButton}>
              <Text style={styles.ctaText}>Opslaan</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.backLink}>Terug naar inloggen</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200,
  },
  hero: {
    height: '40%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  form: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '400',
    textAlign: 'center',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#1A2233',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    color: '#1A2233',
    marginLeft: 4,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#fff',
    marginBottom: 16,
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
  ctaButton: {
    height: 40,
    backgroundColor: ORANGE,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: 170,
    alignSelf: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  backLink: {
    marginTop: 18,
    color: '#6080FF',
    fontSize: 15,
    textAlign: 'center',
  },
});
