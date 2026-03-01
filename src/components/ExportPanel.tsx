import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Download, FileText } from "lucide-react";

interface ExportPanelProps {
  date: string;
}

export function ExportPanel({ date }: ExportPanelProps) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      setError(null);
      
      const savePath = await save({
        filters: [{
          name: 'CSV Files',
          extensions: ['csv']
        }],
        defaultPath: `intelliwork_export_${date}.csv`
      });

      if (savePath) {
        await invoke("export_csv", { date, path: savePath });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = () => {
    try {
      setExportingPdf(true);
      setError(null);
      
      // For PDF, we use the browser's native print functionality 
      // which allows "Save as PDF". We temporarily add a print-only class 
      // to format the output.
      window.print();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="card animate-fade-in" style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h3 style={{ fontSize: "var(--font-size-md)", margin: 0 }}>Export Data</h3>
        <p className="text-secondary" style={{ fontSize: "var(--font-size-sm)", margin: 0 }}>
          Download today's activity log for timesheets.
        </p>
      </div>
      
      <div style={{ display: "flex", gap: "var(--space-3)" }}>
        {error && <span style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", alignSelf: "center" }}>{error}</span>}
        
        <button 
          className="btn btn--secondary" 
          onClick={handleExportCsv}
          disabled={exportingCsv || exportingPdf}
        >
          {exportingCsv ? <><Download size={16} /> Exporting...</> : <><Download size={16} /> Export CSV</>}
        </button>
        
        <button 
          className="btn btn--primary" 
          onClick={handleExportPdf}
          disabled={exportingCsv || exportingPdf}
        >
          {exportingPdf ? <><FileText size={16} /> Preparing...</> : <><FileText size={16} /> Print / PDF</>}
        </button>
      </div>
    </div>
  );
}
