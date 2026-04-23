import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { formatDisplayDate } from '../utils/accreditationReportHelpers';

const formatCellValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return String(value);
};

const getFilenameFromHeaders = (headers = {}, fallback = 'report-export') => {
  const disposition = headers['content-disposition'] || headers['Content-Disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const triggerBlobDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const AccreditationReportPreviewPage = () => {
  const { reportType } = useParams();
  const [searchParams] = useSearchParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState('');
  const [message, setMessage] = useState('');

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setMessage('');

      try {
        const response = await api.get(`/reports/accreditation/${reportType}/preview`, {
          params: Object.fromEntries(searchParams.entries())
        });
        setReport(response.data.data.report);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load accreditation report preview.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportType, queryString]);

  const exportReport = async (format) => {
    setExportingFormat(format);
    setMessage('');

    try {
      const response = await api.get(`/reports/accreditation/${reportType}/export`, {
        params: {
          ...Object.fromEntries(searchParams.entries()),
          format
        },
        responseType: format === 'json' ? 'blob' : 'blob'
      });

      const filename = getFilenameFromHeaders(response.headers, `${reportType}.${format}`);
      triggerBlobDownload(response.data, filename);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to export accreditation report.');
    } finally {
      setExportingFormat('');
    }
  };

  if (loading) {
    return <Loading text="Loading accreditation report preview..." />;
  }

  if (!report) {
    return <div className="error-box">{message || 'Report preview is unavailable.'}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{report.title}</h1>
        <p className="muted">{report.description}</p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/accreditation/reports">
          Back to Reports
        </Link>
        <button className="btn" type="button" onClick={() => exportReport('pdf')} disabled={Boolean(exportingFormat)}>
          {exportingFormat === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => exportReport('json')} disabled={Boolean(exportingFormat)}>
          {exportingFormat === 'json' ? 'Exporting JSON...' : 'Export JSON'}
        </button>
        <button className="btn btn-secondary" type="button" onClick={() => exportReport('csv')} disabled={Boolean(exportingFormat)}>
          {exportingFormat === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
        </button>
      </div>

      <div className="info-strip">
        <strong>Generated:</strong> {formatDisplayDate(report.generatedAt)}
      </div>

      <div className="grid grid-4">
        {(report.summaryCards || []).map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="stack-lg">
        {(report.sections || []).map((section) => (
          <div className="card" key={section.key || section.title}>
            <div className="section-heading">
              <div>
                <h3>{section.title}</h3>
                {section.description ? <p className="muted">{section.description}</p> : null}
              </div>
            </div>

            {section.type === 'text' ? <p className="muted">{section.body || 'No narrative provided.'}</p> : null}

            {section.type === 'list' ? (
              <table className="table">
                <tbody>
                  {(section.items || []).map((item) => (
                    <tr key={`${section.key}-${item.label}`}>
                      <th>{item.label}</th>
                      <td>{formatCellValue(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}

            {section.type === 'table' ? (
              section.rows?.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        {(section.columns || []).map((column) => (
                          <th key={`${section.key}-${column.key}`}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(section.rows || []).map((row, index) => (
                        <tr key={`${section.key}-${index}`}>
                          {(section.columns || []).map((column) => (
                            <td key={`${section.key}-${index}-${column.key}`}>{formatCellValue(row[column.key])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">No rows were available for this section.</p>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccreditationReportPreviewPage;
