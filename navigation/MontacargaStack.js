import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PendientesScreen from "../screens/PendientesScreen";
import ConfirmarPendienteScreen from "../screens/ConfirmarPendienteScreen";

const Stack = createNativeStackNavigator();

export default function MontacargaStack() {
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
        name="PendienteScreen"
        component={PendientesScreen}
        options={{ title: "Pendientes" }}
      />
      <Stack.Screen
        name="ConfirmarPendienteScreen"
        component={ConfirmarPendienteScreen}
        options={{ title: "Confirmar Pendiente" }}
      />
    </Stack.Navigator>
  );
}
