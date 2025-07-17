import React from "react";
import { View, Text, StyleSheet } from "react-native";

const HistorialEntradaCard = ({ item, mostrarNombreProducto = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (fechaCaducidad) => {
    const today = new Date();
    const caducidad = new Date(fechaCaducidad);
    const diffTime = caducidad - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "#FF4444"; // rojo
    if (diffDays <= 7) return "#FF8C00"; // naranja
    if (diffDays <= 30) return "#FFD700"; // amarillo
    return "#4CAF50"; // verde
  };

  const getStatusText = (fechaCaducidad) => {
    const today = new Date();
    const caducidad = new Date(fechaCaducidad);
    const diffTime = caducidad - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vencido";
    if (diffDays <= 7) return "Próximo a vencer";
    if (diffDays <= 30) return "Precaución";
    return "Vigente";
  };

  const statusColor = getStatusColor(item.fecha_caducidad);
  const statusText = getStatusText(item.fecha_caducidad);

  return (
    <View style={styles.card}>
      {mostrarNombreProducto && (
        <Text style={styles.productName}>
          {item.productos?.nombre || "Producto sin nombre"}
        </Text>
      )}
      <Text style={styles.label}>
        Fecha caducidad:{" "}
        <Text style={styles.value}>{formatDate(item.fecha_caducidad)}</Text>
      </Text>
      <Text style={styles.label}>
        Cantidad: <Text style={styles.value}>{item.cantidad}</Text>
      </Text>
      <Text style={styles.label}>
        Rack:{" "}
        <Text style={styles.value}>{item.racks?.codigo_rack || "N/A"}</Text>
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    color: "#4A5568",
    marginBottom: 4,
  },
  value: {
    fontWeight: "600",
    color: "#2D3748",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  productName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 6,
  },
});

export default HistorialEntradaCard;
