const styles = {
  container: {
    width: '100%',
    maxWidth: '1500px',
    margin: '0 auto',
    padding: '0 26px',
    paddingBottom: '60px',
    boxSizing: 'border-box'
  },
  pageShell: {
    width: '100%',
    minHeight: 'calc(100vh - 78px)',
    padding: '20px 0 34px 0',
    background: 'linear-gradient(180deg, #f6f8ff 0%, #eef2ff 100%)'
  },
  pageTitle: {
    margin: 0,
    marginBottom: '8px',
    fontSize: '30px',
    color: '#0b1f3b',
    letterSpacing: '-0.3px'
  },
  pageSubtitle: {
    margin: 0,
    color: 'rgba(11,31,59,0.72)',
    fontWeight: 600,
    fontSize: '14px'
  },
  nav: {
    background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)',
    color: 'white',
    padding: '1rem 0',
    boxShadow: '0 10px 25px rgba(2, 6, 23, 0.25)',
    position: 'sticky',
    top: 0,
    zIndex: 10
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
    background: 'rgba(255, 255, 255, 0.92)',
    borderRadius: '16px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 16px 45px rgba(2, 6, 23, 0.10)',
    border: '1px solid rgba(11, 31, 59, 0.08)'
    ,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
  },
  button: {
    background: 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 12px 25px rgba(2, 6, 23, 0.18)',
    transition: 'transform 0.12s ease, box-shadow 0.2s ease, filter 0.2s ease'
  },
  buttonDanger: {
    background: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
    color: 'white',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '12px',
    cursor: 'pointer'
    ,
    boxShadow: '0 12px 25px rgba(185, 28, 28, 0.18)',
    transition: 'transform 0.12s ease, box-shadow 0.2s ease, filter 0.2s ease'
  },
  input: {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid rgba(11, 31, 59, 0.15)',
    borderRadius: '12px',
    fontFamily: 'inherit',
    fontSize: '14px',
    background: 'rgba(255, 255, 255, 0.98)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.35)'
  },
  label: {
    display: 'block',
    marginTop: '15px',
    marginBottom: '5px',
    fontWeight: 700,
    color: '#0b1f3b'
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
  badgePrimary: { background: '#eaf1ff', color: '#1e3a8a' },
  badgeSuccess: { background: '#e9fdf0', color: '#166534' },
  badgeWarning: { background: '#fff4e6', color: '#b45309' },
  badgeDanger: { background: '#ffe4e6', color: '#be123c' },
  alertInfo: { padding: '15px', borderRadius: '12px', marginBottom: '20px', background: '#eaf1ff', color: '#1e3a8a', borderLeft: '4px solid #1e3a8a' },
  alertSuccess: { padding: '15px', borderRadius: '12px', marginBottom: '20px', background: '#e9fdf0', color: '#166534', borderLeft: '4px solid #166534' },
  alertWarning: { padding: '15px', borderRadius: '12px', marginBottom: '20px', background: '#fff4e6', color: '#b45309', borderLeft: '4px solid #b45309' },
  alertDanger: { padding: '15px', borderRadius: '12px', marginBottom: '20px', background: '#ffe4e6', color: '#be123c', borderLeft: '4px solid #be123c' },
  loading: { textAlign: 'center', padding: '40px' },
  spinnerSvg: { width: '40px', height: '40px', display: 'block', margin: '0 auto' }
};

export default styles;
