import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/seo/SEO";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEO
        title="Página Não Encontrada - EXA"
        description="A página que você procura não foi encontrada."
        noindex={true}
        nofollow={true}
      />
      <motion.div 
        className="min-h-screen flex items-center justify-center bg-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-xl">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-indexa-purple/10 p-6">
              <Search className="h-16 w-16 text-indexa-purple" />
            </div>
          </div>
          <h1 className="text-8xl font-bold mb-2 text-indexa-purple">404</h1>
          <div className="h-1 w-20 bg-indexa-mint mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold mb-3">Página não encontrada</h2>
          <p className="text-gray-600 mb-8">
            Desculpe, a página que você está procurando não existe ou foi movida.
            Verifique se a URL está correta ou utilize os links abaixo para navegar.
          </p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/">
              <Button className="w-full sm:w-auto bg-indexa-purple hover:bg-indexa-purple-dark flex items-center justify-center">
                <Home className="mr-2 h-4 w-4" />
                Ir para Home
              </Button>
            </Link>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/paineis-digitais/loja">
              <Button className="w-full sm:w-auto bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800 flex items-center justify-center">
                Ir para Loja
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
    </>
  );
};

export default NotFound;
