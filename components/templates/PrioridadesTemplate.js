import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { usePrioridades } from "../../hooks/usePrioridades";
import HistorialEntradaCard from "../atomos/HistorialEntradaCard";
import CardVenta from "../atomos/CardVenta";

const PrioridadesTemplate = ({ navigation }) => {
  const {
    proximosACaducar,
    pedidosUrgentes,
    loading,
    error,
    fetchPrioridades,
  } = usePrioridades();

  const handleVentaPress = (venta) => {
    navigation.navigate("DetalleVenta", { venta });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>Cargando prioridades...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPrioridades}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximos a caducar</Text>
        </View>

        {proximosACaducar.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No hay productos próximos a caducar
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {proximosACaducar.map((item) => (
              <HistorialEntradaCard
                key={item.id}
                item={item}
                mostrarNombreProducto
              />
            ))}
          </View>
        )}
      </View>

      <View>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pedidos urgentes</Text>
        </View>

        {pedidosUrgentes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay pedidos urgentes</Text>
          </View>
        ) : (
          <View>
            {pedidosUrgentes.map((venta) => (
              <CardVenta
                key={venta.id}
                venta={venta}
                onPress={handleVentaPress}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sectionHeader: {
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#023E8A",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardsContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
});

export default PrioridadesTemplate;
