import React from "react";
import heroImg from "../assets/hero-bg.jpg";

export default function LandingPage({ onStart, refsObj }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* HERO */}
      <section
        id="inicio"
        ref={refsObj?.inicio}
        className="relative flex items-center justify-center min-h-[72vh] pt-28 pb-16 bg-cover bg-center scroll-mt-[88px]"
        style={{
          backgroundImage: `linear-gradient(rgba(25,118,210,0.45),rgba(25,118,210,0.17)), url(${heroImg})`,
        }}
      >
        <div className="w-full max-w-2xl mx-auto text-center text-white px-5 py-7 bg-black/20 rounded-3xl shadow-lg">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5 drop-shadow">
            Solución Inteligente para Mascotas Vulnerables en Santiago de Veraguas
          </h1>
          <p className="text-lg md:text-xl mb-0 font-medium opacity-90 drop-shadow">
            Plataforma para reportar y ubicar animales en situación vulnerable,
            impulsada por la Jornada de Iniciación Científica.
          </p>
        </div>
      </section>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* ¿Por qué? */}
        <section id="por-que" ref={refsObj?.["por-que"]} className="mb-16 scroll-mt-[88px]">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-5">
            ¿Por qué fue creado este proyecto?
          </h2>
          <p className="text-gray-700 text-justify text-lg leading-relaxed">
            Este proyecto nace de la necesidad de contar con una herramienta tecnológica que facilite el reporte y la
            atención de animales en situación de abandono en Panamá. Aprovechamos la tecnología móvil y la geolocalización
            para promover una respuesta más rápida, colaborativa y eficiente en favor del bienestar animal, apoyando a
            organizaciones y ciudadanía.
          </p>
        </section>

        {/* Objetivos */}
        <section id="objetivos" ref={refsObj?.objetivos} className="mb-16 scroll-mt-[88px]">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6">Objetivos Específicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl p-5 h-full bg-gradient-to-br from-blue-600 to-blue-400 text-white shadow-lg flex flex-col items-start">
              <h5 className="font-bold text-lg mb-2">Plataforma interactiva</h5>
              <p>Elaborar una plataforma web interactiva para ubicar mascotas vulnerables y desamparadas.</p>
            </div>
            <div className="rounded-2xl p-5 h-full bg-gradient-to-br from-yellow-400 to-yellow-300 text-yellow-900 shadow-lg flex flex-col items-start">
              <h5 className="font-bold text-lg mb-2">Colaborar con asociaciones</h5>
              <p>Colaborar con las asociaciones protectoras brindando información precisa.</p>
            </div>
            <div className="rounded-2xl p-5 h-full bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-lg flex flex-col items-start">
              <h5 className="font-bold text-lg mb-2">Apoyo ciudadano</h5>
              <p>Promover el apoyo ciudadano mediante la marcación de ubicaciones.</p>
            </div>
            <div className="rounded-2xl p-5 h-full bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg flex flex-col items-start">
              <h5 className="font-bold text-lg mb-2">Conciencia sobre abandono</h5>
              <p>Crear conciencia sobre el impacto negativo del abandono.</p>
            </div>
          </div>
        </section>

        {/* Equipo */}
        <section id="equipo" ref={refsObj?.equipo} className="mb-16 scroll-mt-[88px]">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-5">¿Quiénes somos?</h2>
          <p className="text-gray-700 text-justify text-lg leading-relaxed">
            Somos estudiantes de la Universidad Tecnológica de Panamá, sede Veraguas, desarrollando esta solución en la
            Jornada de Iniciación Científica (JIC). Combinamos tecnología e innovación social para proteger animales en
            situación de calle, colaborando con la comunidad y asociaciones locales.
          </p>
        </section>

        {/* Contacto */}
        <section id="contacto" ref={refsObj?.contacto} className="mb-16 scroll-mt-[88px]">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-5">Contacto</h2>
          <div className="mb-2">
            <span className="font-semibold">Asesor:</span>
            <span className="block ml-3 text-gray-800">Cristian I Pinzón. cristian.pinzon@utp.ac.pa</span>
          </div>
          <div>
            <span className="font-semibold">Estudiantes:</span>
            <ul className="ml-4 list-disc text-gray-800">
              <li>Jean P Gómez. jean.gomez1@utp.ac.pa</li>
              <li>Cristian J Pinzón. cristian.pinzon2@utp.ac.pa</li>
              <li>Miguel García. miguel.garcia3@utp.ac.pa</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
