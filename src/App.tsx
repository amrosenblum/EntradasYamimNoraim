import { useState } from 'react'
import { Info, Plus, Minus } from 'lucide-react'


const ENTRADAS = [
  {
    tipo: 'Entrada general',
    precio: 80000,
    info: 'Acceso general a todos los servicios de Yamim Noraim. (Rosh Hashana y Yom Kipur)'
  },
  {
    tipo: 'Entrada general (Socio)',
    precio: 65000,
    info: 'Descuento para socios: acceso general con precio reducido.'
  },
  {
    tipo: 'Entrada estudiante',
    precio: 50000,
    info: 'Descuento estudiante.'
  },
  {
    tipo: 'Entrada estudiante (Socio/Olami)',
    precio: 25000,
    info: 'Precio especial para estudiantes socios, o que participen de Olami.'
  },
  {
    tipo: 'Pagaré después',
    precio: 0,
    info: 'Reserva tus asientos hoy y paga luego.'
  }
]

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
  const [rutError, setRutError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [telefonoError, setTelefonoError] = useState('')

  // --- validation helpers ---
  function validateRUT(rut: string): boolean {
    const clean = rut.replace(/\./g, '').replace(/-/g, '')
    if (!/^\d{7,8}[0-9Kk]$/.test(clean)) return false
    const body = clean.slice(0, -1)
    const dv = clean.slice(-1).toUpperCase()
    let sum = 0,
      mul = 2
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * mul
      mul = mul < 7 ? mul + 1 : 2
    }
    const res = 11 - (sum % 11)
    const computed = res === 11 ? '0' : res === 10 ? 'K' : String(res)
    return computed === dv
  }
  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  function validateTelefono(tel: string): boolean {
    return /^\d{9}$/.test(tel)
  }
  function formatTelefono(tel: string): string {
    // e.g. “912345678” → “9 1234 5678”
    return tel.replace(/(\d)(\d{4})(\d{4})/, '+56 $1 $2 $3')
  }

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

      // 1) Build the list of purchased entries
      const entradasCompradas: {
        tipo: string
        nombre: string
        apellido: string
        genero: string
        nusaj: string
      }[] = [];
      let index = 0;
      cantidades.forEach((cantidad, i) => {
        for (let j = 0; j < cantidad; j++) {
          entradasCompradas.push({
            tipo: ENTRADAS[i].tipo,
            nombre: formulariosIndividuales[index].nombre,
            apellido: formulariosIndividuales[index].apellido,
            genero: formulariosIndividuales[index].genero,
            nusaj: formulariosIndividuales[index].nusaj,
          });
          index++;
        }
      });

      // 2) Call your own backend
      const resp = await fetch('/api/create-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Entradas Yamim Noraim',
          quantity: 1,               // single line item
          unit_price: totalPrecio,   // total CLP amount
          metadata: {
            formularioPrincipal,
            entradas: entradasCompradas,
          },
        }),
      });

      const { init_point, redirectTo } = await resp.json();

      // 3a) If backend told us to skip MP (zero‐price), go straight to gracias
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }

      // 3b) Otherwise redirect to MercadoPago
      window.location.href = init_point;
    } catch (err) {
      console.error('Error al pagar:', err);
      setLoading(false);
    }
  };

  const handlePagoWebpay = async () => {
    try {
      setLoading(true)

      // 1) Build your entradasCompradas & formularioPrincipal just like MP
      const entradasCompradas = [] as any[]
      let index = 0
      cantidades.forEach((cantidad, i) => {
        for (let j = 0; j < cantidad; j++) {
          entradasCompradas.push({
            tipo:   ENTRADAS[i].tipo,
            nombre: formulariosIndividuales[index].nombre,
            apellido: formulariosIndividuales[index].apellido,
            genero: formulariosIndividuales[index].genero,
            nusaj:  formulariosIndividuales[index].nusaj
          })
          index++
        }
      })

      const resp = await fetch('/api/create-webpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      'Entradas Yamim Noraim',
          quantity:    1,
          unit_price: totalPrecio,
          metadata: {
            formularioPrincipal,
            entradas: entradasCompradas
          }
        })
      })
      const { url, token, redirectTo } = await resp.json()

      // 2) Zero‑price?
      if (redirectTo) {
        window.location.href = redirectTo
        return
      }

      // 3) Otherwise start Webpay
      // Transbank expects you to append the token to the URL:
      window.location.href = `${url}?token_ws=${token}`
    } catch (err) {
      console.error('Webpay error:', err)
      setLoading(false)
    }
  }

