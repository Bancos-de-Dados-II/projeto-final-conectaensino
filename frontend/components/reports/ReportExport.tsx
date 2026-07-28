import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Sheet,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import type { DashboardData } from "../../types/dashboard";

interface ReportExportProps {
  data: DashboardData;
}

function ReportExport({ data }: ReportExportProps) {
  const [open, setOpen] = useState(false);

  const reportRows = [
    ["Alunos cadastrados", data.stats.students],
    ["Monitores ativos", data.stats.monitors],
    ["Sessões", data.stats.sessions],
    ["Certificados", data.stats.certificates],
    ["Média das avaliações", data.stats.averageRating.toFixed(1)],
  ];

  function exportCsv() {
    const rows = [
      ["Indicador", "Valor"],
      ...reportRows,
      [],
      ["Mês", "Sessões"],
      ...data.sessionsByMonth.map((item) => [item.label, item.value]),
    ];

    const content = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob(["\ufeff", content], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "relatorio-conecta-ensino.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportExcel() {
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Indicador", "Valor"],
      ...reportRows,
    ]);
    const sessionsSheet = XLSX.utils.aoa_to_sheet([
      ["Mês", "Sessões"],
      ...data.sessionsByMonth.map((item) => [item.label, item.value]),
    ]);
    const subjectsSheet = XLSX.utils.aoa_to_sheet([
      ["Disciplina", "Total"],
      ...data.subjectsRanking.map((item) => [item.label, item.value]),
    ]);

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, "Sessões");
    XLSX.utils.book_append_sheet(workbook, subjectsSheet, "Disciplinas");
    XLSX.writeFile(workbook, "relatorio-conecta-ensino.xlsx");
    setOpen(false);
  }

  function exportPdf() {
    const document = new jsPDF();

    document.setFontSize(17);
    document.text("Relatório — Conecta Ensino", 14, 18);
    document.setFontSize(9);
    document.text(
      `Gerado em ${new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date())}`,
      14,
      25,
    );

    autoTable(document, {
      startY: 33,
      head: [["Indicador", "Valor"]],
      body: reportRows,
    });

    autoTable(document, {
      startY: document.lastAutoTable.finalY + 12,
      head: [["Mês", "Sessões"]],
      body: data.sessionsByMonth.map((item) => [item.label, item.value]),
    });

    document.save("relatorio-conecta-ensino.pdf");
    setOpen(false);
  }

  return (
    <div className="report-export">
      <button
        className="secondary-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Download size={17} />
        Exportar relatório
      </button>

      {open && (
        <div className="report-export__menu">
          <button type="button" onClick={exportPdf}>
            <FileText size={18} />
            <span>
              <strong>PDF</strong>
              <small>Relatório para impressão</small>
            </span>
          </button>

          <button type="button" onClick={exportExcel}>
            <FileSpreadsheet size={18} />
            <span>
              <strong>Excel</strong>
              <small>Planilha com abas</small>
            </span>
          </button>

          <button type="button" onClick={exportCsv}>
            <Sheet size={18} />
            <span>
              <strong>CSV</strong>
              <small>Dados separados por ponto e vírgula</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ReportExport;
