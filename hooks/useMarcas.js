import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase"; // Ajusta la ruta según tu estructura

export const useMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("marcas")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        throw error;
      }

      setMarcas(data || []);
    } catch (error) {
      console.error("Error fetching marcas:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addMarca = async (marca) => {
    try {
      const { data, error } = await supabase
        .from("marcas")
        .insert([marca])
        .select();

      if (error) {
        throw error;
      }

      setMarcas((prev) => [...prev, ...data]);
      return { success: true, data };
    } catch (error) {
      console.error("Error adding marca:", error);
      return { success: false, error: error.message };
    }
  };

  const updateMarca = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from("marcas")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        throw error;
      }

      setMarcas((prev) =>
        prev.map((marca) =>
          marca.id === id ? { ...marca, ...updates } : marca
        )
      );
      return { success: true, data };
    } catch (error) {
      console.error("Error updating marca:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteMarca = async (id) => {
    try {
      const { error } = await supabase.from("marcas").delete().eq("id", id);

      if (error) {
        throw error;
      }

      setMarcas((prev) => prev.filter((marca) => marca.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting marca:", error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  return {
    marcas,
    loading,
    error,
    fetchMarcas,
    addMarca,
    updateMarca,
    deleteMarca,
  };
};
