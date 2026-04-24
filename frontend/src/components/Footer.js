import React from 'react';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerStyle = {
    footer: {
      background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)',
      color: 'white',
      padding: '35px 30px 20px 30px',
      marginTop: '45px',
      borderTop: '1px solid rgba(255,255,255,0.1)'
    },
    footerContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '30px',
      marginBottom: '20px'
    },
    footerSection: {
      display: 'flex',
      flexDirection: 'column'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '16px',
      color: '#ffffff',
      letterSpacing: '0.5px'
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    link: {
      color: 'rgba(255,255,255,0.75)',
      textDecoration: 'none',
      fontSize: '15px',
      marginBottom: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'color 0.3s ease, transform 0.2s ease',
      cursor: 'pointer',
      lineHeight: '1.5'
    },
    linkHover: {
      color: '#ffffff'
    },
    contactItem: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: '15px',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      lineHeight: '1.6'
    },
    socialLinks: {
      display: 'flex',
      gap: '12px',
      marginTop: '0',
      alignItems: 'center'
    },
    socialIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      cursor: 'pointer',
      transition: 'background 0.3s ease, transform 0.2s ease'
    },
    divider: {
      height: '1px',
      background: 'rgba(255,255,255,0.1)',
      margin: '12px 0'
    },
    footerBottom: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '12px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      flexWrap: 'wrap',
      gap: '25px',
      textAlign: 'center'
    },
    copyright: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '14px',
      lineHeight: '1.6'
    },
    legalLinks: {
      display: 'flex',
      gap: '25px',
      flexWrap: 'wrap'
    },
    legalLink: {
      color: 'rgba(255,255,255,0.7)',
      textDecoration: 'none',
      fontSize: '14px',
      transition: 'color 0.3s ease',
      cursor: 'pointer',
      lineHeight: '1.6'
    }
  };

  const [hoveredLink, setHoveredLink] = React.useState(null);

  const handleLinkHover = (linkId) => {
    setHoveredLink(linkId);
  };

  const handleLinkLeave = () => {
    setHoveredLink(null);
  };

  return (
    <footer style={footerStyle.footer}>
      <div style={footerStyle.footerContainer}>
        {/* About Section */}
        <div style={footerStyle.footerSection}>
          <h4 style={footerStyle.sectionTitle}>About learnbridge</h4>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.7', margin: '0', textAlign: 'justify' }}>
            learnbridge is your comprehensive learning management system designed to enhance student success through interactive learning, tutoring sessions, and adaptive assessments.
          </p>
        </div>

        {/* Quick Links */}
        <div style={footerStyle.footerSection}>
          <h4 style={footerStyle.sectionTitle}>Quick Links</h4>
          <ul style={footerStyle.linkList}>
            <li>
              <a
                href="/dashboard"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'dashboard' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'dashboard' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('dashboard')}
                onMouseLeave={handleLinkLeave}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/materials"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'materials' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'materials' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('materials')}
                onMouseLeave={handleLinkLeave}
              >
                Study Materials
              </a>
            </li>
            <li>
              <a
                href="/questions"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'questions' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'questions' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('questions')}
                onMouseLeave={handleLinkLeave}
              >
                Questions
              </a>
            </li>
            <li>
              <a
                href="/mcq"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'mcq' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'mcq' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('mcq')}
                onMouseLeave={handleLinkLeave}
              >
                MCQ Practice
              </a>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div style={footerStyle.footerSection}>
          <h4 style={footerStyle.sectionTitle}>Resources</h4>
          <ul style={footerStyle.linkList}>
            <li>
              <a
                href="#help"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'help' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'help' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('help')}
                onMouseLeave={handleLinkLeave}
              >
                Help & Support
              </a>
            </li>
            <li>
              <a
                href="#faq"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'faq' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'faq' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('faq')}
                onMouseLeave={handleLinkLeave}
              >
                FAQ
              </a>
            </li>
            <li>
              <a
                href="#docs"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'docs' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'docs' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('docs')}
                onMouseLeave={handleLinkLeave}
              >
                Documentation
              </a>
            </li>
            <li>
              <a
                href="#blog"
                style={{
                  ...footerStyle.link,
                  color: hoveredLink === 'blog' ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  transform: hoveredLink === 'blog' ? 'translateX(5px)' : 'translateX(0)'
                }}
                onMouseEnter={() => handleLinkHover('blog')}
                onMouseLeave={handleLinkLeave}
              >
                Blog
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div style={footerStyle.footerSection}>
          <h4 style={footerStyle.sectionTitle}>Get In Touch</h4>
          <div style={footerStyle.contactItem}>
            <FaEnvelope size={16} />
            <a href="mailto:support@eduplatform.com" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}>
              support@eduplatform.com
            </a>
          </div>
          <div style={footerStyle.contactItem}>
            <FaPhone size={16} />
            <span>+1 (555) 123-4567</span>
          </div>
          <div style={footerStyle.contactItem}>
            <FaMapMarkerAlt size={16} />
            <span>123 Education Blvd, Learning City, LC 12345</span>
          </div>
        </div>
      </div>

      <div style={footerStyle.divider}></div>

      {/* Bottom Footer */}
      <div style={footerStyle.footerBottom}>
        <div style={footerStyle.socialLinks}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Follow Us:</span>
          <div
            style={footerStyle.socialIcon}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            title="Facebook"
          >
            <FaFacebook size={16} />
          </div>
          <div
            style={footerStyle.socialIcon}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            title="Twitter"
          >
            <FaTwitter size={16} />
          </div>
          <div
            style={footerStyle.socialIcon}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            title="LinkedIn"
          >
            <FaLinkedin size={16} />
          </div>
          <div
            style={footerStyle.socialIcon}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            title="Instagram"
          >
            <FaInstagram size={16} />
          </div>
        </div>
        <p style={footerStyle.copyright}>
          © {currentYear} learnbridge. All rights reserved.
        </p>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          footer {
            padding: 32px 25px 18px 25px;
            margin-top: 40px;
          }
        }

        @media (max-width: 768px) {
          footer {
            padding: 30px 20px 16px 20px;
            margin-top: 35px;
          }
        }

        @media (max-width: 640px) {
          footer {
            padding: 26px 16px 14px 16px;
            margin-top: 30px;
          }

          footer h4 {
            font-size: 14px !important;
            margin-bottom: 11px !important;
          }

          footer p {
            font-size: 12px !important;
            line-height: 1.5 !important;
          }

          footer a {
            font-size: 13px !important;
            margin-bottom: 8px !important;
          }
        }

        @media (max-width: 480px) {
          footer {
            padding: 22px 12px 12px 12px;
            margin-top: 25px;
          }

          footer h4 {
            font-size: 13px !important;
            margin-bottom: 9px !important;
          }

          footer p {
            font-size: 11px !important;
            line-height: 1.4 !important;
          }

          footer a {
            font-size: 12px !important;
            margin-bottom: 7px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
