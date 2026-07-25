import jsPDF from "jspdf"

export interface EncuestaPdfPregunta {
  texto: string
  calificacion: number
}

export interface EncuestaPdfData {
  empresaLogoBase64: string | null
  clienteNombre: string
  asesorNombre: string
  placa: string
  aseguradora: string
  preguntas: EncuestaPdfPregunta[]
  comentarioGeneral: string | null
}

function getImageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" | null {
  const match = /^data:image\/(png|jpe?g|webp);base64,/i.exec(dataUrl)

  if (!match) {
    return null
  }

  const type = match[1].toLowerCase()

  if (type === "jpg" || type === "jpeg") {
    return "JPEG"
  }

  if (type === "webp") {
    return "WEBP"
  }

  return "PNG"
}

export function generateEncuestaPdf(data: EncuestaPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 15
  const bottomMargin = 20
  const contentWidth = pageWidth - marginX * 2
  let cursorY = 15

  function ensureSpace(neededHeight: number) {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage()
      cursorY = 20
    }
  }

  if (data.empresaLogoBase64) {
    const format = getImageFormat(data.empresaLogoBase64)

    if (format) {
      const logoWidth = 35
      const logoHeight = 20

      try {
        doc.addImage(
          data.empresaLogoBase64,
          format,
          pageWidth - marginX - logoWidth,
          cursorY,
          logoWidth,
          logoHeight,
          undefined,
          "FAST"
        )
      } catch {
        // Logo con formato invalido: se omite y se continua con el PDF.
      }
    }
  }

  cursorY += 28

  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("Encuesta de Satisfaccion", marginX, cursorY)
  cursorY += 10

  doc.setFontSize(11)

  function writeField(label: string, value: string) {
    doc.setFont("helvetica", "bold")
    doc.text(label, marginX, cursorY)
    const labelWidth = doc.getTextWidth(`${label} `)
    doc.setFont("helvetica", "normal")
    doc.text(value || "-", marginX + labelWidth, cursorY)
    cursorY += 7
  }

  writeField("NOMBRE:", data.clienteNombre)
  writeField("NOMBRE DEL ASESOR:", data.asesorNombre)
  writeField("PLACA:", data.placa)
  writeField("ASEGURADORA:", data.aseguradora)

  cursorY += 3
  doc.setLineWidth(0.2)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 8

  data.preguntas.forEach((pregunta, index) => {
    const preguntaLines = doc.splitTextToSize(
      `${index + 1}. ${pregunta.texto}`,
      contentWidth
    ) as string[]

    ensureSpace(preguntaLines.length * 5.5 + 8)

    doc.setFont("helvetica", "normal")
    doc.text(preguntaLines, marginX, cursorY)
    cursorY += preguntaLines.length * 5.5

    doc.setFont("helvetica", "bold")
    doc.text(`Calificacion: ${pregunta.calificacion}`, marginX + 4, cursorY)
    cursorY += 8
  })

  cursorY += 4
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  const tituloComentarios = doc.splitTextToSize(
    "AYUDENOS A MEJORAR, FAVOR DESCRIBA SUS OBSERVACIONES",
    contentWidth
  ) as string[]

  ensureSpace(tituloComentarios.length * 6 + 20)

  doc.text(tituloComentarios, marginX, cursorY)
  cursorY += tituloComentarios.length * 6

  doc.setFont("helvetica", "normal")
  const comentarioLines = doc.splitTextToSize(
    data.comentarioGeneral?.trim() || "-",
    contentWidth
  ) as string[]

  ensureSpace(comentarioLines.length * 5.5)

  doc.text(comentarioLines, marginX, cursorY)
  cursorY += comentarioLines.length * 5.5 + 14

  ensureSpace(8)
  doc.setFont("helvetica", "italic")
  doc.text("Agradecemos el tiempo prestado para esta encuesta", marginX, cursorY)

  return doc
}
