"use client";

import React from "react";
import Link from "next/link";
import { Wrench, ArrowRight } from "lucide-react";

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-orange-600/20">
        <Wrench className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-7xl font-black italic tracking-tighter mb-4 uppercase">
        Servicios <span className="text-orange-600">Digitales MX</span>
      </h1>

      <p className="text-gray-400 text-xl max-w-2xl mb-10">
        La plataforma de gestión para talleres de micro-electrónica más avanzada de México.
      </p>

      <Link
        href="/login"
        className="bg-white text-black px-12 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-orange-600 hover:text-white transition-all"
      >
        INICIAR AHORA <ArrowRight />
      </Link>
    </div>
  );
}
