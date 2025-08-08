import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";

const CardSuelto = ({ item, mostrarNombreProducto = false, onSubirSuelto }) => {
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

    if (diffDays < 0) return "#FF4444";
    if (diffDays <= 7) return "#FF8C00";
    if (diffDays <= 30) return "#FFD700";
    return "#4CAF50";
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

      <View style={styles.cardContent}>
        <View style={styles.infoSection}>
          <Text style={styles.label}>
            Fecha caducidad:{" "}
            <Text style={styles.value}>{formatDate(item.fecha_caducidad)}</Text>
          </Text>
          <Text style={styles.label}>
            Cantidad: <Text style={styles.value}>{item.cantidad}</Text>
          </Text>
          <Text style={styles.label}>
            Ubicación: <Text style={styles.value}>Suelto</Text>
          </Text>
          <Text style={styles.label}>
            Codigo de barras:{" "}
            <Text style={styles.value}>{item.codigo_barras}</Text>
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.subirButton}
          onPress={() => onSubirSuelto && onSubirSuelto(item)}
        >
          <FontAwesome6 name="box-archive" size={16} color="#023E8A" />
          <Text style={styles.subirButtonText}>Subir a Rack</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  infoSection: {
    flex: 1,
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
  subirButton: {
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginLeft: 8,
    minWidth: 60,
  },
  subirButtonText: {
    fontSize: 10,
    color: "#023E8A",
    fontWeight: "500",
    marginTop: 2,
    textAlign: "center",
  },
});

export default CardSuelto;
