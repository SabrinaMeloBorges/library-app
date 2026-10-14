import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AchievementBadge } from '../components/AchievementBadge';
import { ReadingProgress } from '../components/ReadingProgress';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { achievementService } from '../services/achievementService';
import type { AchievementStatus, AchievementTier } from '../types/social';
import { TIER_LABELS, tierColor } from '../utils/achievements';
import { formatDate } from '../utils/dates';
import { radius, spacing } from '../theme/spacing';

const TIERS: { tier: AchievementTier; description: string }[] = [
  { tier: 'BRONZE', description: 'Primeiros passos' },
  { tier: 'SILVER', description: 'Hábito em construção' },
  { tier: 'GOLD', description: 'Grandes marcos' },
];

const AchievementRow = ({ achievement }: { achievement: AchievementStatus }) => {
  const theme = useAppTheme();
  const progress = Math.round((achievement.currentValue / achievement.threshold) * 100);
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: achievement.unlocked ? theme.appColors.surface : 'transparent',
          borderColor: achievement.unlocked
            ? tierColor(achievement.tier, theme.appColors)
            : theme.appColors.border,
        },
      ]}
      accessible
      accessibilityLabel={`${achievement.title}. ${achievement.unlocked ? 'Desbloqueada' : `Bloqueada, ${progress}%`}`}
    >
      <AchievementBadge
        code={achievement.code}
        tier={achievement.tier}
        size={56}
        locked={!achievement.unlocked}
      />
      <View style={styles.flex}>
        <Text variant="titleMedium">{achievement.title}</Text>
        <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
          {achievement.description}
        </Text>
        {achievement.unlocked && achievement.unlockedAt ? (
          <Text
            variant="labelSmall"
            style={{ color: tierColor(achievement.tier, theme.appColors) }}
          >
            Desbloqueada em {formatDate(achievement.unlockedAt)}
          </Text>
        ) : (
          <ReadingProgress
            percentage={progress}
            label={`${achievement.currentValue} de ${achievement.threshold}`}
          />
        )}
      </View>
    </View>
  );
};

export const AchievementsScreen = () => {
  const theme = useAppTheme();
  const loader = useCallback(() => achievementService.list(), []);
  const achievements = useAsyncResource(loader);

  if (achievements.isLoading) return <LoadingState message="Carregando conquistas..." />;
  if (achievements.error || !achievements.data) {
    return (
      <ScreenContainer>
        <ErrorState message={achievements.error ?? 'Sem dados.'} onRetry={achievements.reload} />
      </ScreenContainer>
    );
  }

  const unlocked = achievements.data.filter((item) => item.unlocked).length;

  return (
    <ScreenContainer refreshing={achievements.isRefreshing} onRefresh={achievements.refresh}>
      <View style={[styles.summary, { backgroundColor: theme.appColors.accentSoft }]}>
        <Text variant="displaySmall" style={{ color: theme.appColors.primary }}>
          {unlocked}/{achievements.data.length}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
          conquistas desbloqueadas. Continue lendo para colecionar todas.
        </Text>
      </View>
      {TIERS.map(({ tier, description }) => (
        <View key={tier}>
          <SectionHeader title={TIER_LABELS[tier]} subtitle={description} />
          {achievements.data
            ?.filter((item) => item.tier === tier)
            .map((item) => (
              <AchievementRow key={item.code} achievement={item} />
            ))}
        </View>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  summary: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
