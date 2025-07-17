import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const CardProducto = ({ producto, onPress }) => {
  const cajasEsArray = Array.isArray(producto.cajas);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(producto)}>
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
        </View>
      </View>
    </TouchableOpacity>
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
    gap: 25,
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
  cajasContainer: {
    alignItems: "center",
  },
  cajasLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  cajas: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e67e22",
  },
});

export default CardProducto;
