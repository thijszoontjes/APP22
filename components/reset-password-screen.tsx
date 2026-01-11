import { resetPasswordApi } from '@/hooks/useAuthApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Fout', 'Wachtwoord moet minimaal 6 karakters lang zijn');
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert('Fout', 'Wachtwoorden komen niet overeen');
      return;
    }

    if (!token) {
      Alert.alert('Fout', 'Geen geldige resetlink. Vraag een nieuwe resetlink aan.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      Alert.alert(
        'Succes!',
        'Je wachtwoord is succesvol gereset. Je kunt nu inloggen met je nieuwe wachtwoord.',
        [
          {
            text: 'Naar inloggen',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (err: any) {
      console.error('[ResetPassword] Error:', err);
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
          <Text style={styles.title}>Nieuw wachtwoord</Text>
          <Text style={styles.subtitle}>
            Kies een nieuw wachtwoord voor je account.
          </Text>

          {!token && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ Geen geldige resetlink</Text>
              <Text style={styles.warningSubtext}>Vraag een nieuwe resetlink aan via &quot;Wachtwoord vergeten&quot;</Text>
            </View>
          )}

          <Text style={styles.label}>Wachtwoord</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              placeholder="Minimaal 6 karakters"
              placeholderTextColor="#999"
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
              value={repeatPassword}
              onChangeText={setRepeatPassword}
              editable={!loading}
              placeholder="Herhaal je wachtwoord"
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => setShowRepeat((prev) => !prev)}>
              <Image
                source={require('@/assets/images/eye.png')}
                style={styles.eyeImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.ctaButton, (loading || !token) && styles.ctaButtonDisabled]} 
            onPress={handleResetPassword}
            disabled={loading || !token}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Opslaan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.backLink}>Terug naar inloggen</Text>
          </TouchableOpacity>
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
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  warningText: {
    color: '#856404',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningSubtext: {
    color: '#856404',
    fontSize: 13,
  },
  backLink: {
    marginTop: 18,
    color: '#6080FF',
    fontSize: 15,
    textAlign: 'center',
  },
});
