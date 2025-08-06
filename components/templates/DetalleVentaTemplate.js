import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useDetalleVentas } from "../../hooks/useDetalleVentas";
import { useProductos } from "../../hooks/useProductos";
import CardDetalleProducto from "../atomos/CardDetalleProducto";
import BuscadorConStats from "../moleculas/BuscadorConStats";
import ResumenVentaHeader from "../organismos/ResumenVentaHeader";
import { useMemo } from "react";

const DetalleVentaTemplate = ({ ventaId, navigation, route }) => {
  const {
    detalles,
    venta,
    loading,
    error,
    searchDetalles,
    fetchDetalleVentas,
    getSugerenciaRack,
    getSugerenciaPiso,
    updateDetalle,
    updateEstadoDetalle,
  } = useDetalleVentas(ventaId);
  const { procesarSalidaCompleta } = useProductos();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(
    async (term) => {
      if (term.trim() === "") {
        await fetchDetalleVentas(ventaId);
      } else {
        setIsSearching(true);
        await searchDetalles(term.trim());
        setIsSearching(false);
      }
    },
    [searchDetalles, fetchDetalleVentas, ventaId]
  );

  const handleInputChange = useCallback(
    (text) => {
      setSearchTerm(text);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 500);
    },
    [performSearch]
  );

  const handleSurtirManual = async (detalle) => {
    try {
      console.log("Intentando surtir detalle:", detalle.id);

      // Usar la función existente que ya maneja todo
      const resultado = await procesarSalidaCompleta(
        detalle.productos.id,
        detalle.cantidad,
        null, // sin código de barras
        detalle.id // pasar el detalleId para actualizar escaneado
      );

      // Determinar el estado basado en lo que se logró surtir
      const cantidadTotal = detalle.cantidad;
      const escaneadoActual =
        (detalle.escaneado || 0) + resultado.cantidadRestada;

      let nuevoEstado;
      if (escaneadoActual >= cantidadTotal) {
        nuevoEstado = "completado";
      } else if (escaneadoActual > 0) {
        nuevoEstado = "en_progreso";
      } else {
        nuevoEstado = "incompleto";
      }

      // Actualizar con el estado correcto
      await updateEstadoDetalle(detalle.id, nuevoEstado);
      await updateDetalle(detalle.id, { estado: nuevoEstado });

      const mensaje =
        escaneadoActual >= cantidadTotal
          ? "Producto surtido correctamente"
          : `Surtido parcial: ${escaneadoActual}/${cantidadTotal}`;

      Alert.alert("Éxito", mensaje);
      fetchDetalleVentas(ventaId);
    } catch (error) {
      console.error("Error completo:", error);
      Alert.alert("Error", `Detalles: ${error.message}`);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDetalleVentas(ventaId);
    }, [ventaId])
  );

  const handleDetallePress = async (detalle) => {
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES");
    };

    const sugerencia = await getSugerenciaPiso(detalle.productos.id);
    let mensajePiso = "";
    if (sugerencia) {
      mensajePiso = `\n\n📦 Tomar producto de:`;
      if (sugerencia.fecha_caducidad) {
        mensajePiso += `\n📅 Caduca: ${formatDate(sugerencia.fecha_caducidad)}`;
      }
      if (sugerencia.cantidad) {
        mensajePiso += `\n📊 Cantidad disponible: ${sugerencia.cantidad}`;
      }
    } else {
      mensajePiso = `\n\n⚠️ No hay cajas en piso, baja de rack para continuar`;
    }

    // Crear el array de botones de forma condicional
    const buttons = [{ text: "Cerrar", style: "cancel" }];

    // Solo agregar el botón si no hay cajas en piso
    if (!sugerencia) {
      buttons.push({
        text: "Ir a piso",
        onPress: () => {
          if (navigation) {
            navigation.navigate("Piso", {
              producto: detalle.productos,
            });
          }
        },
      });
    } else {
      // Mantener el botón original de Escanear cuando sí hay cajas en piso
      buttons.push({
        text: "Surtir",
        onPress: () => {
          handleSurtirManual(detalle);
        },
      });
    }

    Alert.alert(
      detalle.productos?.nombre || "Producto",
      `Código: ${detalle.productos?.codigo || "N/A"}\nCantidad: ${
        detalle.cantidad || 0
      }${
        detalle.ubicacion ? `\nUbicación: ${detalle.ubicacion}` : ""
      }${mensajePiso}`,
      buttons // Usar el array dinámico
    );
  };

  const renderItem = ({ item }) => (
    <CardDetalleProducto detalle={item} onPress={handleDetallePress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchTerm
          ? "No se encontraron productos"
          : "No hay productos en esta venta"}
      </Text>
      {searchTerm && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSearchTerm("");
            performSearch("");
          }}
        >
          <Text style={styles.clearButtonText}>Limpiar búsqueda</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = useMemo(
    () => (
      <View>
        <ResumenVentaHeader venta={venta} totalProductos={detalles.length} />
        <BuscadorConStats
          searchTerm={searchTerm}
          onChange={handleInputChange}
          total={detalles.length}
          placeholder="Buscar productos..."
        />
      </View>
    ),
    [searchTerm, detalles.length, handleInputChange]
  );

  if (loading && !isSearching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchDetalleVentas(ventaId)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={detalles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => fetchDetalleVentas(ventaId)}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  clearButton: {
    backgroundColor: "#023E8A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default DetalleVentaTemplate;
