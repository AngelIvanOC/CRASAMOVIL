import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

const CardDetalleProducto = ({ detalle, onPress }) => {
  const isCompleted = detalle.estado?.toLowerCase() === "completado";

  const getStatusColor = (detalle) => {
    // Lógica para determinar el color del estado basado en el campo 'estado'
    const estado = detalle.estado?.toLowerCase() || "incompleto";

    switch (estado) {
      case "completado":
        return "#28a745"; // Verde - completado
      case "en_progreso":
        return "#ffc107"; // Amarillo - procesando
      case "incompleto":
      default:
        return "#dc3545"; // Rojo - incompleto
    }
  };

  const getStatusText = (detalle) => {
    const estado = detalle.estado?.toLowerCase() || "incompleto";

    switch (estado) {
      case "completado":
        return "Completado";
      case "pendiente":
        return "Pendiente";
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
    <TouchableOpacity
      style={[styles.card, isCompleted && styles.completedCard]}
      onPress={() => {
        if (isCompleted) {
          // Mostrar alerta si está completado
          Alert.alert("Producto completado", "Este producto ya está surtido.", [
            { text: "OK", style: "default" },
          ]);
          return;
        }
        onPress(detalle);
      }}
      activeOpacity={isCompleted ? 1 : 0.7}
      disabled={isCompleted}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          {/*<View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(detalle) },
            ]}
          />*/}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={3}>
              {detalle.productos?.nombre || "Producto no disponible"}
            </Text>
            <Text style={styles.productCode}>
              Código: {detalle.productos?.codigo || "N/A"}
            </Text>
            <Text
              style={[styles.statusText, { color: getStatusColor(detalle) }]}
            >
              Estado: {getStatusText(detalle)}
            </Text>
            {detalle.fecha_caducidad && (
              <Text style={styles.expirationDate}>
                Caduca: {formatDate(detalle.fecha_caducidad)}
              </Text>
            )}
            {detalle.ubicacion && (
              <Text style={styles.location}>
                Ubicación: {detalle.ubicacion}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <Text style={styles.quantityValue}>{detalle.cantidad || 0}</Text>
          </View>

          <View style={styles.rackContainer}>
            <Text style={styles.rackLabel}>Surtido</Text>
            <Text style={styles.rackValue}>
              {detalle.escaneado || 0} / {detalle.cantidad}
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
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    padding: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  productCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  expirationDate: {
    fontSize: 12,
    color: "#dc3545",
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: "#666",
  },
  rightSection: {
    alignItems: "center",
    minWidth: 50,
  },
  quantityContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  rackContainer: {
    alignItems: "center",
  },
  rackLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  rackValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#023E8A",
  },
  completedCard: {
    opacity: 0.6,
    backgroundColor: "#f8f9fa",
  },
});

export default CardDetalleProducto;
