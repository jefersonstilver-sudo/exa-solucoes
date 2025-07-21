
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PostCardProps {
  title: string;
  beforeText: string;
  afterText: string;
  category: string;
  isActive?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  title, 
  beforeText, 
  afterText, 
  category,
  isActive = false 
}) => {
  return (
    <div className={`relative bg-white rounded-2xl p-6 shadow-lg transition-all duration-500 transform group hover:scale-105 hover:shadow-2xl ${
      isActive ? 'ring-2 ring-linkae-pink' : ''
    }`}>
      {/* Categoria */}
      <div className="inline-block bg-gradient-to-r from-linkae-pink to-linkae-orange text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
        {category}
      </div>
      
      {/* Título */}
      <h3 className="text-xl font-bold text-linkae-dark-blue mb-4 group-hover:text-linkae-royal-blue transition-colors">
        {title}
      </h3>
      
      {/* Antes e Depois */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">ANTES</div>
          <p className="text-sm text-gray-600 leading-relaxed">{beforeText}</p>
        </div>
        
        <div className="flex justify-center">
          <ArrowRight className="w-6 h-6 text-linkae-orange group-hover:translate-x-1 transition-transform" />
        </div>
        
        <div className="bg-gradient-to-br from-linkae-pink/10 to-linkae-orange/10 rounded-lg p-4 border border-linkae-pink/20">
          <div className="text-xs text-linkae-orange font-medium mb-2 uppercase tracking-wide">DEPOIS</div>
          <p className="text-sm text-linkae-dark-blue leading-relaxed font-medium">{afterText}</p>
        </div>
      </div>
      
      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-linkae-pink to-linkae-orange opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default PostCard;
