import { Link } from 'expo-router';
import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function WachtwoordVergetenScreen() {
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
          <Text style={styles.title}>Wachtwoord vergeten</Text>
          <Text style={styles.subtitle}>
            Vul je e-mailadres in en wij sturen je een resetlink.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>Stuur mail</Text>
          </TouchableOpacity>

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
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
