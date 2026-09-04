import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../utils/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const completeLogin = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error procesando el login:", error);
        navigate("/?authError=true", { replace: true });
        return;
      }

      if (data.session) {
        navigate("/", { replace: true });
      }
    };

    completeLogin();
  }, [navigate]);

  return <p>Iniciando sesión...</p>;
}
