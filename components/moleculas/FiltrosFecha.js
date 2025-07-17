import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const FiltrosFecha = ({
  onDateRangeSelect,
  total,
  selectedFilter,
  setSelectedFilter,
}) => {
  const getDateRange = (filterType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "hoy":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "semana":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          start: startOfWeek,
          end: new Date(endOfWeek.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "mes":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );
        return {
          start: startOfMonth,
          end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000 - 1),
        };

      case "año":
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        return {
          start: startOfYear,
          end: new Date(endOfYear.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      default:
        return null;
    }
  };

  const handleFilterPress = (filterType) => {
    setSelectedFilter(filterType);
    const range = getDateRange(filterType);
    if (range) {
      onDateRangeSelect(range.start.toISOString(), range.end.toISOString());
    } else {
      onDateRangeSelect(null, null);
    }
  };

  const filters = [
    { key: "todos", label: "Todos" },
    { key: "hoy", label: "Hoy" },
    { key: "semana", label: "Esta semana" },
    { key: "mes", label: "Este mes" },
    { key: "año", label: "Este año" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress(filter.key)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filtersContainer: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#023E8A",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  totalContainer: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  totalText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});

export default FiltrosFecha;
