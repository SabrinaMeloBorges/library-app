import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useThemeMode } from '../hooks/useThemeMode';
import { BookDetailsScreen } from '../screens/BookDetailsScreen';
import { BookFormScreen } from '../screens/BookFormScreen';
import { CatalogSearchScreen } from '../screens/CatalogSearchScreen';
import { GoalFormScreen } from '../screens/GoalFormScreen';
import { ReminderSettingsScreen } from '../screens/ReminderSettingsScreen';
import { SessionFormScreen } from '../screens/SessionFormScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { toNavigationTheme } from '../theme/paperTheme';
import { fontFamilies } from '../theme/spacing';
import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const theme = useAppTheme();
  const { themeMode } = useThemeMode();
  const { isAuthenticated, isLoading } = useAuth();
  const navigationTheme = useMemo(() => toNavigationTheme(theme, themeMode), [theme, themeMode]);

  if (isLoading) return <LoadingState message="Abrindo o Library..." />;

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.appColors.background },
          headerShadowVisible: false,
          headerTintColor: theme.appColors.text,
          headerTitleStyle: { fontFamily: fontFamilies.displayBold, fontSize: 22 },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.appColors.background },
        }}
      >
        {isAuthenticated ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="BookDetails"
              component={BookDetailsScreen}
              options={{ title: 'Detalhes' }}
            />
            <Stack.Screen name="BookForm" component={BookFormScreen} options={{ title: 'Livro' }} />
            <Stack.Screen
              name="CatalogSearch"
              component={CatalogSearchScreen}
              options={{ title: 'Adicionar livro' }}
            />
            <Stack.Screen
              name="SessionForm"
              component={SessionFormScreen}
              options={{ title: 'Sessão' }}
            />
            <Stack.Screen name="GoalForm" component={GoalFormScreen} options={{ title: 'Meta' }} />
            <Stack.Screen
              name="Statistics"
              component={StatisticsScreen}
              options={{ title: 'Estatísticas' }}
            />
            <Stack.Screen
              name="ReminderSettings"
              component={ReminderSettingsScreen}
              options={{ title: 'Lembretes' }}
            />
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ animationTypeForReplace: 'pop' }}>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Criar conta' }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
