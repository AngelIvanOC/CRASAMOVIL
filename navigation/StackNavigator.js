import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/UserHomeScreen";
import DetailsScreen from "../screens/DetailsScreen";
import { Ionicons } from "@expo/vector-icons";
import ProductosTemplate from "../components/templates/ProductosTemplate";
import CatalogoTemplate from "../components/templates/CatalogoTemplate";
import DetalleVentaScreen from "../screens/DetalleVentasScreen";
import CatalogoScreen from "../screens/CatalogoScreen";
import EscanearVentaScreen from "../screens/EscanearVentaScreen";
import EscanearEntradaScreen from "../screens/EscanearEntradaScreen";
import HistorialEntradasScreen from "../screens/HistorialEntradaScreen";
import EscanearCostenaScreen from "../screens/EscanearCostenaScreen";
import AgregarProductoScreen from "../screens/AgregarProductoScreen";
import PisoScreen from "../screens/PisoScreen";
import BajarPisoScreen from "../screens/BajarPisoScreen";
import SueltoScreen from "../screens/SueltoScreen";
import SubirSueltoScreen from "../screens/SubirSueltoScreen";
import PendientesScreen from "../screens/PendientesScreen";
import ConfirmarPendienteScreen from "../screens/ConfirmarPendienteScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#023E8A" },
        headerTintColor: "white",
        headerTitleAlign: "left",
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: "bold",
        },
        headerBackTitleVisible: false,
        headerBackImage: () => (
          <Ionicons
            name="arrow-back"
            size={24}
            color="white"
            style={{ marginLeft: 10 }}
          />
        ),
      }}
    >
      <Stack.Screen
        name="Home"
        component={CatalogoScreen}
        options={{
          title: "Almacén",
        }}
      />
      <Stack.Screen
        name="DetalleVenta"
        component={DetalleVentaScreen}
        options={{
          title: "Detalle de Venta",
          headerStyle: {
            backgroundColor: "#023E8A",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      />

      <Stack.Screen
        name="Productos"
        component={ProductosTemplate}
        options={{}}
      />

      <Stack.Screen
        name="AgregarProducto"
        component={AgregarProductoScreen}
        options={{ title: "Agregar Producto" }}
      />

      <Stack.Screen
        name="EscanearVenta"
        component={EscanearVentaScreen}
        options={{ title: "EscanearVenta" }}
      />

      <Stack.Screen
        name="EscanearEntrada"
        component={EscanearEntradaScreen}
        options={{ title: "EscanearEntrada" }}
      />

      <Stack.Screen
        name="EscanearCostena"
        component={EscanearCostenaScreen}
        options={{ title: "EscanearCostena" }}
      />

      <Stack.Screen
        name="HistorialEntradas"
        component={HistorialEntradasScreen}
        options={{ title: "Tarimas" }}
      />

      <Stack.Screen
        name="Piso"
        component={PisoScreen}
        options={{ title: "Piso" }}
      />

      <Stack.Screen
        name="Suelto"
        component={SueltoScreen}
        options={{ title: "Suelto" }}
      />

      <Stack.Screen
        name="BajarPiso"
        component={BajarPisoScreen}
        options={{ title: "Bajar a Piso" }}
      />

      <Stack.Screen
        name="SubirSuelto"
        component={SubirSueltoScreen}
        options={{ title: "Subir Suelto" }}
      />

      <Stack.Screen
        name="PendienteScreen"
        component={PendientesScreen}
        options={{ title: "PendientesScreen" }}
      />

      <Stack.Screen
        name="ConfirmarPendienteScreen"
        component={ConfirmarPendienteScreen}
        options={{ title: "Confirmar Pendientes" }}
      />

      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{
          title: "Detalles",
        }}
      />
    </Stack.Navigator>
  );
}
