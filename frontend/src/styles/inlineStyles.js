const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  nav: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  navInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    marginRight: '20px',
    cursor: 'pointer'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500
  },
  buttonDanger: {
    background: '#d32f2f',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px'
  },
  label: {
    display: 'block',
    marginTop: '15px',
    marginBottom: '5px',
    fontWeight: 500
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    margin: '20px 0'
  },
  listItem: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    marginRight: '5px'
  },
  badgePrimary: { background: '#e3f2fd', color: '#1976d2' },
  badgeSuccess: { background: '#e8f5e9', color: '#388e3c' },
  badgeWarning: { background: '#fff3e0', color: '#f57c00' },
  badgeDanger: { background: '#ffebee', color: '#d32f2f' },
  alertInfo: { padding: '15px', borderRadius: '4px', marginBottom: '20px', background: '#e3f2fd', color: '#1976d2', borderLeft: '4px solid #1976d2' },
  alertSuccess: { padding: '15px', borderRadius: '4px', marginBottom: '20px', background: '#e8f5e9', color: '#388e3c', borderLeft: '4px solid #388e3c' },
  alertWarning: { padding: '15px', borderRadius: '4px', marginBottom: '20px', background: '#fff3e0', color: '#f57c00', borderLeft: '4px solid #f57c00' },
  alertDanger: { padding: '15px', borderRadius: '4px', marginBottom: '20px', background: '#ffebee', color: '#d32f2f', borderLeft: '4px solid #d32f2f' },
  loading: { textAlign: 'center', padding: '40px' },
  spinnerSvg: { width: '40px', height: '40px', display: 'block', margin: '0 auto' }
};

export default styles;
