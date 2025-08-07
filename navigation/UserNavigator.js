import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import UserHomeScreen from "../screens/UserHomeScreen";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import StackNavigator from "./StackNavigator";
import CatalogoScreen from "../screens/CatalogoScreen";
import VentasStack from "./VentasStack";
import MontacargaStack from "./MontacargaStack";
import PrioridadesScreen from "../screens/PrioridadesScreen";
import Camara from "../screens/Camara";
import { useUsuarios } from "../hooks/useUsuarios";

const Tab = createBottomTabNavigator();

const UserNavigator = () => {
  const { usuarioActual } = useUsuarios();
  const rolId = usuarioActual?.roles?.id;

  const isRole4 = rolId === 4; // Solo "Pendientes" y "Configuración"
  const isAyudante = rolId === 5; // Solo "Ventas" y "Configuración"

  return (
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
      {/* Rol 4: solo Pendientes y Configuración */}
      {isRole4 && (
        <Tab.Screen
          name="Pendientes"
          component={MontacargaStack}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons
                name="elevator-up"
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Rol 5 (Ayudante): solo Ventas y Configuración */}
      {isAyudante && (
        <Tab.Screen
          name="Ventas"
          component={VentasStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Feather name="shopping-cart" size={24} color={color} />
            ),
          }}
        />
      )}

      {/* Otros roles: Almacén, Ventas, Prioridades, Configuración */}
      {!isRole4 && !isAyudante && (
        <>
          <Tab.Screen
            name="Almacen"
            component={StackNavigator}
            options={{
              tabBarIcon: ({ color }) => (
                <Feather name="package" size={24} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Ventas"
            component={VentasStack}
            options={{
              tabBarIcon: ({ color }) => (
                <Feather name="shopping-cart" size={24} color={color} />
              ),
            }}
          />

          <Tab.Screen
            name="Prioridades"
            component={PrioridadesScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Feather name="alert-triangle" size={24} color={color} />
              ),
            }}
          />
        </>
      )}

      {/* Configuración para todos */}
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
};

export default UserNavigator;
