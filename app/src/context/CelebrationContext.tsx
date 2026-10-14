import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, AppState, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { AchievementBadge } from '../components/AchievementBadge';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { achievementService } from '../services/achievementService';
import { radius, spacing } from '../theme/spacing';
import type { UnlockedAchievement } from '../types/social';
import { TIER_LABELS, tierColor } from '../utils/achievements';

export interface CelebrationContextValue {
  checkAchievements: () => Promise<void>;
}

export const CelebrationContext = createContext<CelebrationContextValue | null>(null);

const CelebrationCard = ({
  achievement,
  onContinue,
}: {
  achievement: UnlockedAchievement;
  onContinue: () => void;
}) => {
  const theme = useAppTheme();
  const [scale] = useState(() => new Animated.Value(0.6));
  const color = tierColor(achievement.tier, theme.appColors);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale, achievement.code]);

  return (
    <View
      style={[styles.card, { backgroundColor: theme.appColors.surface, borderColor: color }]}
      accessibilityViewIsModal
      accessibilityLiveRegion="assertive"
    >
      <Text variant="labelLarge" style={{ color }}>
        Conquista desbloqueada · {TIER_LABELS[achievement.tier]}
      </Text>
      <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
        <AchievementBadge code={achievement.code} tier={achievement.tier} size={112} />
      </Animated.View>
      <Text variant="headlineMedium" style={styles.center} accessibilityRole="header">
        {achievement.title}
      </Text>
      <Text variant="bodyLarge" style={[styles.center, { color: theme.appColors.textMuted }]}>
        {achievement.description}
      </Text>
      <Text variant="bodySmall" style={[styles.center, { color: theme.appColors.textMuted }]}>
        Seus amigos verão essa conquista no feed, se o compartilhamento estiver ativo.
      </Text>
      <Button
        mode="contained"
        onPress={onContinue}
        style={styles.action}
        contentStyle={styles.actionContent}
      >
        Continuar
      </Button>
    </View>
  );
};

export const CelebrationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [queue, setQueue] = useState<UnlockedAchievement[]>([]);
  const checkingRef = useRef(false);
  const queuedCodesRef = useRef(new Set<string>());

  const checkAchievements = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const pending = await achievementService.pending();
      const fresh = pending.filter((item) => !queuedCodesRef.current.has(item.code));
      fresh.forEach((item) => queuedCodesRef.current.add(item.code));
      if (fresh.length > 0) setQueue((current) => [...current, ...fresh]);
    } catch {
      return;
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => void checkAchievements(), 600);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void checkAchievements();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [isAuthenticated, checkAchievements]);

  const current = isAuthenticated ? queue[0] : undefined;

  const dismiss = useCallback(() => {
    setQueue((items) => {
      const [first, ...rest] = items;
      if (first) void achievementService.markSeen([first.code]).catch(() => undefined);
      return rest;
    });
  }, []);

  const value = useMemo(() => ({ checkAchievements }), [checkAchievements]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <Portal>
        <Modal visible={Boolean(current)} onDismiss={dismiss} contentContainerStyle={styles.modal}>
          {current ? (
            <CelebrationCard key={current.code} achievement={current} onContinue={dismiss} />
          ) : null}
        </Modal>
      </Portal>
    </CelebrationContext.Provider>
  );
};

const styles = StyleSheet.create({
  modal: { padding: spacing.xl, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  badge: { marginVertical: spacing.sm },
  center: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.sm, borderRadius: 999 },
  actionContent: { paddingVertical: spacing.xs },
});
