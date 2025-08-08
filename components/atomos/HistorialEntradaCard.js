import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { supabase } from "../../supabase/supabase";
import CustomAlert from "../atomos/Alertas/CustomAlert"; 

const HistorialEntradaCard = ({
  item,
  mostrarNombreProducto = false,
  onMoverAPiso,
}) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

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

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
  };

  const moverAPiso = async () => {
    try {
      const { data, error } = await supabase.rpc("mover_caja_a_piso", {
        caja_id: item.id,
      });

      if (error) {
        console.error("Error al mover a piso:", error);
        showAlert({
          title: "Error",
          message: "No se pudo mover el producto al piso",
          buttons: [
            {
              text: "OK",
              onPress: () => setAlertVisible(false),
            },
          ],
        });
        return;
      }

      showAlert({
        title: "Éxito",
        message: "Producto movido al piso correctamente",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
      if (onMoverAPiso) {
        onMoverAPiso(item.id);
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert({
        title: "Error",
        message: "Ocurrió un error inesperado",
        buttons: [
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
          },
        ],
      });
    }
  };

  const confirmarMover = () => {
    showAlert({
      title: "Confirmar",
      message: `¿Estás seguro de que quieres mover ${item.cantidad} unidades al piso?`,
      buttons: [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setAlertVisible(false),
        },
        {
          text: "Confirmar",
          onPress: () => {
            setAlertVisible(false);
            moverAPiso();
          },
        },
      ],
    });
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
        Codigo de barras: <Text style={styles.value}>{item.codigo_barras}</Text>
      </Text>
      <Text style={styles.label}>
        Ubicacion:{" "}
        <Text style={styles.value}>{item.racks?.codigo_rack || "N/A"}</Text>
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <TouchableOpacity style={styles.moverButton} onPress={confirmarMover}>
        <Text style={styles.moverText}>Mover a piso</Text>
        <FontAwesome6 name="truck-ramp-box" size={24} color="#023E8A" />
      </TouchableOpacity>

      <CustomAlert
        visible={alertVisible}
        title={alertProps.title}
        message={alertProps.message}
        buttons={alertProps.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
  moverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F7FAFC",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  moverText: {
    fontSize: 13,
    color: "#4A5568",
    fontWeight: "500",
  },
});

export default HistorialEntradaCard;
