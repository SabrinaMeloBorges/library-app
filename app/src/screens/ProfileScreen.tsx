import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookStackIllustration } from '../components/BookStackIllustration';
import { PillButton } from '../components/PillButton';
import { ReadingProgress } from '../components/ReadingProgress';
import { SectionHeader } from '../components/SectionHeader';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useStatistics } from '../hooks/useStatistics';
import type { MainTabScreenProps } from '../navigation/types';
import { radius, spacing } from '../theme/spacing';
import { ProfileContent } from './profile/ProfileContent';

export const ProfileScreen = ({ navigation }: MainTabScreenProps<'Profile'>) => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { profile, activities, refresh } = useProfile(user?.id);
  const statistics = useStatistics();
  const annualGoal = statistics.data?.annualGoal ?? null;
  const year = statistics.data?.year ?? new Date().getFullYear();

  if (!user || profile.isLoading) return <LoadingState message="Abrindo seu perfil..." />;
  if (profile.error || !profile.data) {
    return (
      <ErrorState message={profile.error ?? 'Perfil indisponível.'} onRetry={profile.reload} />
    );
  }

  const challenge = (
    <>
      <SectionHeader title={`Desafio de ${year}`} />
      <View style={[styles.challenge, { backgroundColor: theme.appColors.accentSoft }]}>
        <View style={styles.flex}>
          {annualGoal ? (
            <>
              <Text variant="titleMedium">{annualGoal.title}</Text>
              <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                {annualGoal.currentValue} de {annualGoal.targetValue}
              </Text>
              <ReadingProgress percentage={annualGoal.percentage} label="Progresso" />
              <PillButton
                style={styles.challengeAction}
                onPress={() => navigation.navigate('GoalForm', { goalId: annualGoal.id })}
              >
                Editar meta
              </PillButton>
            </>
          ) : (
            <>
              <Text variant="titleMedium">Sem desafio anual</Text>
              <PillButton
                style={styles.challengeAction}
                onPress={() => navigation.navigate('GoalForm')}
              >
                Criar desafio
              </PillButton>
            </>
          )}
        </View>
        <BookStackIllustration books={4} width={60} seed={3} />
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.hero }]}
      edges={['top', 'left', 'right']}
    >
      <ProfileContent
        profile={profile.data}
        activities={activities.items}
        isRefreshing={profile.isRefreshing}
        onRefresh={() => {
          void refresh();
          void statistics.refresh();
        }}
        onOpenFollowers={() =>
          navigation.navigate('FollowList', { userId: user.id, mode: 'followers' })
        }
        onOpenFollowing={() =>
          navigation.navigate('FollowList', { userId: user.id, mode: 'following' })
        }
        onOpenUser={(userId) =>
          userId === user.id ? undefined : navigation.navigate('UserProfile', { userId })
        }
        onOpenComments={(activityId) => navigation.navigate('ActivityComments', { activityId })}
        onToggleLike={activities.toggleLike}
        onOpenShelf={(status) =>
          navigation.navigate('Main', { screen: 'Library', params: { status } })
        }
        onOpenBook={(bookId) => navigation.navigate('BookDetails', { bookId })}
        onOpenAchievements={() => navigation.navigate('Achievements')}
        extraSection={challenge}
        topActions={
          <IconButton
            icon="cog-outline"
            iconColor={theme.appColors.onHero}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Configurações"
          />
        }
        headerActions={
          <>
            <PillButton icon="pencil-outline" onPress={() => navigation.navigate('EditProfile')}>
              Editar perfil
            </PillButton>
            <PillButton
              variant="soft"
              icon="account-search-outline"
              onPress={() => navigation.navigate('FindPeople')}
            >
              Encontrar pessoas
            </PillButton>
          </>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  challenge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  challengeAction: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
