import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CardProductoEscaneo = ({ detalle }) => {
  const getStatusColor = (detalle) => {
    const estado = detalle.estado?.toLowerCase() || "incompleto";

    switch (estado) {
      case "completado":
        return "#28a745";
      case "procesando":
        return "#ffc107";
      case "incompleto":
      default:
        return "#dc3545";
    }
  };

  const getStatusText = (detalle) => {
    const estado = detalle.estado?.toLowerCase() || "incompleto";

    switch (estado) {
      case "completado":
        return "Completado";
      case "procesando":
        return "Procesando";
      case "incompleto":
      default:
        return "Incompleto";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Producto a Escanear</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(detalle) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(detalle)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>
            {detalle.productos?.nombre || "Producto no disponible"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Código:</Text>
          <Text style={[styles.value, styles.codeValue]}>
            {detalle.productos?.codigo || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Cantidad:</Text>
          <Text style={styles.value}>{detalle.cantidad || 0}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rack:</Text>
          <Text style={styles.value}>
            {detalle.productos?.racks?.codigo || "N/A"}
          </Text>
        </View>

        {detalle.fecha_caducidad && (
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Caducidad:</Text>
            <Text style={[styles.value, styles.expirationValue]}>
              {formatDate(detalle.fecha_caducidad)}
            </Text>
          </View>
        )}

        {detalle.ubicacion && (
          <View style={styles.row}>
            <Text style={styles.label}>Ubicación:</Text>
            <Text style={styles.value}>{detalle.ubicacion}</Text>
          </View>
        )}
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Escanea el código de barras del producto para marcarlo como completado
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  codeValue: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 16,
    color: "#023E8A",
  },
  expirationValue: {
    color: "#dc3545",
  },
  instructionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#023E8A",
  },
  instructionText: {
    fontSize: 14,
    color: "#023E8A",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default CardProductoEscaneo;
