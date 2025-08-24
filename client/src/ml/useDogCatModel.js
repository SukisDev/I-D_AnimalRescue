// client/src/ml/useDogCatModel.js
import { useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

// Misma API que ya usabas en el formulario
export default function useDogCatModel(load = true) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const modelRef = useRef(null);

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    (async () => {
      try {
        // Variante liviana suficiente para detectar 'cat' y 'dog'
        const m = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        if (cancelled) return;
        modelRef.current = m;
        setReady(true);
      } catch (e) {
        console.error("No se pudo cargar coco-ssd", e);
        setError("No se pudo cargar el modelo de IA");
      }
    })();
    return () => { cancelled = true; };
  }, [load]);

  const classifyImageElement = async (imgEl) => {
    if (!modelRef.current) return null;
    const preds = await modelRef.current.detect(imgEl, 10);
    const filtered = preds
      .filter(p => p.class === "cat" || p.class === "dog")
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (!filtered.length) return null;
    const top = filtered[0];
    return { label: top.class === "cat" ? "Gato" : "Perro", confidence: top.score ?? 0 };
  };

  const classifyFile = async (file) => {
    if (!file) return null;
    const img = await fileToImage(file);
    return classifyImageElement(img);
  };

  return { ready, error, classifyFile, classifyImageElement };
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
