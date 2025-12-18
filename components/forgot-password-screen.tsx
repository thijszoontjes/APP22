import { forgotPasswordApi } from '@/hooks/useAuthApi';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function WachtwoordVergetenScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendEmail = async () => {
    if (!email || !email.trim()) {
      Alert.alert('Fout', 'Vul je e-mailadres in');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Fout', 'Vul een geldig e-mailadres in');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setSuccess(true);
      Alert.alert(
        'E-mail verstuurd',
        'Als dit e-mailadres bestaat, hebben we een resetlink gestuurd. Check je inbox (en spam folder).',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[ForgotPassword] Error:', err);
      Alert.alert('Fout', err?.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };
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
              value={email}
              onChangeText={setEmail}
              editable={!loading && !success}
              placeholder="voorbeeld@email.com"
              placeholderTextColor="#999"
            />
          </View>

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ E-mail verstuurd!</Text>
              <Text style={styles.successSubtext}>Check je inbox en spam folder</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]} 
              onPress={handleSendEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Stuur mail</Text>
              )}
            </TouchableOpacity>
          )}

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
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtext: {
    color: '#2E7D32',
    fontSize: 13,
    textAlign: 'center',
  },
  backLink: {
    marginTop: 18,
    color: '#6080FF',
    fontSize: 15,
    textAlign: 'center',
  },
});
