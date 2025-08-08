import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import EscanearVentaTemplate from "../components/templates/EscanearVentaTemplate";
import { useVentas } from "../hooks/useVentas";

const EscanearVentaScreen = ({ route, navigation }) => {
  const { detalle, ventaId, onUpdate } = route.params;

  const { updateVentaEstado } = useVentas();

  useEffect(() => {
    navigation.setOptions({
      title: `Escanear Producto`,
      headerStyle: {
        backgroundColor: "#023E8A",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });
  }, [navigation]);

  const handleScanComplete = async () => {
    try {
      if (ventaId) {
        await updateVentaEstado(ventaId);
      }
      if (onUpdate) {
        onUpdate();
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error in handleScanComplete:", error);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <EscanearVentaTemplate
        detalle={detalle}
        ventaId={ventaId}
        navigation={navigation}
        onScanComplete={handleScanComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

export default EscanearVentaScreen;
