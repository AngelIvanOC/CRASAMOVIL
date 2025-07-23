// EntradaManualSelector.js - Nuevo componente
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from "react-native";

const EntradaManualSelector = ({
  productos,
  marca,
  onProductoSeleccionado,
  onCancel,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const productosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return productos;

    return productos.filter(
      (producto) =>
        producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.codigo?.toString().includes(searchTerm)
    );
  }, [productos, searchTerm]);

  const handleSelectProduct = (producto) => {
    Alert.alert(
      "Confirmar Selección",
      `¿Deseas hacer entrada manual del producto "${producto.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => onProductoSeleccionado(producto),
        },
      ]
    );
  };

  const renderProducto = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleSelectProduct(item)}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nombre}</Text>
        <Text style={styles.productCode}>Código: {item.codigo}</Text>
        <Text style={styles.productStock}>
          Stock actual: {item.cantidad || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entrada Manual - {marca?.nombre}</Text>
        <Text style={styles.subtitle}>Selecciona un producto existente</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <FlatList
        data={productosFiltrados}
        renderItem={renderProducto}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchTerm
                ? "No se encontraron productos que coincidan con la búsqueda"
                : "No hay productos registrados para esta marca"}
            </Text>
          </View>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Volver al Escáner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#023E8A",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#B0C4DE",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  list: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  productStock: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 40,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default EntradaManualSelector;
