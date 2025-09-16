import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { api } from "../lib/api";


export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token"); // ajuste conforme seu armazenamento

  async function handleDelete() {
    setError(null);

    if (!password) {
      setError("Informe sua senha para confirmar.");
      return;
    }

    setLoading(true);
    try {
    await api.delete("/auth/delete-account", {
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    data: {
      password: password, 
    },
  });
        setLoading(false);
      localStorage.removeItem("token");
      alert("Conta apagada com sucesso.");
      navigate("/login"); // ou "/"
    } catch (e) {
      console.error(e);
      setError("Erro de rede.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded"
        onClick={() => setOpen(true)}
      >
        Apagar minha conta
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="bg-white p-6 rounded shadow-lg w-96 z-50">
            <h3 className="text-lg font-semibold mb-2">Confirmação</h3>
            <p className="mb-4 text-sm text-gray-600">
              Esta ação é IRREVERSIVEL. Todos os seus dados, incluindo arquivos e informações de perfil, serão PERMANENTEMENTE APAGADOS.
              <br />
              <br />
              Digite sua senha para confirmar.
            </p>

            <input
              type="password"
              placeholder="Senha atual"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-3"
            />

            {error && <div className="text-red-600 mb-2">{error}</div>}

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => { setOpen(false); setPassword(""); setError(null); }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600 text-white"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Apagando..." : "Apagar conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}