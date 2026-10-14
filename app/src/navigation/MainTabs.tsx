import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { GoalsScreen } from '../screens/GoalsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { fontFamilies, radius } from '../theme/spacing';
import type { MainTabParamList } from './types';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Library: { active: 'bookshelf', inactive: 'bookshelf' },
  Community: { active: 'account-group', inactive: 'account-group-outline' },
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
        headerTitleStyle: { fontFamily: fontFamilies.displayBold, fontSize: 26 },
        tabBarActiveTintColor: theme.appColors.highlight,
        tabBarInactiveTintColor: theme.appColors.primary,
        tabBarStyle: {
          backgroundColor: theme.appColors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: radius.lg * 1.5,
          borderTopRightRadius: radius.lg * 1.5,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontFamily: fontFamilies.bodyMedium, fontSize: 11 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={focused ? icons.active : icons.inactive}
                color={color}
                size={size}
              />
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: focused ? theme.appColors.highlight : 'transparent' },
                ]}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início', headerShown: false }}
      />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Biblioteca' }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: 'Comunidade' }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: 'Metas' }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Perfil', headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center' },
  indicator: { width: 18, height: 3, borderRadius: 2, marginTop: 2 },
});
