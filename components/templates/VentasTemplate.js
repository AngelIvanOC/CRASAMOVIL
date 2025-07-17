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
import { useVentas } from "../../hooks/useVentas";
import CardVenta from "../atomos/CardVenta";
import BuscadorConStats from "../moleculas/BuscadorConStats";
import FiltrosFecha from "../moleculas/FiltrosFecha";
import { useMemo } from "react";

const VentasTemplate = ({ marcaId = null, navigation, route }) => {
  const {
    ventas,
    loading,
    error,
    searchVentas,
    fetchVentas,
    getVentasByDateRange,
  } = useVentas(marcaId);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("todos");
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(
    async (term) => {
      if (term.trim() === "") {
        if (currentFilter === "todos") {
          await fetchVentas(marcaId);
        } else {
          // Mantener el filtro de fecha actual
          const range = getCurrentDateRange();
          if (range) {
            await getVentasByDateRange(range.start, range.end, marcaId);
          }
        }
      } else {
        setIsSearching(true);
        await searchVentas(term.trim(), marcaId);
        setIsSearching(false);
      }
    },
    [searchVentas, fetchVentas, getVentasByDateRange, marcaId, currentFilter]
  );

  const getCurrentDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (currentFilter) {
      case "hoy":
        return {
          start: today.toISOString(),
          end: new Date(
            today.getTime() + 24 * 60 * 60 * 1000 - 1
          ).toISOString(),
        };
      case "semana":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek.toISOString(),
          end: new Date(
            endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1
          ).toISOString(),
        };
      case "mes":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        return {
          start: startOfMonth.toISOString(),
          end: new Date(
            endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1
          ).toISOString(),
        };
      default:
        return null;
    }
  };

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

  const handleDateRangeSelect = useCallback(
    async (startDate, endDate) => {
      if (startDate && endDate) {
        await getVentasByDateRange(startDate, endDate, marcaId);
      } else {
        await fetchVentas(marcaId);
      }
    },
    [getVentasByDateRange, fetchVentas, marcaId]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleVentaPress = (venta) => {
    navigation.navigate("DetalleVenta", { venta });
  };

  const renderItem = ({ item }) => (
    <CardVenta venta={item} onPress={handleVentaPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchTerm ? "No se encontraron ventas" : "No hay ventas registradas"}
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
        <BuscadorConStats
          searchTerm={searchTerm}
          onChange={handleInputChange}
          total={ventas.length}
          placeholder="Buscar por código o ID..."
        />
        <FiltrosFecha
          onDateRangeSelect={handleDateRangeSelect}
          total={ventas.length}
          selectedFilter={currentFilter}
          setSelectedFilter={setCurrentFilter}
        />
      </View>
    ),
    [
      searchTerm,
      ventas.length,
      currentFilter,
      handleInputChange,
      handleDateRangeSelect,
    ]
  );

  if (loading && !isSearching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>Cargando ventas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchVentas(marcaId)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ventas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => fetchVentas(marcaId)}
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

export default VentasTemplate;
