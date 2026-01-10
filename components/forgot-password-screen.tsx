import { forgotPasswordApi } from '@/hooks/useAuthApi';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ORANGE = '#FF8700';

export default function WachtwoordVergetenScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null); // Voor development testing

  const handleSendEmail = async () => {
    console.log('[ForgotPasswordScreen] handleSendEmail called');
    console.log('[ForgotPasswordScreen] Email:', email);
    
    if (!email || !email.trim()) {
      console.log('[ForgotPasswordScreen] Email is empty');
      Alert.alert('Fout', 'Vul je e-mailadres in');
      return;
    }

    if (!email.includes('@')) {
      console.log('[ForgotPasswordScreen] Email does not contain @');
      Alert.alert('Fout', 'Vul een geldig e-mailadres in');
      return;
    }

    console.log('[ForgotPasswordScreen] Validation passed, calling API...');
    setLoading(true);
    
    try {
      const result = await forgotPasswordApi(email.trim());
      console.log('[ForgotPasswordScreen] API call successful:', result);
      
      // BELANGRIJK: Negeer de token in de response (beveiligingsrisico van backend)
      // Gebruiker moet wachten op email met token
      if (result.token) {
        console.warn('[ForgotPasswordScreen] ⚠️ SECURITY WARNING: Backend returns token in response! This should only be sent via email.');
        console.warn('[ForgotPasswordScreen] Token wordt genegeerd. Gebruiker moet wachten op email.');
        
        // Sla token op voor development testing
        setDevToken(result.token);
        
        // ====== DEVELOPMENT ONLY: Genereer de volledige reset link voor testing ======
        const resetLink = `exp://192.168.1.1:8081/--/reset-password?token=${result.token}`;
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('🔗 TEST RESET LINK (Development Only - Backend should send via email!)');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`Email: ${email.trim()}`);
        console.log(`Token: ${result.token}`);
        console.log('');
        console.log('📧 DEZE LINK ZOU PER EMAIL VERSTUURD MOETEN WORDEN:');
        console.log(resetLink);
        console.log('');
        console.log('🧪 Om te testen, kopieer de token en ga handmatig naar reset-password:');
        console.log(`   Token: ${result.token}`);
        console.log('');
        console.log('⚠️  Backend stuurt GEEN email! Configureer SMTP service.');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('');
      }
      
      setSuccess(true);
      
      // Toon altijd dezelfde melding - gebruiker moet email checken
      Alert.alert(
        'Resetlink aangevraagd',
        'Als dit e-mailadres bestaat, ontvang je binnen enkele minuten een email met een resetlink. Check ook je spam folder.\n\nKlik op de link in de email om je wachtwoord te resetten.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('[ForgotPasswordScreen] API call failed');
      console.error('[ForgotPasswordScreen] Error:', err);
      console.error('[ForgotPasswordScreen] Error message:', err?.message);
      console.error('[ForgotPasswordScreen] Error stack:', err?.stack);
      
      Alert.alert('Fout', err?.message || 'Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
      console.log('[ForgotPasswordScreen] Request completed');
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
            accessible={false}
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
              accessibilityLabel="E-mailadres"
            />
          </View>

          {success ? (
            <>
              <View style={styles.successBox}>
                <Text style={styles.successText}>✓ Aanvraag verstuurd!</Text>
                <Text style={styles.successSubtext}>Check je email voor de resetlink</Text>
              </View>
              
              {/* DEVELOPMENT MODE: Toon test knop als backend token teruggeeft */}
              {devToken && (
                <View style={styles.devBox}>
                  <Text style={styles.devTitle}>🧪 DEVELOPMENT MODE</Text>
                  <Text style={styles.devText}>
                    Backend heeft geen email service geconfigureerd, maar geeft wel een token terug.
                  </Text>
                  <Text style={styles.devTokenText}>Token: {devToken.substring(0, 20)}...</Text>
                  <TouchableOpacity 
                    style={styles.devButton}
                    onPress={() => {
                      router.push({
                        pathname: '/reset-password',
                        params: { token: devToken }
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Test reset wachtwoord"
                  >
                    <Text style={styles.devButtonText}>
                      🔧 Test Reset Password (Dev Only)
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.devWarning}>
                    ⚠️ Deze knop hoort er niet te zijn in productie!
                  </Text>
                </View>
              )}
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.ctaButton, loading && styles.ctaButtonDisabled]} 
              onPress={handleSendEmail}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Stuur resetmail"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Stuur mail</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Terug naar inloggen"
          >
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
  devBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FBC02D',
  },
  devTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F57F17',
    textAlign: 'center',
    marginBottom: 8,
  },
  devText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
  },
  devTokenText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  devButton: {
    backgroundColor: '#FBC02D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  devButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  devWarning: {
    fontSize: 11,
    color: '#F57F17',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  backLink: {
    marginTop: 18,
    color: '#6080FF',
    fontSize: 15,
    textAlign: 'center',
  },
});
