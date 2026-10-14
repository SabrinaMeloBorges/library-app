import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { useAppTheme } from '../hooks/useAppTheme';
import { GoalsScreen } from '../screens/GoalsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { fontFamilies } from '../theme/spacing';
import type { MainTabParamList } from './types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Library: { active: 'bookshelf', inactive: 'bookshelf' },
  Goals: { active: 'flag', inactive: 'flag-outline' },
  Profile: { active: 'account-circle', inactive: 'account-circle-outline' },
};

export const MainTabs = () => {
  const theme = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.appColors.background },
        headerShadowVisible: false,
        headerTintColor: theme.appColors.text,
        headerTitleStyle: { fontFamily: fontFamilies.displayBold, fontSize: 24 },
        tabBarActiveTintColor: theme.appColors.primary,
        tabBarInactiveTintColor: theme.appColors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.appColors.surface,
          borderTopColor: theme.appColors.border,
        },
        tabBarLabelStyle: { fontFamily: fontFamilies.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <MaterialCommunityIcons
              name={focused ? icons.active : icons.inactive}
              color={color}
              size={size}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início', headerTitle: 'Library' }}
      />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Biblioteca' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Metas' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
};
