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
      {/* Pantalla principal del almacén (catálogo de marcas) */}
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

      {/* Pantalla de productos de una marca específica */}
      <Stack.Screen
        name="Productos"
        component={ProductosTemplate}
        options={
          {
            // El título se configurará dinámicamente en ProductosTemplate
          }
        }
      />

      <Stack.Screen
        name="AgregarProducto"
        component={AgregarProductoScreen}
        options={{ title: "Agregar Producto" }} // El header se maneja en el template
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

      {/* Mantén tus otras pantallas si las necesitas */}
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
