import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import CardMarca from "../atomos/CardMarca";

const CardsCatalogo = ({ marcas, onMarcaPress }) => {
  const renderItem = ({ item }) => (
    <CardMarca marca={item} onPress={onMarcaPress} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={marcas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingVertical: 16,
    justifyContent: "center",
  },
});

export default CardsCatalogo;
