// Proyecto React con TailwindCSS
// Estructura principal del flujo de compra con simulación de pago
// En producción, los botones "Pagar" deben ser reemplazados por la integración real con MercadoPago/Webpay

import { useState } from 'react';

const ENTRADAS = [
  { tipo: 'Entrada general', precio: 80000 },
  { tipo: 'Entrada general (Socio)', precio: 65000 },
  { tipo: 'Entrada estudiante', precio: 50000 },
  { tipo: 'Entrada estudiante (Socio/Olami)', precio: 25000 },
];

export default function App() {
  const [cantidades, setCantidades] = useState(ENTRADAS.map(() => 0));
  const [formularioPrincipal, setFormularioPrincipal] = useState({ rut: '', email: '', telefono: '' });
  const [formulariosIndividuales, setFormulariosIndividuales] = useState<{ nombre: string; apellido: string; genero: string }[]>([]);
  const [pagoRealizado, setPagoRealizado] = useState(false);
  const totalEntradas = cantidades.reduce((a, b) => a + b, 0);
  const totalPrecio = cantidades.reduce((total, cant, i) => total + cant * ENTRADAS[i].precio, 0);

  const handleCantidadChange = (index, value) => {
    const nuevasCantidades = [...cantidades];
    nuevasCantidades[index] = Number(value);
    setCantidades(nuevasCantidades);
    const total = nuevasCantidades.reduce((a, b) => a + b, 0);
    setFormulariosIndividuales(Array(total).fill({ nombre: '', apellido: '', genero: '' }));
  };

  const handlePago = async () => {
    // Simulación de pago exitoso
    alert('Pago realizado con éxito. Enviando datos a Google Sheets...');
    setPagoRealizado(true);

    const entradasCompradas: { tipo: string; nombre: string; apellido: string; genero: string }[] = [];
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
    };

    await fetch('https://tu-webhook-de-google-apps-script.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    alert('Reserva registrada correctamente. ¡Gracias por tu compra!');
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Compra de Entradas</h1>
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
        <div key={i} className="border p-4 mb-4">
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
          <select className="border p-2 w-full" onChange={(e) => {
            const nuevos = [...formulariosIndividuales];
            nuevos[i] = { ...nuevos[i], genero: e.target.value };
            setFormulariosIndividuales(nuevos);
          }}>
            <option value="">Selecciona género</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      ))}

      <div className="text-right font-bold text-xl mb-4">
        Total: ${totalPrecio.toLocaleString('es-CL')}
      </div>

      {!pagoRealizado && (
        <button onClick={handlePago} className="bg-green-600 text-white py-2 px-4 rounded">
          Simular Pago y Confirmar Compra
        </button>
      )}

      {pagoRealizado && <div className="text-green-600 font-bold mt-4">¡Pago realizado y entradas registradas!</div>}
    </div>
  );
}
