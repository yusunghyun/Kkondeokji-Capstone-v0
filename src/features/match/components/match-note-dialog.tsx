import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { Edit3, MessageSquare, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface MatchNoteDialogProps {
  matchId: string;
  partnerName: string;
  initialNote?: string;
  onNoteUpdate: (note: string | null) => void;
  trigger?: React.ReactNode;
}

export function MatchNoteDialog({
  matchId,
  partnerName,
  initialNote = "",
  onNoteUpdate,
  trigger,
}: MatchNoteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        });
        return;
      }

      const noteText = note.trim();

      if (noteText === "") {
        // 노트 삭제
        const { error } = await (supabase as any)
          .from("match_notes")
          .delete()
          .eq("match_id", matchId)
          .eq("user_id", user.id);

        if (error) throw error;

        onNoteUpdate(null);
        toast({
          title: "노트 삭제됨",
          description: "매칭 노트가 삭제되었습니다.",
        });
      } else {
        // 노트 저장/업데이트
        const { error } = await (supabase as any).from("match_notes").upsert({
          match_id: matchId,
          user_id: user.id,
          note: noteText,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        onNoteUpdate(noteText);
        toast({
          title: "노트 저장됨",
          description: "매칭 노트가 저장되었습니다.",
        });
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "오류",
        description: "노트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant={initialNote ? "secondary" : "outline"}
      size="sm"
      className="flex items-center gap-2"
    >
      {initialNote ? (
        <Edit3 className="h-4 w-4" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      {initialNote ? "노트 편집" : "노트 추가"}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {partnerName}님과의 매칭 노트
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">메모</Label>
            <Textarea
              id="note"
              placeholder="만난 장소, 대화 내용, 느낌 등을 자유롭게 적어보세요..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {note.length}/500자
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
