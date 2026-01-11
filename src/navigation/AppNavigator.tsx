import React from 'react';
import { createBottomTabNavigator, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { ProductScreen } from '../screens/ProductScreen';
import { CartScreen } from '../screens/CartScreen';
import { AddProductScreen } from '../screens/AddProductScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useCartStore } from '../store/cartStore';

// 定义路由参数类型
type RootTabParamList = {
  Products: undefined;
  Add: undefined;
  Stats: undefined;
  Settings: undefined;
  Cart: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ProductTabIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>📦</Text>
    <Text style={styles.labelText} numberOfLines={1}>商品</Text>
  </View>
);

const AddTabIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>➕</Text>
    <Text style={styles.labelText} numberOfLines={1}>添加</Text>
  </View>
);

const StatsTabIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>📈</Text>
    <Text style={styles.labelText} numberOfLines={1}>统计</Text>
  </View>
);

const SettingsTabIcon: React.FC = () => (
  <View style={styles.iconContainer}>
    <Text style={styles.iconText}>⚙️</Text>
    <Text style={styles.labelText} numberOfLines={1}>设置</Text>
  </View>
);

const CartTabIcon: React.FC = () => {
  const { getTotalItems } = useCartStore();
  const count = getTotalItems();
  
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.iconText}>🛒</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      <Text style={styles.labelText} numberOfLines={1}>购物车</Text>
    </View>
  );
};

// 定义screenOptions的类型
type ScreenOptionsProps = {
  route: {
    name: keyof RootTabParamList;
  };
  navigation: any;
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }: ScreenOptionsProps) => ({
          tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
            if (route.name === 'Cart') return <CartTabIcon />;
            if (route.name === 'Add') return <AddTabIcon />;
            if (route.name === 'Stats') return <StatsTabIcon />;
            if (route.name === 'Settings') return <SettingsTabIcon />;
            return <ProductTabIcon />;
          },
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
        })}
      >
        <Tab.Screen
          name="Products"
          component={ProductScreen}
        />
        <Tab.Screen
          name="Add"
          component={AddProductScreen}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
        />
        <Tab.Screen
          name="Cart"
          component={CartScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingBottom: 4,
  },
  iconText: {
    fontSize: 24,
    marginBottom: 2,
  },
  labelText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    minWidth: 36,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});