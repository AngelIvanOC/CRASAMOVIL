import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

const CardProducto = ({ producto, onHistorialPress, onPisoPress }) => {
  const cajasEsArray = Array.isArray(producto.cajas);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.codigo}>#{producto.codigo}</Text>
        <Text style={styles.rack}>
          {producto.cajas && producto.cajas.length > 0
            ? [
                ...new Set(
                  producto.cajas
                    .filter((caja) => caja.cantidad > 0)
                    .map((caja) => caja.racks?.codigo_rack)
                    .filter(Boolean)
                ),
              ].join(", ") || "N/A"
            : "N/A"}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.nombre} numberOfLines={2}>
          {producto.nombre}
        </Text>

        <View style={styles.footer}>
          <View style={styles.cantidadContainer}>
            <Text style={styles.cantidadLabel}>Cantidad</Text>
            <Text style={styles.cantidad}>{producto.cantidad || 0}</Text>
          </View>

          <View style={styles.cantidadContainer}>
            <Text style={styles.cantidadLabel}>Cajas</Text>
            <Text style={styles.cantidad}>
              {cajasEsArray
                ? producto.cajas.filter((caja) => caja.cantidad > 0).length
                : producto.cajas || 0}
            </Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onHistorialPress(producto)}
            >
              <FontAwesome name="cube" size={20} color="#e67e22" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onPisoPress(producto)}
            >
              <FontAwesome6 name="truck-ramp-box" size={20} color="#023E8A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#023E8A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  codigo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#023E8A",
  },
  rack: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  nombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cantidadContainer: {
    alignItems: "center",
  },
  cantidadLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  cantidad: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
});

export default CardProducto;
