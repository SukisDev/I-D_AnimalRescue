function ReportList({ reports }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Reportes Registrados</h3>
      {reports.length === 0 ? (
        <p style={styles.empty}>No hay reportes todavía.</p>
      ) : (
        <ul style={styles.list}>
          {reports.map((report, i) => (
            <li key={i} style={styles.item}>
              <strong>🐾 {report.especie}</strong><br />
              <span>📍 Ubicación: {report.ubicacion.lat.toFixed(5)}, {report.ubicacion.lng.toFixed(5)}</span><br />
              <span>📝 Comentario: {report.comentarios[0]}</span><br />
              <span>📌 Estado: <b>{report.estado}</b></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    marginTop: "2rem",
    boxShadow: "0 0 5px rgba(0,0,0,0.1)",
  },
  title: { fontSize: "1.2rem", marginBottom: "1rem" },
  empty: { fontStyle: "italic", color: "#777" },
  list: { listStyle: "none", paddingLeft: 0 },
  item: {
    marginBottom: "1rem",
    borderBottom: "1px solid #ddd",
    paddingBottom: "0.5rem",
  },
};

export default ReportList;
