/**
 * Registro de páginas e seus arquivos relacionados para debug contextual
 */

export interface PageDebugInfo {
  pageName: string;
  pageFile: string;
  relatedFiles: string[];
  stateVariables: string[];
  apiEndpoints: string[];
  commonErrors: {
    code: string;
    description: string;
    solution: string;
    sqlFix?: string;
  }[];
  hooks: string[];
  components: string[];
}

export const PAGE_DEBUG_REGISTRY: Record<string, PageDebugInfo> = {
  '/anunciante/pedido/': {
    pageName: 'Order Details (Anunciante)',
    pageFile: 'src/pages/OrderDetails.tsx',
    relatedFiles: [
      'src/hooks/useRealOrderDetails.ts',
      'src/hooks/useVideoManagement.ts',
      'src/components/order/VideoManagementCard.tsx',
      'src/components/video-management/VideoSlotGrid.tsx',
      'src/components/video-management/VideoSlotCard.tsx',
      'src/services/videoManagementService.ts',
      'src/services/videoScheduleManagementService.ts',
      'src/types/videoManagement.ts'
    ],
    stateVariables: [
      'orderId',
      'orderDetails',
      'orderVideos',
      'panelData',
      'videoSlots',
      'loading',
      'uploading',
      'uploadProgress',
      'user.id',
      'user.email'
    ],
    apiEndpoints: [
      'GET /pedidos/{id}',
      'GET /clients/{id}',
      'GET /pedido_videos (by pedido_id)',
      'GET /videos/{id}',
      'GET /predios/{id}',
      'POST /videos (upload)',
      'PUT /pedido_videos/{id}',
      'DELETE /pedido_videos/{id}',
      'POST /video_schedule_rules',
      'DELETE /video_schedule_rules/{id}'
    ],
    commonErrors: [
      {
        code: 'CORRUPTED_VIDEO_URL',
        description: 'Vídeo com URL corrompida (undefined ou inválida)',
        solution: 'Usar Force Cleanup para remover slot corrompido',
        sqlFix: `DELETE FROM pedido_videos WHERE id = '{slot_id}';`
      },
      {
        code: 'NO_BASE_VIDEO',
        description: 'Nenhum vídeo definido como base (is_base_video = false em todos)',
        solution: 'Definir Slot 1 como vídeo base',
        sqlFix: `UPDATE pedido_videos SET is_base_video = true WHERE pedido_id = '{order_id}' AND slot_position = 1;`
      },
      {
        code: 'CONFLICTING_SCHEDULES',
        description: 'Múltiplos vídeos ativos no mesmo horário',
        solution: 'Revisar regras de agendamento e desativar conflitos',
        sqlFix: `UPDATE pedido_videos SET is_active = false WHERE id = '{conflicting_slot_id}';`
      },
      {
        code: 'ACTIVE_WITHOUT_APPROVAL',
        description: 'Vídeo ativo mas não aprovado (approval_status != "approved")',
        solution: 'Aprovar vídeo ou desativar slot',
        sqlFix: `UPDATE pedido_videos SET approval_status = 'approved' WHERE id = '{slot_id}';`
      },
      {
        code: 'MISSING_VIDEO_DATA',
        description: 'Slot referencia video_id mas o vídeo não existe na tabela videos',
        solution: 'Remover slot ou criar registro de vídeo',
        sqlFix: `DELETE FROM pedido_videos WHERE video_id = '{missing_video_id}';`
      }
    ],
    hooks: [
      'useRealOrderDetails',
      'useVideoManagement',
      'useUser',
      'useOrderViewTracking'
    ],
    components: [
      'VideoManagementCard',
      'VideoSlotGrid',
      'VideoSlotCard',
      'VideoSlotActions',
      'BlockedOrderAlert'
    ]
  },
  '/admin/pedido/': {
    pageName: 'Order Details (Admin)',
    pageFile: 'src/pages/admin/OrderDetails.tsx',
    relatedFiles: [
      'src/hooks/useRealOrderDetails.ts',
      'src/components/admin/ProfessionalOrderReport.tsx',
      'src/services/pdfExportService.ts'
    ],
    stateVariables: [
      'orderId',
      'orderDetails',
      'orderVideos',
      'panelData',
      'loading',
      'isExporting'
    ],
    apiEndpoints: [
      'GET /pedidos/{id}',
      'GET /clients/{id}',
      'GET /pedido_videos',
      'GET /predios/{id}'
    ],
    commonErrors: [
      {
        code: 'PDF_EXPORT_FAIL',
        description: 'Falha ao exportar PDF do pedido',
        solution: 'Verificar dados do pedido e permissões'
      },
      {
        code: 'MISSING_PANEL_DATA',
        description: 'Dados dos painéis não carregados',
        solution: 'Verificar se lista_predios tem IDs válidos'
      }
    ],
    hooks: [
      'useRealOrderDetails',
      'useNavigate',
      'useParams'
    ],
    components: [
      'ProfessionalOrderReport',
      'OrderHeader'
    ]
  },
  '/anunciante/pedidos': {
    pageName: 'My Orders (Anunciante)',
    pageFile: 'src/pages/MyOrders.tsx',
    relatedFiles: [
      'src/hooks/useUserOrders.ts',
      'src/components/order/OrderCard.tsx'
    ],
    stateVariables: [
      'orders',
      'loading',
      'error',
      'user.id'
    ],
    apiEndpoints: [
      'GET /pedidos (by client_id)'
    ],
    commonErrors: [
      {
        code: 'ORDERS_NOT_LOADING',
        description: 'Lista de pedidos não carrega',
        solution: 'Verificar autenticação e permissões'
      }
    ],
    hooks: [
      'useUserOrders',
      'useUser'
    ],
    components: [
      'OrderCard',
      'OrderStatusBadge'
    ]
  },
  '/predio/': {
    pageName: 'Building Details',
    pageFile: 'src/pages/BuildingDetails.tsx',
    relatedFiles: [
      'src/hooks/useBuildingActiveCampaigns.tsx',
      'src/hooks/useBuildingActiveCampaigns/dataFetchers.ts',
      'src/hooks/useBuildingActiveCampaigns/dataProcessor.ts'
    ],
    stateVariables: [
      'buildingId',
      'campaigns',
      'loading',
      'error'
    ],
    apiEndpoints: [
      'GET /pedidos (by lista_predios)',
      'GET /clients',
      'GET /pedido_videos'
    ],
    commonErrors: [
      {
        code: 'CAMPAIGNS_NOT_LOADING',
        description: 'Campanhas ativas não carregam',
        solution: 'Verificar se buildingId está correto'
      }
    ],
    hooks: [
      'useBuildingActiveCampaigns'
    ],
    components: [
      'CampaignCard',
      'VideoPlayer'
    ]
  }
};

/**
 * Busca informações de debug para uma página específica
 */
export const getPageDebugInfo = (pathname: string): PageDebugInfo | null => {
  // Busca exata
  if (PAGE_DEBUG_REGISTRY[pathname]) {
    return PAGE_DEBUG_REGISTRY[pathname];
  }
  
  // Busca por prefixo (ex: /anunciante/pedido/123 -> /anunciante/pedido/)
  for (const [path, info] of Object.entries(PAGE_DEBUG_REGISTRY)) {
    if (pathname.startsWith(path)) {
      return info;
    }
  }
  
  return null;
};
