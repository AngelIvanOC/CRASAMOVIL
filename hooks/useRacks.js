import { useState } from "react";
import { supabase } from "../supabase/supabase";

export const useRacks = () => {
  const [racks, setRacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const obtenerRacksDisponiblesPorMarca = async () => {
    setLoading(true);

    try {
      const { data: racksPendientes, error: errorPendientes } = await supabase
        .from("pendientes")
        .select("ubicacion");

      if (errorPendientes) {
        console.error("Error al obtener pendientes:", errorPendientes);
        setLoading(false);
        return [];
      }

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

      const ubicacionesPendientes =
        racksPendientes?.map((r) => r.ubicacion) || [];

      console.log("Ubicaciones en pendientes:", ubicacionesPendientes);
      console.log(
        "Todos los racks:",
        todosLosRacks?.map((r) => r.codigo_rack)
      );

      const racksFiltrados =
        todosLosRacks?.filter(
          (rack) => !ubicacionesPendientes.includes(rack.codigo_rack)
        ) || [];

      console.log(
        "Racks después del filtro:",
        racksFiltrados.map((r) => r.codigo_rack)
      );

      const racksOrdenados = racksFiltrados.sort((a, b) => {
        if (a.nivel !== b.nivel) {
          return a.nivel.localeCompare(b.nivel);
        }
        if (a.lado !== b.lado) {
          return parseInt(a.lado) - parseInt(b.lado);
        }
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
