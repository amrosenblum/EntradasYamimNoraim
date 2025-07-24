import { useState } from 'react';

const ENTRADAS = [
  { tipo: 'Entrada general', precio: 80000 },
  { tipo: 'Entrada general (Socio)', precio: 65000 },
  { tipo: 'Entrada estudiante', precio: 50000 },
  { tipo: 'Entrada estudiante (Socio/Olami)', precio: 25000 },
  { tipo: 'Pagaré después', precio: 0 },
];

export default function App() {
  const [cantidades, setCantidades] = useState(ENTRADAS.map(() => 0));
  const [formularioPrincipal, setFormularioPrincipal] = useState({ rut: '', email: '', telefono: '' });
  const [formulariosIndividuales, setFormulariosIndividuales] = useState<{ nombre: string; apellido: string; genero: string; nusaj: string }[]>([]);
  const [pagoRealizado, setPagoRealizado] = useState(false);
  const [loading, setLoading] = useState(false)
  const totalEntradas = cantidades.reduce((a, b) => a + b, 0);
  const totalPrecio = cantidades.reduce((total, cant, i) => total + cant * ENTRADAS[i].precio, 0);
  const formularioCompleto = formularioPrincipal.rut && formularioPrincipal.email && formularioPrincipal.telefono;
  const formulariosIndividualesCompletos = formulariosIndividuales.every(f => f.nombre && f.apellido && f.genero && f.nusaj);
  const hayEntradasPagadas = cantidades.some((c, i) => ENTRADAS[i].precio > 0 && c > 0);
  const hayEntradas = totalEntradas > 0;

  const handleCantidadChange = (index: number, value: string | number) => {
    const nuevasCantidades = [...cantidades];
    nuevasCantidades[index] = Number(value);
    setCantidades(nuevasCantidades);
    const total = nuevasCantidades.reduce((a, b) => a + b, 0);
    setFormulariosIndividuales(Array(total).fill({ nombre: '', apellido: '', genero: '', nusaj: '' }));
  };

  const handlePagoMercadoPago = async () => {
    try {
      setLoading(true);

      const entradasCompradas: { tipo: string; nombre: string; apellido: string; genero: string; nusaj: string }[] = [];
      let index = 0;
      cantidades.forEach((cantidad, i) => {
        for (let j = 0; j < cantidad; j++) {
          entradasCompradas.push({
            tipo: ENTRADAS[i].tipo,
            ...formulariosIndividuales[index],
          });
          index++;
        }
      });

      const data = {
        ...formularioPrincipal,
        entradas: entradasCompradas,
        total: totalPrecio,
        totalEntradas,
      };

      if (totalPrecio === 0) {
        // Registro sin pago
        await fetch('https://tu-webhook-de-google-apps-script.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      
        alert('Gracias! Ya te registramos!');
        window.location.href = '/gracias'; // Puedes crear una ruta en tu frontend
        return;
      }

      // ENVÍO A GOOGLE SHEETS OPCIONAL (puedes dejarlo en success también)
      await fetch('https://tu-webhook-de-google-apps-script.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Crear preferencia de pago en tu backend (usando el API Route /api/create-preferences)
      const res = await fetch('/api/create-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Compra de ${totalEntradas} entrada(s) - Evento Yamim Noraim`,
          quantity: 1,
          unit_price: totalPrecio,
        }),
      });

      const json = await res.json();
      if (json.init_point) {
        window.location.href = json.init_point; // redirige al pago
      } else {
        alert('Error al iniciar el pago.');
      }
    } catch (error) {
      console.error('Error al pagar:', error);
      alert('Hubo un error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  const handlePagoWebpay = async () => {
    try {
      setLoading(true);

      const entradasCompradas: { tipo: string; nombre: string; apellido: string; genero: string; nusaj: string }[] = [];
      let index = 0;
      cantidades.forEach((cantidad, i) => {
        for (let j = 0; j < cantidad; j++) {
          entradasCompradas.push({
            tipo: ENTRADAS[i].tipo,
            ...formulariosIndividuales[index],
          });
          index++;
        }
      });

      const data = {
        ...formularioPrincipal,
        entradas: entradasCompradas,
        total: totalPrecio,
        totalEntradas,
      };

      if (totalPrecio === 0) {
        await fetch('https://tu-webhook-de-google-apps-script.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        alert('Gracias! Ya te registramos!');
        window.location.href = '/gracias';
        return;
      }

      await fetch('https://tu-webhook-de-google-apps-script.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const res = await fetch('/api/create-webpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buy_order: `orden_${Date.now()}`,
          session_id: `${formularioPrincipal.email}_${Date.now()}`,
          amount: totalPrecio,
          return_url: `${window.location.origin}/gracias`,
        }),
      });

      const json = await res.json();
      if (json.url && json.token) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = json.url;

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = json.token;

        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
      } else {
        alert('Error al iniciar el pago con Webpay.');
      }
    } catch (error) {
      console.error('Error al pagar con Webpay:', error);
      alert('Hubo un error al procesar el pago con Webpay.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Banner superior */}
      <div className="w-full h-40 bg-white flex justify-center items-center overflow-hidden">
        <img
          src="/Banner.jpg"
          alt="Banner Aish"
          className="h-full object-contain"
        />
      </div>

      {/* Contenedor principal con marco blanco */}
      <div className="max-w-3xl mx-auto bg-white bg-opacity-95 p-8 my-10 rounded-xl shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Compra de Entradas</h1>

        {ENTRADAS.map((entrada, i) => (
          <div key={i} className="mb-4">
            <label className="block font-semibold">{entrada.tipo} (${entrada.precio.toLocaleString('es-CL')})</label>
            <input type="number" min="0" value={cantidades[i]} onChange={(e) => handleCantidadChange(i, e.target.value)} className="border p-2 w-24" />
          </div>
        ))}

        <hr className="my-6" />

        <h2 className="text-xl font-bold mb-2">Datos de contacto</h2>
        <input type="text" placeholder="RUT" className="border p-2 w-full mb-2" onChange={(e) => setFormularioPrincipal({ ...formularioPrincipal, rut: e.target.value })} />
        <input type="email" placeholder="Email" className="border p-2 w-full mb-2" onChange={(e) => setFormularioPrincipal({ ...formularioPrincipal, email: e.target.value })} />
        <input type="tel" placeholder="Teléfono" className="border p-2 w-full mb-4" onChange={(e) => setFormularioPrincipal({ ...formularioPrincipal, telefono: e.target.value })} />

        {formulariosIndividuales.map((form, i) => (
          <div key={i} className="border p-4 mb-4 rounded-md bg-gray-50">
            <h3 className="font-semibold mb-2">Entrada #{i + 1}</h3>
            <input type="text" placeholder="Nombre" className="border p-2 w-full mb-2" onChange={(e) => {
              const nuevos = [...formulariosIndividuales];
              nuevos[i] = { ...nuevos[i], nombre: e.target.value };
              setFormulariosIndividuales(nuevos);
            }} />
            <input type="text" placeholder="Apellido" className="border p-2 w-full mb-2" onChange={(e) => {
              const nuevos = [...formulariosIndividuales];
              nuevos[i] = { ...nuevos[i], apellido: e.target.value };
              setFormulariosIndividuales(nuevos);
            }} />
            <select className="border p-2 w-full mb-2" onChange={(e) => {
              const nuevos = [...formulariosIndividuales];
              nuevos[i] = { ...nuevos[i], genero: e.target.value };
              setFormulariosIndividuales(nuevos);
            }}>
              <option value="">Selecciona género</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>

            <select className="border p-2 w-full mb-2" onChange={(e) => {
              const nuevos = [...formulariosIndividuales];
              nuevos[i] = { ...nuevos[i], nusaj: e.target.value };
              setFormulariosIndividuales(nuevos);
            }}>
              <option value="">Selecciona Nusaj</option>
              <option value="Ashkenazi">Ashkenazí</option>
              <option value="Sefaradi">Sefaradí</option>
            </select>
          </div>
        ))}

        <div className="text-right font-bold text-xl mb-4">
          Total: ${totalPrecio.toLocaleString('es-CL')}
        </div>

        {!pagoRealizado && (
          <button
            onClick={handlePagoMercadoPago}
            disabled={loading || !hayEntradas || !formularioCompleto || !formulariosIndividualesCompletos}
            className={`py-2 px-4 rounded w-full text-white ${
              loading || !hayEntradas || !formularioCompleto || !formulariosIndividualesCompletos
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Redirigiendo a pago...' : 'Pagar con Mercado Pago'}
          </button>
        )}

        {!pagoRealizado && (
          <button
            onClick={handlePagoWebpay}
            disabled={loading || !hayEntradas || !formularioCompleto || !formulariosIndividualesCompletos}
            className={`py-2 px-4 rounded w-full text-white mt-2 ${
              loading || !hayEntradas || !formularioCompleto || !formulariosIndividualesCompletos
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Redirigiendo a pago...' : 'Pagar con Webpay'}
          </button>
        )}

        <p className="mt-4 text-sm text-center text-gray-700">
          Si no puedes pagar ahora, contáctanos por WhatsApp al{" "}
          <a
            href="https://wa.me/56953622039"
            className="text-green-700 underline font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            +56 9 5362 2039
          </a>
        </p>

        {pagoRealizado && <div className="text-green-600 font-bold mt-4 text-center">¡Pago realizado y entradas registradas!</div>}
      </div>
    </div>
  );
}
