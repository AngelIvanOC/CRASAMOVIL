import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const getEstadoStyles = (estado) => {
  switch (estado) {
    case "completado":
      return {
        backgroundColor: "#28a745",
        color: "#fff",
        text: "Completo",
        icon: "✓",
      };
    case "en_progreso":
      return {
        backgroundColor: "#ffc107",
        color: "#000",
        text: "En Progreso",
        icon: "⏳",
      };
    case "incompleto":
    default:
      return {
        backgroundColor: "#dc3545",
        color: "#fff",
        text: "Incompleto",
        icon: "⚠",
      };
  }
};

const CardVenta = ({ venta, onPress, currentUser }) => {
  const estadoStyle = getEstadoStyles(venta.estado);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        {/* Contenido de dos columnas */}
        <View style={styles.infoContainer}>
          {/* Fila superior */}
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.statusMarcaRow}>
                <Text
                  style={styles.boldText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {venta.marcas?.nombre || "N/A"}
                </Text>
              </View>
              <Text
                style={styles.subText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {venta.codigo || `ID: ${venta.id}`}
              </Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.boldText}>Fecha</Text>
              <Text style={styles.subText}>{formatDate(venta.fecha)}</Text>
            </View>
          </View>

          {/* Fila inferior */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.boldText}>Cantidad</Text>
              <Text style={styles.subText}>
                {venta.cantidad_productos || 0}
              </Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.boldText}>Total</Text>
              <Text style={styles.subText}>{venta.cantidad_total || 0}</Text>
            </View>
          </View>

          <View style={styles.row2}>
            <View
              style={[
                styles.estadoBadge,
                { backgroundColor: estadoStyle.backgroundColor },
              ]}
            >
              <Text style={[styles.estadoText, { color: estadoStyle.color }]}>
                {estadoStyle.icon} {estadoStyle.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.enterButton}
            onPress={() => onPress(venta)}
            activeOpacity={0.8}
          >
            <Text style={styles.enterButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    padding: 16,
    elevation: 3,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  statusMarcaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginBottom: 2,
  },
  boldText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 12,
    color: "#666",
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  enterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#023E8A",
    justifyContent: "center",
    alignItems: "center",
  },
  enterButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default CardVenta;
