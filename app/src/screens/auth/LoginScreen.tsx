import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput as NativeTextInput } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { DownloadAppButton } from '../../components/DownloadAppButton';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { FormTextField } from '../../components/FormTextField';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import type { RootStackScreenProps } from '../../navigation/types';
import { getErrorMessage } from '../../services/apiError';
import { spacing } from '../../theme/spacing';
import {
  hasErrors,
  validateLoginForm,
  type FormErrors,
  type LoginFormValues,
} from '../../utils/validation';
import { AuthHeader } from './AuthHeader';

export const LoginScreen = ({ navigation }: RootStackScreenProps<'Login'>) => {
  const { login, loginWithGoogle, sessionError } = useAuth();
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors<keyof LoginFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<NativeTextInput>(null);

  const updateField = (field: keyof LoginFormValues) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const validation = validateLoginForm(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await loginWithGoogle(idToken);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  };

  const bannerMessage = submitError ?? sessionError;

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <AuthHeader subtitle="Sua biblioteca pessoal, suas leituras e seus hábitos em um só lugar." />
      {bannerMessage ? <FeedbackBanner type="error" message={bannerMessage} /> : null}
      <FormTextField
        label="E-mail"
        required
        value={values.email}
        onChangeText={updateField('email')}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        disabled={isSubmitting}
      />
      <FormTextField
        ref={passwordRef}
        label="Senha"
        required
        value={values.password}
        onChangeText={updateField('password')}
        error={errors.password}
        secureTextEntry={!showPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        disabled={isSubmitting}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword((visible) => !visible)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          />
        }
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
        contentStyle={styles.submitContent}
      >
        Entrar
      </Button>
      <GoogleSignInButton onCredential={handleGoogle} disabled={isSubmitting} />
      <View style={styles.footer}>
        <Text variant="bodyMedium">Ainda não tem conta?</Text>
        <Button mode="text" onPress={() => navigation.navigate('Register')} disabled={isSubmitting}>
          Criar conta
        </Button>
      </View>
      <DownloadAppButton />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  submit: { marginTop: spacing.sm },
  submitContent: { paddingVertical: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
