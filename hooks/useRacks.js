// hooks/useRacks.js
import { useState } from "react";
import { supabase } from "../supabase/supabase";

export const useRacks = () => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Traer racks disponibles para una marca específica
  const obtenerRacksDisponiblesPorMarca = async () => {
    setLoading(true);

    try {
      // 1. Obtener todas las ubicaciones que están en pendientes
      const { data: racksPendientes, error: errorPendientes } = await supabase
        .from("pendientes")
        .select("ubicacion");

      if (errorPendientes) {
        console.error("Error al obtener pendientes:", errorPendientes);
        setLoading(false);
        return [];
      }

      // 2. Obtener todos los racks disponibles (ocupado = false)
      const { data: todosLosRacks, error: errorRacks } = await supabase
        .from("racks")
        .select("*")
        .eq("ocupado", false)
        .order("nivel", { ascending: true })
        .order("posicion", { ascending: true })
        .order("lado", { ascending: true });

      if (errorRacks) {
        console.error("Error al obtener racks:", errorRacks);
        setLoading(false);
        return [];
      }

      // 3. Extraer ubicaciones de pendientes
      const ubicacionesPendientes =
        racksPendientes?.map((r) => r.ubicacion) || [];

      console.log("Ubicaciones en pendientes:", ubicacionesPendientes);
      console.log(
        "Todos los racks:",
        todosLosRacks?.map((r) => r.codigo_rack)
      );

      // 4. Filtrar racks que NO están en pendientes (usando JavaScript)
      const racksFiltrados =
        todosLosRacks?.filter(
          (rack) => !ubicacionesPendientes.includes(rack.codigo_rack)
        ) || [];

      console.log(
        "Racks después del filtro:",
        racksFiltrados.map((r) => r.codigo_rack)
      );

      // 5. Ordenar por posición numéricamente
      const racksOrdenados = racksFiltrados.sort((a, b) => {
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

      console.log(
        "Racks finales ordenados:",
        racksOrdenados.map((r) => r.codigo_rack)
      );

      setLoading(false);
      return racksOrdenados;
    } catch (error) {
      console.error("Error general al obtener racks:", error);
      setLoading(false);
      return [];
    }
  };

  return {
    obtenerRacksDisponiblesPorMarca,
    loading,
    racks,
  };
};
