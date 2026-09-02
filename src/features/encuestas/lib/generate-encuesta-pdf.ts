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
  doc.text("Encuesta de Satisfaccion", pageWidth / 2, cursorY, { align: "center" })
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

  cursorY += 24
  ensureSpace(16)

  const signatureLineWidth = 70
  const signatureX = pageWidth / 2 - signatureLineWidth / 2

  doc.setLineWidth(0.2)
  doc.line(signatureX, cursorY, signatureX + signatureLineWidth, cursorY)
  cursorY += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Firma del Cliente", pageWidth / 2, cursorY, { align: "center" })

  return doc
}

export interface EncuestaListadoFila {
  placa: string
  fecha: string
  asesor?: string
  promedio: string | null
  comentario: string | null
}

export interface EncuestaListadoPdfData {
  empresaLogoBase64: string | null
  filtroAsesor: string | null
  fechaDesde: string | null
  fechaHasta: string | null
  incluirAsesor: boolean
  filas: EncuestaListadoFila[]
}

interface ListadoColumn {
  key: "placa" | "fecha" | "asesor" | "promedio" | "comentario"
  label: string
  width: number
}

export function generateEncuestaListadoPdf(data: EncuestaListadoPdfData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 12
  const bottomMargin = 16
  const contentWidth = pageWidth - marginX * 2
  let cursorY = 15

  if (data.empresaLogoBase64) {
    const format = getImageFormat(data.empresaLogoBase64)

    if (format) {
      const logoWidth = 28
      const logoHeight = 16

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

  doc.setFontSize(15)
  doc.setFont("helvetica", "bold")
  doc.text("Listado de Encuestas de Satisfaccion", marginX, cursorY + 5)
  cursorY += 13

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const filtroLines = [`Asesor: ${data.filtroAsesor ?? "Todos"}`]

  if (data.fechaDesde || data.fechaHasta) {
    filtroLines.push(
      `Rango de fechas: ${data.fechaDesde ?? "Sin inicio"} a ${data.fechaHasta ?? "Sin fin"}`
    )
  }

  filtroLines.push(`Total de registros: ${data.filas.length}`)

  filtroLines.forEach((line) => {
    doc.text(line, marginX, cursorY)
    cursorY += 5
  })

  cursorY += 3

  const columns: ListadoColumn[] = data.incluirAsesor
    ? [
        { key: "placa", label: "Placa", width: 20 },
        { key: "fecha", label: "Fecha", width: 34 },
        { key: "asesor", label: "Asesor", width: 30 },
        { key: "promedio", label: "Prom.", width: 15 },
        {
          key: "comentario",
          label: "Comentario",
          width: contentWidth - 20 - 34 - 30 - 15,
        },
      ]
    : [
        { key: "placa", label: "Placa", width: 22 },
        { key: "fecha", label: "Fecha", width: 36 },
        { key: "promedio", label: "Prom.", width: 16 },
        { key: "comentario", label: "Comentario", width: contentWidth - 22 - 36 - 16 },
      ]

  function getColumnX(index: number) {
    let x = marginX

    for (let i = 0; i < index; i += 1) {
      x += columns[i].width
    }

    return x
  }

  function drawHeaderRow() {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    columns.forEach((column, index) => {
      doc.text(column.label, getColumnX(index), cursorY)
    })
    cursorY += 2
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
    doc.line(marginX, cursorY, marginX + contentWidth, cursorY)
    cursorY += 5
  }

  function ensureSpace(neededHeight: number) {
    if (cursorY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage()
      cursorY = 15
      drawHeaderRow()
    }
  }

  drawHeaderRow()
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)

  // Altura real de linea que usa jsPDF para arreglos de texto multilinea,
  // en vez de un valor fijo estimado (evita que el separador cruce el texto).
  const lineHeightFactor =
    typeof doc.getLineHeightFactor === "function" ? doc.getLineHeightFactor() : 1.15
  const lineHeightMm = (9 / doc.internal.scaleFactor) * lineHeightFactor
  const baselineOffset = lineHeightMm * 0.85
  const rowBottomPadding = 3

  data.filas.forEach((fila) => {
    const promedioNum = fila.promedio !== null ? Number(fila.promedio) : null
    const esBajo = promedioNum !== null && !Number.isNaN(promedioNum) && promedioNum < 3

    const cellLines = columns.map((column) => {
      const rawValue =
        column.key === "placa"
          ? fila.placa
          : column.key === "fecha"
            ? fila.fecha
            : column.key === "asesor"
              ? fila.asesor ?? "-"
              : column.key === "promedio"
                ? fila.promedio ?? "-"
                : fila.comentario?.trim() || "-"

      return doc.splitTextToSize(rawValue, column.width - 2) as string[]
    })

    const rowLines = Math.max(...cellLines.map((lines) => lines.length), 1)
    const rowHeight = rowLines * lineHeightMm + rowBottomPadding

    ensureSpace(rowHeight)

    doc.setTextColor(esBajo ? 200 : 0, 0, 0)

    const baselineY = cursorY + baselineOffset

    columns.forEach((column, index) => {
      doc.text(cellLines[index], getColumnX(index), baselineY)
    })

    cursorY += rowHeight
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(marginX, cursorY - 1, marginX + contentWidth, cursorY - 1)
  })

  doc.setTextColor(0, 0, 0)

  return doc
}
