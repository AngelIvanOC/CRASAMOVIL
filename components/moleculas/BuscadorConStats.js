import React from "react";
import { View, Text, StyleSheet } from "react-native";
import InputSearch from "../atomos/InputSearch";

const BuscadorConStats = ({ searchTerm, onChange, total }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <InputSearch
          value={searchTerm}
          onChangeText={onChange}
          placeholder="Buscar por nombre o código..."
        />
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {total} encontrado
          {total !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "white",
    paddingBottom: 16,
    marginBottom: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

export default BuscadorConStats;
