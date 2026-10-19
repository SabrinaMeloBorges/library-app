import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';
import type { GoogleSignInButtonProps } from './GoogleSignInButton';

interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? '';
const MAX_BUTTON_WIDTH = 400;

let scriptPromise: Promise<GoogleAccountsId> | null = null;

const loadGoogleIdentity = (): Promise<GoogleAccountsId> => {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () =>
      window.google?.accounts?.id
        ? resolve(window.google.accounts.id)
        : reject(new Error('Google Identity indisponível'));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Falha ao carregar o Google Identity'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

export const GoogleSignInButton = ({ onCredential, disabled }: GoogleSignInButtonProps) => {
  const theme = useAppTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let active = true;
    loadGoogleIdentity()
      .then((googleId) => {
        const element = containerRef.current;
        if (!active || !element) return;
        googleId.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => {
            if (credential) callbackRef.current(credential);
          },
        });
        element.innerHTML = '';
        googleId.renderButton(element, {
          type: 'standard',
          theme: theme.dark ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          locale: 'pt-BR',
          width: Math.min(element.offsetWidth || MAX_BUTTON_WIDTH, MAX_BUTTON_WIDTH),
        });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [theme.dark]);

  if (!CLIENT_ID || failed) return null;

  return (
    <View style={styles.wrapper} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.colors.outlineVariant }]} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          ou
        </Text>
        <View style={[styles.line, { backgroundColor: theme.colors.outlineVariant }]} />
      </View>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.md, gap: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
});
