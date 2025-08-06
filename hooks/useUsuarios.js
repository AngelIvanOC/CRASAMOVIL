import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase";

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tabla = "usuarios";

  // Obtener todos los usuarios
  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from(tabla)
        .select(
          `
          id,
          nombres,
          telefono,
          correo,
          direccion,
          estado,
          fecharegistro,
          roles:id_rol(id, nombre)
        `
        )
        .order("fecharegistro", { ascending: false });

      if (error) throw error;

      setUsuarios(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener usuario actual (por id_auth)
  const fetchUsuarioActual = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUsuarioActual(null);
        return;
      }

      const { data, error } = await supabase
        .from(tabla)
        .select(`*, roles:id_rol(id, nombre)`)
        .eq("id_auth", session.user.id)
        .maybeSingle();

      if (error) throw error;

      setUsuarioActual(data);
    } catch (err) {
      setError(err.message);
      setUsuarioActual(null);
    }
  };

  // Crear usuario completo (auth + perfil)
  const crearUsuarioCompleto = async (usuario) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuario.correo,
        password: usuario.password,
        options: {
          data: {
            display_name: usuario.nombres,
            created_by_admin: true,
          },
        },
      });

      if (authError) throw authError;

      const usuarioData = {
        ...usuario,
        id_auth: authData.user.id,
        fecharegistro: new Date().toISOString().split("T")[0],
        estado: usuario.estado || "ACTIVO",
      };
      delete usuarioData.password;

      const { error } = await supabase.from(tabla).insert(usuarioData);

      if (error) throw error;

      await fetchUsuarios();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Editar usuario
  const editarUsuario = async (usuario) => {
    try {
      const { error } = await supabase
        .from(tabla)
        .update(usuario)
        .eq("id", usuario.id);

      if (error) throw error;

      await fetchUsuarios();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id) => {
    try {
      const { error } = await supabase.from(tabla).delete().eq("id", id);
      if (error) throw error;

      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  // En useUsuarios, agrega este useEffect:
  useEffect(() => {
    // Escuchar cambios en la sesión de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Cuando hay sesión, buscar el usuario en la tabla
        const { data, error } = await supabase
          .from(tabla)
          .select(`*, roles:id_rol(id, nombre)`)
          .eq("id_auth", session.user.id)
          .maybeSingle();

        if (!error && data) {
          setUsuarioActual(data);
        }
      } else {
        // No hay sesión, limpiar usuario
        setUsuarioActual(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchUsuarios();
    fetchUsuarioActual();
  }, []);

  return {
    usuarios,
    usuarioActual,
    loading,
    error,
    fetchUsuarios,
    fetchUsuarioActual,
    crearUsuarioCompleto,
    editarUsuario,
    eliminarUsuario,
  };
};
