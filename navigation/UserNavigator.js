import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import UserHomeScreen from "../screens/UserHomeScreen";
import { Feather } from "@expo/vector-icons";
import StackNavigator from "./StackNavigator";
import CatalogoScreen from "../screens/CatalogoScreen";
import VentasStack from "./VentasStack";
import PrioridadesScreen from "../screens/PrioridadesScreen";
import Camara from "../screens/Camara";

const Tab = createBottomTabNavigator();

const UserNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      headerTitleAlign: "left",
      headerStyle: { backgroundColor: "#023E8A" },
      headerTintColor: "white",
      headerTitleStyle: {
        fontSize: 24,
        fontWeight: "bold",
      },
    }}
  >
    <Tab.Screen
      name="Almacen"
      component={StackNavigator}
      options={{
        headerShown: false, // El StackNavigator maneja sus propios headers
        tabBarIcon: ({ color }) => (
          <Feather name="package" size={24} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Ventas"
      component={VentasStack} // <-- Aquí
      options={{
        tabBarIcon: ({ color }) => (
          <Feather name="shopping-cart" size={24} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Prioridades"
      //component={CatalogoScreen}
      component={PrioridadesScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Feather name="alert-triangle" size={24} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Configuracion"
      component={UserHomeScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <Feather name="settings" size={24} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default UserNavigator;
