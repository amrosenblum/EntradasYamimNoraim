export default function ErrorPage() {
  return (
    <div className="max-w-2xl mx-auto text-center mt-20 p-8 bg-white rounded shadow">
      <h1 className="text-3xl font-bold text-red-700 mb-4">
        ¡Oops! Hubo un problema con tu pago
      </h1>
      <p className="text-lg">
        No pudimos procesar tu pago correctamente. Si ya fuiste cobrado, contáctanos por WhatsApp al{' '}
        <a
          href="https://wa.me/56953622039"
          className="text-red-700 underline font-semibold"
          target="_blank"
          rel="noopener noreferrer"
        >
          +56 9 5362 2039
        </a>
        .
      </p>
      <p className="mt-4 text-blue-700">
        <a href="/" className="underline">
          Volver al inicio
        </a>
      </p>
    </div>
  )
}
