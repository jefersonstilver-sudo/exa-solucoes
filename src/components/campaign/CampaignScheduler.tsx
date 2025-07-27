import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Video } from "lucide-react";
import { VideoScheduleManager } from "./VideoScheduleManager";
import { useCampaignScheduling } from "@/hooks/useCampaignScheduling";
import { VideoSlot } from "@/types/videoManagement";
import { CampaignInput, VideoScheduleInput } from "@/types/campaignScheduling";

interface CampaignSchedulerProps {
  pedidoId: string;
  approvedVideos: VideoSlot[];
  onCampaignCreated?: () => void;
}

export const CampaignScheduler = ({ 
  pedidoId, 
  approvedVideos, 
  onCampaignCreated 
}: CampaignSchedulerProps) => {
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [videoSchedules, setVideoSchedules] = useState<VideoScheduleInput[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createCampaign } = useCampaignScheduling(pedidoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campaignName || !startDate || !endDate || videoSchedules.length === 0) {
      return;
    }

    // Validate video schedules
    const hasValidSchedules = videoSchedules.every(schedule => 
      schedule.video_id && 
      schedule.schedule_rules.length > 0 &&
      schedule.schedule_rules.every(rule => 
        rule.days_of_week.length > 0 && 
        rule.start_time && 
        rule.end_time
      )
    );

    if (!hasValidSchedules) {
      return;
    }

    setIsSubmitting(true);

    const campaignData: CampaignInput = {
      name: campaignName,
      description: campaignDescription,
      start_date: startDate,
      end_date: endDate,
      video_schedules: videoSchedules
    };

    const campaignId = await createCampaign(campaignData);
    
    if (campaignId) {
      // Reset form
      setCampaignName('');
      setCampaignDescription('');
      setStartDate('');
      setEndDate('');
      setVideoSchedules([]);
      
      onCampaignCreated?.();
    }

    setIsSubmitting(false);
  };

  const isFormValid = campaignName && startDate && endDate && videoSchedules.length > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Nova Campanha Publicitária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha *</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ex: Campanha Verão 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Período da Campanha *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                    Data Início
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                    Data Fim
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-description">Descrição</Label>
            <Textarea
              id="campaign-description"
              value={campaignDescription}
              onChange={(e) => setCampaignDescription(e.target.value)}
              placeholder="Descreva os objetivos e detalhes da campanha..."
              rows={3}
            />
          </div>

          {/* Video Scheduling */}
          <VideoScheduleManager
            approvedVideos={approvedVideos}
            videoSchedules={videoSchedules}
            onSchedulesChange={setVideoSchedules}
          />

          {/* Campaign Summary */}
          {videoSchedules.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Resumo da Campanha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Vídeos agendados:</strong> {videoSchedules.length}
                  </div>
                  <div>
                    <strong>Período:</strong> {startDate} a {endDate}
                  </div>
                  <div>
                    <strong>Total de regras:</strong> {videoSchedules.reduce((acc, schedule) => acc + schedule.schedule_rules.length, 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Criando Campanha...
                </>
              ) : (
                'Criar Campanha'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};