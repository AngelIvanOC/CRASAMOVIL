import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useProductos } from "../hooks/useProductos";
import { useNavigation } from "@react-navigation/native";
import CardPendiente from "../components/atomos/CardPendiente";
import { MaterialIcons } from "@expo/vector-icons";

const PendientesScreen = () => {
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { obtenerPendientes, confirmarPendiente } = useProductos();
  const navigation = useNavigation();

  const loadPendientes = async () => {
    try {
      setRefreshing(true);
      const data = await obtenerPendientes();
      setPendientes(data);
    } catch (error) {
      console.error("Error cargando pendientes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadPendientes);
    return unsubscribe;
  }, [navigation]);

  const handlePendientePress = (pendiente) => {
    navigation.navigate("ConfirmarPendienteScreen", { pendiente });
  };

  const renderItem = ({ item }) => (
    <CardPendiente item={item} onPress={handlePendientePress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No hay pendientes por confirmar en este momento
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Pendientes por confirmar</Text>
      <Text style={styles.headerSubtitle}>
        {pendientes.length} {pendientes.length === 1 ? "elemento" : "elementos"}
      </Text>
    </View>
  );

  if (loading && pendientes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#023E8A" />
        <Text style={styles.loadingText}>Cargando pendientes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pendientes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={pendientes.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPendientes}
            colors={["#023E8A"]}
            tintColor="#023E8A"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          pendientes.length === 0 && styles.emptyListContent,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A202C",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default PendientesScreen;
