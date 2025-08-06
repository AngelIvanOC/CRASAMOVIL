import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useProductos } from "../../hooks/useProductos";
import CardProducto from "../atomos/CardProducto";
import BuscadorConStats from "../moleculas/BuscadorConStats";
import { FontAwesome } from "@expo/vector-icons";
import CustomAlert from "../atomos/Alertas/CustomAlert";

const ProductosTemplate = ({ route, navigation }) => {
  const { marca } = route.params;
  const { productos, loading, error, searchProductos, fetchProductos } =
    useProductos(marca.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState({
    title: "",
    message: "",
    buttons: [],
  });

  // ✅ Función para manejar agregar producto
  const handleAgregarProducto = () => {
    navigation.navigate("AgregarProducto", { marca });
  };

  const handleEntradaPress = () => {
    const marcaNombre = marca.nombre?.toLowerCase();
    if (marcaNombre === "la costeña") {
      /*showAlert({
        title:
          "¿Tu etiqueta tiene caducidad y el numero del código de barras visible en la etiqueta?",
        message: "",
        buttons: [
          {
            text: "No",
            onPress: () => {
              setAlertVisible(false);
              navigation.navigate("EscanearEntrada", {
                marca: marca,
                onUpdate: () => {
                  fetchProductos(marca.id);
                },
              });
            },
          },
          {
            text: "Sí",
            onPress: () => {
              setAlertVisible(false);
              navigation.navigate("EscanearCostena", {
                marca: marca,
                onUpdate: () => {
                  fetchProductos(marca.id);
                },
              });
            },
          },
        ],
      });*/
      // Comportamiento normal para otras marcas
      navigation.navigate("EscanearEntrada", {
        marca: marca,
        onUpdate: () => {
          fetchProductos(marca.id);
        },
      });
    } else if (marcaNombre === "crasa" || marcaNombre === "CRASA") {
      showAlert({
        title: "¿De que marca es tu producto?",
        message: "",
        buttons: [
          {
            text: "LA COSTEÑA",
            onPress: () => {
              setAlertVisible(false);
              navigation.navigate("EscanearEntrada", {
                marca: marca,
                onUpdate: () => {
                  fetchProductos(marca.id);
                },
              });
            },
          },
          {
            text: "JUMEX",
            onPress: () => {
              setAlertVisible(false);
              navigation.navigate("EscanearCostena", {
                marca: marca,
                onUpdate: () => {
                  fetchProductos(marca.id);
                },
              });
            },
          },
          {
            text: "CON",
            onPress: () => {
              setAlertVisible(false);
              navigation.navigate("EscanearEntrada", {
                marca: marca,
                onUpdate: () => {
                  fetchProductos(marca.id);
                },
              });
            },
          },
        ],
      });
    } else if (marcaNombre === "jumex" || marcaNombre === "JUMEX") {
      navigation.navigate("EscanearCostena", {
        marca: marca,
        onUpdate: () => {
          fetchProductos(marca.id);
        },
      });
    } else {
      // Comportamiento normal para otras marcas
      navigation.navigate("EscanearEntrada", {
        marca: marca,
        onUpdate: () => {
          fetchProductos(marca.id);
        },
      });
    }
  };

  const performSearch = useCallback(
    async (term) => {
      if (term.trim() === "") {
        await fetchProductos(marca.id);
      } else {
        setIsSearching(true);
        await searchProductos(term.trim(), marca.id);
        setIsSearching(false);
      }
    },
    [searchProductos, fetchProductos, marca.id]
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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: marca.nombre,
      headerStyle: {
        backgroundColor: "#023E8A",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
        fontSize: 24,
      },
    });
  }, [marca, navigation]);

  const showAlert = ({ title, message, buttons = [] }) => {
    setAlertProps({ title, message, buttons });
    setAlertVisible(true);

    // Si no tiene botones, cerrar automáticamente después de 4 segundos
    if (buttons.length === 0) {
      setTimeout(() => {
        setAlertVisible(false);
      }, 4000);
    }
  };

  const handleProductoPress = (producto) => {
    navigation.navigate("HistorialEntradas", { producto });
  };

  const handleSueltoPress = (producto) => {
    navigation.navigate("Suelto", { producto });
  };

  const handlePisoPress = (producto) => {
    navigation.navigate("Piso", { producto });
  };

  const renderItem = ({ item }) => (
    <CardProducto
      producto={item}
      onHistorialPress={handleProductoPress}
      onSueltoPress={handleSueltoPress}
      onPisoPress={handlePisoPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchTerm
          ? "No se encontraron productos"
          : "No hay productos para esta marca"}
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
          onPress={() => fetchProductos(marca.id)}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={productos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <BuscadorConStats
            searchTerm={searchTerm}
            onChange={handleInputChange}
            total={productos.length}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => fetchProductos(marca.id)}
        keyboardShouldPersistTaps="handled"
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAgregarProducto}
      >
        <Text style={styles.addButtonText}>
          <FontAwesome name="plus" size={24} />
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton2} onPress={handleEntradaPress}>
        <Text style={styles.addButtonText}>
          <FontAwesome name="barcode" size={24} />
        </Text>
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
  // ... (mismos estilos anteriores de ProductosTemplate)
  // solo quita estilos que moviste a los componentes separados
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

  addButton: {
    position: "absolute",
    bottom: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#023E8A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButton2: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#023E8A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
});

export default ProductosTemplate;
