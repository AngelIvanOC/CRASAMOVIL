import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import FormularioAgregarProducto from "../organismos/FormularioAgregarProducto";
import { useProductos } from "../../hooks/useProductos";

const AgregarProductoTemplate = ({ route, navigation }) => {
  const { marca } = route.params;
  const { codigoproducto } = route.params;
  const { nombre } = route.params;
  const { agregarProducto } = useProductos(marca.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "Agregar Producto",
      headerStyle: {
        backgroundColor: "#023E8A",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
        fontSize: 20,
      },
    });
  }, [navigation]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      await agregarProducto(formData);

      Alert.alert("Éxito", "Producto agregado correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Error al agregar el producto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancelar", "¿Estás seguro de que deseas cancelar?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Sí",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo Producto</Text>
            <Text style={styles.subtitle}>Marca: {marca.nombre}</Text>
          </View>

          <FormularioAgregarProducto
            marca={marca}
            codigoproducto={codigoproducto}
            nombre={nombre}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#023E8A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});

export default AgregarProductoTemplate;
