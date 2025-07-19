import React, { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import PisoTemplate from "../components/templates/PisoTemplate";

const PisoScreen = ({ route }) => {
  const { producto } = route.params;
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    const { data, error } = await supabase
      .from("piso")
      .select(
        `
          id, cantidad, fecha_caducidad, codigo_barras
        `
      )
      .eq("producto_id", producto.id)
      .order("fecha_caducidad", { ascending: true });

    if (!error) setHistorial(data);
    setLoading(false);
  };

  return (
    <PisoTemplate
      historial={historial}
      loading={loading}
      producto={producto}
    />
  );
};

export default PisoScreen;
