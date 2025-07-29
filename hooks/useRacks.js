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

    // Ordenar por posición numéricamente ya que está guardado como text
    const racksOrdenados = data?.sort((a, b) => {
      // Primero por nivel
      if (a.nivel !== b.nivel) {
        return a.nivel.localeCompare(b.nivel);
      }
      // Luego por lado
      if (a.lado !== b.lado) {
        return parseInt(a.lado) - parseInt(b.lado);
      }
      // Finalmente por posición (convertir a número)
      return parseInt(a.posicion) - parseInt(b.posicion);
    });

    return racksOrdenados || [];
  };

  return {
    obtenerRacksDisponiblesPorMarca,
    loading,
    racks,
  };
};
