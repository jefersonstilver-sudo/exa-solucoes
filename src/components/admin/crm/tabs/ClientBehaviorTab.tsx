import { Card } from '@/components/ui/card';
import { Eye, Video, ShoppingCart, Clock, MousePointer } from 'lucide-react';

interface ClientBehaviorTabProps {
  behavior: {
    total_sessions: number;
    total_time_spent: number;
    pages_visited: Record<string, number>;
    buildings_viewed: Array<{
      building_id: string;
      time_spent: number;
      views_count: number;
    }>;
    videos_watched: Array<{
      video_id: string;
      watch_duration: number;
      completed: boolean;
    }>;
    cart_abandonments: number;
    checkout_starts: number;
  };
}

export function ClientBehaviorTab({ behavior }: ClientBehaviorTabProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}min ${secs}s`;
  };

  const sortedPages = Object.entries(behavior.pages_visited || {}).sort(
    ([, a], [, b]) => b - a
  );

  const sortedBuildings = [...(behavior.buildings_viewed || [])].sort(
    (a, b) => b.time_spent - a.time_spent
  );

  const completedVideos = (behavior.videos_watched || []).filter((v) => v.completed).length;
  const completionRate =
    behavior.videos_watched && behavior.videos_watched.length > 0
      ? (completedVideos / behavior.videos_watched.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MousePointer className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Sessões</p>
              <p className="text-2xl font-bold">{behavior.total_sessions || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Tempo Total</p>
              <p className="text-2xl font-bold">
                {Math.floor((behavior.total_time_spent || 0) / 60)}min
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Abandonos</p>
              <p className="text-2xl font-bold">{behavior.cart_abandonments || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Video className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Vídeos Assistidos</p>
              <p className="text-2xl font-bold">{behavior.videos_watched?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Páginas Mais Visitadas */}
      {sortedPages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Páginas Mais Visitadas
          </h3>
          <div className="space-y-3">
            {sortedPages.map(([page, time]) => (
              <div key={page} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{page}</p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-1">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{
                        width: `${(time / sortedPages[0][1]) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-4">{formatTime(time)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Prédios Mais Visualizados */}
      {sortedBuildings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prédios Mais Visualizados
          </h3>
          <div className="space-y-4">
            {sortedBuildings.slice(0, 10).map((building, index) => (
              <div key={building.building_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      #{index + 1} - {building.building_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {building.views_count} visualizações
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatTime(building.time_spent)}</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{
                      width: `${(building.time_spent / sortedBuildings[0].time_spent) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Análise de Vídeos */}
      {behavior.videos_watched && behavior.videos_watched.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Video className="h-5 w-5" />
            Análise de Vídeos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Assistidos</p>
              <p className="text-3xl font-bold">{behavior.videos_watched.length}</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Completos</p>
              <p className="text-3xl font-bold text-green-600">{completedVideos}</p>
            </div>
            <div className="text-center p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-blue-600">{completionRate.toFixed(0)}%</p>
            </div>
          </div>

          <div className="space-y-2">
            {behavior.videos_watched.map((video, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{video.video_id.slice(0, 8)}...</p>
                    <p className="text-xs text-muted-foreground">
                      Assistido: {formatTime(video.watch_duration)}
                    </p>
                  </div>
                </div>
                {video.completed ? (
                  <span className="text-xs font-medium text-green-600">✓ Completo</span>
                ) : (
                  <span className="text-xs font-medium text-orange-600">Incompleto</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
