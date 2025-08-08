import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import DetalleVentaTemplate from "../components/templates/DetalleVentaTemplate";

const DetalleVentaScreen = ({ route, navigation }) => {
  const { venta, ventaId } = route.params;
  const id = ventaId || venta?.id;

  useEffect(() => {
    if (venta) {
      navigation.setOptions({
        title: `Venta ${venta.codigo || venta.id}`,
        headerStyle: {
          backgroundColor: "#023E8A",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      });
    }
  }, [venta, navigation]);

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: No se encontró la información de la venta
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetalleVentaTemplate
        ventaId={id}
        navigation={navigation}
        route={route}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default DetalleVentaScreen;
