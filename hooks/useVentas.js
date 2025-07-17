import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";

export const useVentas = (marcaId = null) => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVentas = async (marcaId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("ventas")
        .select(
          `
          *,
          marcas (
            id,
            nombre
          )
        `
        )
        .order("fecha", { ascending: false });

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVentas(data || []);
    } catch (err) {
      console.error("Error fetching ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchVentas = async (searchTerm, marcaId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("ventas")
        .select(
          `
          *,
          marcas (
            id,
            nombre
          )
        `
        )
        .order("fecha", { ascending: false });

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      // Buscar por código o ID
      if (searchTerm) {
        query = query.or(`codigo.ilike.%${searchTerm}%,id.eq.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVentas(data || []);
    } catch (err) {
      console.error("Error searching ventas:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVentasByDateRange = async (startDate, endDate, marcaId = null) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("ventas")
        .select(
          `
          *,
          marcas (
            id,
            nombre
          )
        `
        )
        .gte("fecha", startDate)
        .lte("fecha", endDate)
        .order("fecha", { ascending: false });

      if (marcaId) {
        query = query.eq("marca_id", marcaId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setVentas(data || []);
    } catch (err) {
      console.error("Error fetching ventas by date range:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVentaEstado = async (ventaId) => {
    try {
      console.log("Actualizando estado de venta:", ventaId);

      // Obtener todos los productos de la venta
      const { data: detalles, error: detalleError } = await supabase
        .from("detalle_ventas")
        .select("estado")
        .eq("venta_id", ventaId);

      if (detalleError) throw detalleError;

      // Calcular el estado basado en los productos
      let nuevoEstado = "incompleto";

      if (detalles && detalles.length > 0) {
        const completados = detalles.filter(
          (d) => d.estado === "completado"
        ).length;
        const total = detalles.length;

        console.log(`Productos completados: ${completados}/${total}`);

        if (completados === total) {
          nuevoEstado = "completado";
        } else if (completados > 0) {
          nuevoEstado = "en_progreso";
        }
      }

      console.log("Nuevo estado calculado:", nuevoEstado);

      // Actualizar el estado de la venta
      const { error: updateError } = await supabase
        .from("ventas")
        .update({ estado: nuevoEstado })
        .eq("id", ventaId);

      if (updateError) throw updateError;

      // Refrescar la lista de ventas
      await fetchVentas(marcaId);

      return nuevoEstado;
    } catch (err) {
      console.error("Error updating venta estado:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchVentas(marcaId);
  }, [marcaId]);

  return {
    ventas,
    loading,
    error,
    fetchVentas,
    searchVentas,
    getVentasByDateRange,
    updateVentaEstado,
  };
};
