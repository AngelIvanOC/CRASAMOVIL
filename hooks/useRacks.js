// hooks/useRacks.js
import { useState } from "react";
import { supabase } from "../supabase/supabase";

export const useRacks = () => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Traer racks disponibles para una marca específica
  const obtenerRacksDisponiblesPorMarca = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("racks")
      .select("*")
      .eq("ocupado", false)
      .order("nivel", { ascending: true }) // A < B < C
      .order("posicion", { ascending: true }) // 1 < 2 < ... < 40
      .order("lado", { ascending: true }); // 1 < 2

    setLoading(false);

    if (error) {
      console.error("Error al obtener racks:", error);
      return [];
    }

    return data;
  };

  return {
    obtenerRacksDisponiblesPorMarca,
    loading,
    racks,
  };
};
