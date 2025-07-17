// navigation/VentasStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VentasScreen from "../screens/VentasScreen";
import DetalleVentaScreen from "../screens/DetalleVentasScreen";
import EscanearVentaScreen from "../screens/EscanearVentaScreen";

const Stack = createNativeStackNavigator();

export default function VentasStack() {
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
      }}
    >
      <Stack.Screen
        name="VentasHome"
        component={VentasScreen}
        options={{ title: "Ventas" }}
      />
      <Stack.Screen
        name="DetalleVenta"
        component={DetalleVentaScreen}
        options={{ title: "DetalleVenta" }}
      />
      <Stack.Screen
        name="EscanearVenta"
        component={EscanearVentaScreen}
        options={{ title: "EscanearVenta" }}
      />
    </Stack.Navigator>
  );
}
