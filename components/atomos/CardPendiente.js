import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const CardPendiente = ({ item, onPress }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
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
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.productCode}>
          #{item.productos?.codigo || "N/A"}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.productos?.nombre || "Producto sin nombre"}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View>
          <Text style={styles.infoLabel}>Código de Barras</Text>
          <Text style={styles.codigo}>{item.codigo_barras}</Text>
        </View>

        <View>
          <Text style={styles.infoLabel}>Ubicación</Text>
          <Text style={styles.locationValue}>{item.ubicacion}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <FontAwesome name="clock-o" size={12} color="#999" />
        <Text style={styles.dateText}>
          {formatDate(item.fecha_creacion)} • {formatTime(item.fecha_creacion)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#ffb700ff",
  },
  cardHeader: {
    marginBottom: 8,
  },
  productCode: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#023E8A",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A202C",
    lineHeight: 18,
  },
  cardBody: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "bold",
  },
  codigo: {
    fontSize: 14,
    fontWeight: 500,
    color: "#111",
  },
  locationValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#023E8A",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#999",
    marginLeft: 6,
  },
});

export default CardPendiente;
