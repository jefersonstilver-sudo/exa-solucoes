import React from 'react';

const FooterSection = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'LINKAÊ', href: '/linkae' },
    { name: 'EXA', href: '/exa' },
    { name: 'Sou Síndico', href: '/sindico' },
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://instagram.com/indexa_oficial',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zm5.568 8.412l-.006.002c-.102.7-.702 1.247-1.413 1.247h-.581v4.689c0 2.025-1.64 3.665-3.665 3.665s-3.665-1.64-3.665-3.665V9.661h-.581c-.711 0-1.311-.547-1.413-1.247l-.006-.002c-.111-.761.419-1.445 1.198-1.545.079-.010.159-.016.239-.016h8.456c.08 0 .16.006.239.016.779.1 1.309.784 1.198 1.545z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/indexa-midia',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@indexa_oficial',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-black text-white py-16 px-4">
      {/* Top Border */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white to-transparent mb-16"></div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {/* Logo and Copyright */}
          <div className="space-y-6">
            <div>
              <h3 className="font-playfair text-2xl lg:text-3xl font-bold mb-3">
                <span className="text-white">indexa</span>
                <span className="text-orange-500"> produtora</span>
              </h3>
              <p className="font-montserrat text-gray-400 leading-relaxed">
                Transformando ideias em narrativas cinematográficas no coração de Foz do Iguaçu.
              </p>
            </div>
            
            <div className="text-sm text-gray-400 font-montserrat">
              <p>&copy; {currentYear} INDEXA Produtora.</p>
              <p className="mt-1">Protegido pela LGPD – Seus dados estão seguros conosco.</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-montserrat font-bold text-lg mb-6 text-orange-400">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="font-montserrat text-gray-300 hover:text-orange-400 transition-colors duration-200 relative group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-200 group-hover:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-montserrat font-bold text-lg mb-6 text-orange-400">
              Contato
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-montserrat text-gray-300">(45) 99125-0093</span>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <a 
                  href="mailto:contato@indexamidia.com"
                  className="font-montserrat text-gray-300 hover:text-orange-400 transition-colors duration-200"
                >
                  contato@indexamidia.com
                </a>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-montserrat text-gray-300">
                  Avenida Paraná 974<br />
                  Foz do Iguaçu, PR
                </span>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8">
              <h5 className="font-montserrat font-semibold text-white mb-4">Siga-nos</h5>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;