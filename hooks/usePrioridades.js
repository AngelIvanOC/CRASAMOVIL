import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";

export const usePrioridades = () => {
  const [proximosACaducar, setProximosACaducar] = useState([]);
  const [pedidosUrgentes, setPedidosUrgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProximosACaducar = async () => {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 30); 
      const { data, error } = await supabase
        .from("cajas")
        .select(
          `
          id, 
          cantidad, 
          fecha_caducidad, 
          rack_id,
          productos (
            id,
            nombre,
            codigo
          ),
          racks (
            codigo_rack
          )
        `
        )
        .gt("cantidad", 0) 
        .order("fecha_caducidad", { ascending: true })
        .limit(3);

      if (error) throw error;

      setProximosACaducar(data || []);
    } catch (err) {
      console.error("Error fetching próximos a caducar:", err);
      setError(err.message);
    }
  };

  const fetchPedidosUrgentes = async () => {
    try {
      const { data, error } = await supabase
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
        .neq("estado", "completado") 
        .order("fecha", { ascending: false }) 
        .limit(3);

      if (error) throw error;

      setPedidosUrgentes(data || []);
    } catch (err) {
      console.error("Error fetching pedidos urgentes:", err);
      setError(err.message);
    }
  };

  const fetchPrioridades = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([fetchProximosACaducar(), fetchPedidosUrgentes()]);
    } catch (err) {
      console.error("Error fetching prioridades:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrioridades();
  }, []);

  return {
    proximosACaducar,
    pedidosUrgentes,
    loading,
    error,
    fetchPrioridades,
  };
};
