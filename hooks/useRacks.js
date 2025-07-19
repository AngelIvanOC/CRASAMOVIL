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
      .eq("ocupado", false);

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