return (
    <div>
      {/* Banner superior */}
      <div className="w-full h-40 bg-white flex justify-center items-center overflow-hidden">
        <img src="/Banner.jpg" alt="Banner Aish" className="h-full object-contain" />
      </div>

      {/* Contenedor principal */}
      <div className="max-w-3xl mx-auto bg-white p-8 my-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Compra de Entradas</h1>

        {/* 1–3) Entradas list with tooltip & side-by-side input */}
        {ENTRADAS.map((e, i) => (
          <div key={i} className="mb-4 flex items-center justify-between">
            {/* label + info icon */}
            <div className="flex items-center space-x-2">
              <span className="font-normal">
                {e.tipo} (${e.precio.toLocaleString('es-CL')})
              </span>
              <div
                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-400"
                title={e.info}
              >
                <Info size={12} className="text-white" />
              </div>
            </div>

            {/* custom spinner: minus button, value, plus button */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() =>
                  handleCantidadChange(i, String(Math.max(0, cantidades[i] - 1)))
                }
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus size={16} />
              </button>
              <input
                type="text"
                readOnly
                value={cantidades[i]}
                className="w-10 text-center appearance-none bg-transparent border-transparent focus:ring-0"
              />
              <button
                type="button"
                onClick={() =>
                  handleCantidadChange(i, String(cantidades[i] + 1))
                }
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}

        <hr className="my-6" />

        <h2 className="text-xl font-bold mb-2">Datos de contacto</h2>

        {/* 4) RUT field */}
        <input
          type="text"
          placeholder="RUT (ej: 12345678-5)"
          className={`border p-2 w-full mb-2 ${rutError ? 'border-red-500' : ''}`}
          value={formularioPrincipal.rut}
          onChange={(e) => {
            setFormularioPrincipal({ ...formularioPrincipal, rut: e.target.value })
            setRutError('')
          }}
          onBlur={(e) => {
            if (!validateRUT(e.target.value)) {
              setRutError('RUT inválido')
            }
          }}
        />
        {rutError && <p className="text-red-600 mb-2">{rutError}</p>}

        {/* 5) Email field */}
        <input
          type="email"
          placeholder="Email"
          className={`border p-2 w-full mb-2 ${emailError ? 'border-red-500' : ''}`}
          value={formularioPrincipal.email}
          onChange={(e) => {
            setFormularioPrincipal({ ...formularioPrincipal, email: e.target.value })
            setEmailError('')
          }}
          onBlur={(e) => {
            if (!validateEmail(e.target.value)) {
              setEmailError('Email inválido')
            }
          }}
        />
        {emailError && <p className="text-red-600 mb-2">{emailError}</p>}

        {/* 6) Teléfono field */}
        <input
          type="tel"
          placeholder="Teléfono (9 dígitos)"
          maxLength={9}
          className={`border p-2 w-full mb-4 ${telefonoError ? 'border-red-500' : ''}`}
          value={formularioPrincipal.telefono}
          onChange={(e) => {
            // allow only digits
            const digits = e.target.value.replace(/\D/g, '')
            setFormularioPrincipal({ ...formularioPrincipal, telefono: digits })
            setTelefonoError('')
          }}
          onBlur={(e) => {
            if (!validateTelefono(e.target.value)) {
              setTelefonoError('Debe tener 9 dígitos')
            } else {
              // optional: format to +56 9 xxxx xxxx
              setFormularioPrincipal({
                ...formularioPrincipal,
                telefono: formatTelefono(e.target.value)
              })
            }
          }}
        />
        {telefonoError && <p className="text-red-600 mb-4">{telefonoError}</p>}

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
        {/* 
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
      */}
      
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
