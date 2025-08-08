import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import CardPiso from "../atomos/CardPiso";
import { FontAwesome6 } from "@expo/vector-icons";
import CustomAlert from "../atomos/Alertas/CustomAlert";

const PisoTemplate = ({
  historial,
  loading,
  producto,
  navegation,
  onBajarCaja,
  getSugerenciaRack,
}) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES");
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

  const handleBajarCajaWithSuggestion = async () => {
    try {
      const sugerencia = await getSugerenciaRack(producto.id);

      if (!sugerencia || !sugerencia.cantidad || sugerencia.cantidad === 0) {
        showAlert({
          title: "Sin inventario",
          message:
            "No existen cajas en rack ni suelto, registra para poder continuar",
          buttons: [
            {
              text: "OK",
              onPress: () => setAlertVisible(false),
            },
          ],
        });
        return;
      }

      let mensajeUbicacion = "";
      if (sugerencia.origen === "rack" && sugerencia.racks) {
        mensajeUbicacion = `\n\n🎯 Tomar de rack: ${sugerencia.racks.codigo_rack}`;
      } else if (sugerencia.origen === "suelto") {
        mensajeUbicacion = `\n\n📦 Tomar de suelto`;
      }

      if (sugerencia.fecha_caducidad) {
        mensajeUbicacion += `\n📅 Caduca: ${formatDate(
          sugerencia.fecha_caducidad
        )}`;
      }
      if (sugerencia.cantidad) {
        mensajeUbicacion += `\n📦 Cantidad disponible: ${sugerencia.cantidad}`;
      }

      showAlert({
        title: `Bajar ${producto.nombre} al Piso`,
        message: `¿Deseas proceder a bajar este producto al piso?${mensajeUbicacion}`,
        buttons: [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setAlertVisible(false),
          },
          {
            text: "Continuar",
            onPress: () => {
              setAlertVisible(false);
              onBajarCaja();
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error obteniendo sugerencia:", error);
      showAlert({
        title: `Bajar ${producto.nombre} al Piso`,
        message: "¿Deseas proceder a bajar este producto al piso?",
        buttons: [
          {
            text: "Cancelar",
            style: "cancel",
            onPress: () => setAlertVisible(false),
          },
          {
            text: "Continuar",
            onPress: () => {
              setAlertVisible(false);
              onBajarCaja();
            },
          },
        ],
      });
    }
  };

  const renderItem = ({ item }) => <CardPiso item={item} />;

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No hay productos en piso para este producto
      </Text>
    </View>
  );

  const renderHeaderComponent = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <View style={styles.headerText}>
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.subtitle}>
            {historial.length} entrada{historial.length !== 1 ? "s" : ""} en
            piso
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bajarButton}
        onPress={handleBajarCajaWithSuggestion}
      >
        <FontAwesome6 name="box-archive" size={20} color="#023E8A" />
        <Text style={styles.bajarButtonText}>Bajar a Piso</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#023E8A" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={historial}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={renderEmptyComponent}
          ListHeaderComponent={renderHeaderComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

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
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    lineHeight: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  bajarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bajarButtonText: {
    fontSize: 12,
    color: "#023E8A",
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default PisoTemplate;
