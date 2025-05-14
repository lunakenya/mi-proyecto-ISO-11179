import { useState, useRef } from 'react';
import { marked } from 'marked';
import { diffWords } from 'diff';
import { jsPDF } from 'jspdf';
import { llamarGemini } from './gemini';
import { leerPDF } from './utils/pdfReader';
import './App.css';

function App() {
  const [casoIA, setCasoIA] = useState('');
  const [analisisHumano, setAnalisisHumano] = useState('');
  const [auditoriaIA, setAuditoriaIA] = useState('');
  const [comparacionFinal, setComparacionFinal] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarCompararAbajo, setMostrarCompararAbajo] = useState(false);
  const resultadoRef = useRef();

  const generarCaso = async () => {
    setLoading(true);
    const prompt = `Genera un caso de estudio educativo sobre *Gestión de Metadatos y Datos Maestros* siguiendo esta estructura en formato Markdown:

**Título del caso:** Nombre del caso creado por la IA

1. **Introducción:** Explica brevemente la importancia del tema.
2. **Objetivo:** Qué busca lograr la empresa.
3. **Contexto:** Describe el entorno o situación del caso (empresa, problema, entorno).
4. **Herramientas y Tecnologías Usadas:** Menciona tecnologías utilizadas.
5. **Implementación según ISO/IEC 11179:** Explica cómo se aplicó la norma ISO/IEC 11179.

Hazlo en máximo 4 párrafos. Sé claro, preciso y educativo.`;
    const respuesta = await llamarGemini(prompt);
    setCasoIA(respuesta);
    setLoading(false);
  };

  const subirPDF = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Por favor sube un archivo PDF válido.');
      return;
    }
    try {
      const text = await leerPDF(file);
      setCasoIA(text);
    } catch (err) {
      alert('❌ Error al procesar el PDF: ' + err.message);
    }
  };

  const guardarAnalisis = () => {
    if (!analisisHumano.trim()) {
      alert('⚠️ Por favor ingresa tu análisis primero.');
      return;
    }
    alert('✅ Análisis humano guardado.');
  };

  const generarAuditoria = async () => {
    if (!casoIA) {
      alert('⚠️ Primero debes generar un caso de estudio con IA o subir uno.');
      return;
    }
    const prompt = `Realiza una auditoría técnica breve (máx. 5 párrafos) sobre el siguiente caso de estudio generado por IA relacionado con la Gestión de Metadatos y Datos Maestros bajo la norma ISO/IEC 11179. Evalúa la claridad, estructura, aplicación normativa y propuesta tecnológica. Usa formato Markdown.`;
    const respuesta = await llamarGemini(prompt + "\n\n" + casoIA);
    setAuditoriaIA(respuesta);
    setMostrarCompararAbajo(true);
  };

  const compararResultados = async () => {
    if (!analisisHumano || !casoIA) {
      alert("⚠️ Debes generar un caso de estudio y guardar tu análisis humano antes de comparar.");
      return;
    }

    const prompt = `Compara brevemente (máx. 3 párrafos) este análisis humano con el caso generado por IA, ambos sobre metadatos y datos maestros bajo la norma ISO/IEC 11179. Evalúa claridad, profundidad y cumplimiento. Luego, da una calificación del 0 al 10 a cada uno y explica por qué.`;

    const respuesta = await llamarGemini(prompt + "\n\nAnálisis humano:\n" + analisisHumano + "\n\nCaso IA:\n" + casoIA);
    const comparacionHTML = marked.parse(respuesta);

    const diff = diffWords(analisisHumano, casoIA);
    const total = diff.length;
    const diferencias = diff.filter(part => part.added || part.removed).length;
    const porcentaje = Math.round((1 - diferencias / total) * 100);

    const extraResumen = `
      <br />
      <p><strong>📉 Diferencia:</strong> ${100 - porcentaje}%</p>
      <p><strong>📊 Coincidencia:</strong> ${porcentaje}%</p>
    `;

    setComparacionFinal(`
      <h3>Comparación Final:</h3>
      <div style="text-align: justify;">${comparacionHTML}</div>
      ${extraResumen}
    `);
  };

  const descargarPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 50;
    const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    const limpiarContenido = (texto) => texto
      .replace(/<[^>]*>/g, '')
      .replace(/📉|📊|📥|⚖️|🤖|🎲|📄|💬|📝/g, '') // remover emojis
      .replace(/\n{2,}/g, '\n')
      .trim();

    const agregarSeccion = (titulo, contenido) => {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 30;

      const textoPlano = limpiarContenido(contenido);
      const parrafos = textoPlano.split(/\n+/);

      parrafos.forEach((parrafo) => {
        const texto = parrafo.trim();
        if (!texto) return;

        if (/^(\d+\.\s\*\*.+?\*\*:|\*\*.+?\*\*:|Análisis humano:|Análisis IA:|Justificación breve:|¿Cuál análisis.+|Coincidencia:|Diferencia:):?$/i.test(texto)) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
        } else {
          doc.setFont('times', 'normal');
          doc.setFontSize(11);
        }

        const lineas = doc.splitTextToSize(texto.replace(/\*\*(.*?)\*\*/g, '$1'), usableWidth);
        doc.text(lineas, margin, y, { align: 'justify', maxWidth: usableWidth });
        y += lineas.length * 15 + 8;

        if (y > doc.internal.pageSize.getHeight() - 80) {
          doc.addPage();
          y = margin;
        }
      });

      y += 20;
    };

    if (casoIA) agregarSeccion('Caso de Estudio IA', casoIA);
    if (auditoriaIA) agregarSeccion('Auditoría IA', auditoriaIA);
    if (comparacionFinal) agregarSeccion('Comparación Final', comparacionFinal);

    doc.save('informe_auditoria_IA.pdf');
  };

  return (
    <div className="app-container">
      <h1>📄 Generador de Casos ISO/IEC 11179 + Auditoría con IA</h1>
      <h3>💬 ¿Cómo quieres cargar el caso de estudio?</h3>
      <div>
        <button onClick={generarCaso}>{loading ? 'Generando...' : '🎲 Generar con IA'}</button>
        <label className="custom-file-upload">
          <input type="file" accept="application/pdf" onChange={subirPDF} />
          📄 Subir PDF
        </label>
      </div>

      {casoIA && (
        <div className="resultado">
          <h3><strong>Caso Presentado:</strong></h3>
          <div style={{ textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: marked.parse(casoIA) }} />
        </div>
      )}

      <h3>📝 Tu análisis respecto al caso presentado (tipo auditoría)</h3>
      <textarea
        placeholder="Escribe tu análisis aquí..."
        value={analisisHumano}
        onChange={(e) => setAnalisisHumano(e.target.value)}
      ></textarea>

      <div className="botonera">
        <button onClick={guardarAnalisis}>📥 Enviar Análisis Humano</button>
        <button onClick={generarAuditoria}>🤖 Generar Auditoría con IA</button>
        {!mostrarCompararAbajo && (
          <button onClick={compararResultados}>⚖️ Comparar Resultados</button>
        )}
      </div>

      {auditoriaIA && (
        <div className="resultado">
          <h3><strong>Auditoría IA:</strong></h3>
          <div style={{ textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: marked.parse(auditoriaIA) }} />
          {mostrarCompararAbajo && (
            <div style={{ marginTop: '1rem' }}>
              <button onClick={compararResultados}>⚖️ Comparar Resultados</button>
            </div>
          )}
        </div>
      )}

      {comparacionFinal && (
        <div className="resultado">
          <div dangerouslySetInnerHTML={{ __html: comparacionFinal }} />
        </div>
      )}

      <button onClick={descargarPDF}>📥 Descargar Informe en PDF</button>
    </div>
  );
}

export default App;
