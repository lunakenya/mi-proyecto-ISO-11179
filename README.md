# 🧠 Generador de Casos ISO/IEC 11179 + Auditoría con IA

Aplicación web construida con **React + Vite** que genera casos de estudio, auditorías técnicas y comparaciones entre análisis humano y análisis generado por IA, todo basado en la norma **ISO/IEC 11179**.

## 🚀 Funcionalidades

- Generación automática de casos de estudio con IA (Google Gemini)
- Subida y lectura de archivos PDF
- Análisis técnico del caso usando IA
- Comparación entre análisis humano e IA (con notas y coincidencias)
- Exportación de informe en PDF

## 🧰 Tecnologías utilizadas

- React + Vite
- JavaScript
- Gemini API (Google AI)
- `marked` (Markdown to HTML)
- `diff` (comparación de textos)
- `jspdf` (descarga en PDF)

## 📦 Instalación

```
git clone https://github.com/tu-usuario/tu-repo.git
```
```
cd tu-repo
```
```
npm install
```
```
npm run dev
```
## 📁 Estructura del proyecto

/src
  ├── App.jsx
  ├── gemini.js
  ├── utils/
  │   └── pdfReader.js
  ├── App.css
.gitignore
README.md
vite.config.js

## 🔐 Notas

Recuerda NO exponer tu API Key de Gemini en producción.

Usa variables de entorno y configura un proxy/backend si es necesario.