import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useMarcas } from "../../hooks/useMarcas";
import CardsCatalogo from "../organismos/CardsCatalogo";

const CatalogoTemplate = ({ navigation }) => {
  const { marcas, loading, error } = useMarcas();

  const handleMarcaPress = (marca) => {
    navigation.navigate("Productos", { marca });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>Cargando marcas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CardsCatalogo marcas={marcas} onMarcaPress={handleMarcaPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default CatalogoTemplate;
