import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import CardSuelto from "../atomos/CardSuelto";
import CustomAlert from "../atomos/Alertas/CustomAlert";
import { supabase } from "../../supabase/supabase";
import { useRacks } from "../../hooks/useRacks";

const SueltoTemplate = ({
  historial,
  loading,
  producto,
  navigation,
  onSubirSueltoItem,
}) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });
  const { obtenerRacksDisponiblesPorMarca } = useRacks();

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
  };

  const handleSubirSueltoItem = async (sueltoItem) => {
    try {
      const { data: productoInfo, error: productoError } = await supabase
        .from("productos")
        .select("marca_id")
        .eq("id", producto.id)
        .single();

      if (productoError) {
        console.error("Error obteniendo info del producto:", productoError);
        showAlert({
          title: "Error",
          message: "No se pudo obtener información del producto.",
          buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }],
        });
        return;
      }

      const racks = await obtenerRacksDisponiblesPorMarca();

      if (!racks || racks.length === 0) {
        showAlert({
          title: "Sin racks disponibles",
          message: "No hay racks disponibles. Contacta al administrador.",
          buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }],
        });
        return;
      }

      const rackSugerido = racks[0];

      showAlert({
        title: "Confirmar movimiento",
        message: `¿Subir esta caja de ${producto.nombre} al rack ${rackSugerido.codigo_rack}?\n\n📦 Cantidad: ${sueltoItem.cantidad}\n📅 Caduca: ${new Date(sueltoItem.fecha_caducidad).toLocaleDateString("es-ES")}\n🎯 Destino: Rack ${rackSugerido.codigo_rack}`,
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
              onSubirSueltoItem(sueltoItem, rackSugerido);
            },
          },
        ],
      });
    } catch (error) {
      console.error("Error en handleSubirSueltoItem:", error);
      showAlert({
        title: "Error",
        message: "Ocurrió un error inesperado.",
        buttons: [{ text: "OK", onPress: () => setAlertVisible(false) }],
      });
    }
  };

  const renderItem = ({ item }) => (
    <CardSuelto item={item} onSubirSuelto={handleSubirSueltoItem} />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No hay productos en suelto para este producto
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
            suelto
          </Text>
        </View>
      </View>
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
});

export default SueltoTemplate;
