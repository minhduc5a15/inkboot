'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, Trash2, Link as LinkIcon, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { WorldEntity, Relation, Character } from '@/types';

type EntityFormData = Omit<WorldEntity, 'id'> &
  Partial<Character> & { id?: string };

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity?: WorldEntity | Character | null;
  novelId: string;
  allEntities: WorldEntity[];
  onSuccess: () => void;
  isCharacter?: boolean;
}

export default function EntityModal({
  isOpen,
  onClose,
  entity,
  novelId,
  allEntities,
  onSuccess,
  isCharacter = false,
}: EntityModalProps) {
  const [formData, setFormData] = useState<EntityFormData>({
    novelId,
    type: isCharacter ? 'character' : 'location',
    name: '',
    description: '',
    content: '',
    appearance: '',
    personality: '',
    history: '',
    tags: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [relations, setRelations] = useState<Relation[]>([]);
  const [newRelation, setNewRelation] = useState({
    targetId: '',
    type: 'belongs to',
  });

  const isActuallyCharacter =
    isCharacter ||
    formData.type === 'character' ||
    (entity as Character)?.appearance !== undefined;

  const fetchRelations = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/world/relations/${novelId}`
        );
        if (res.ok) {
          const data = await res.json();
          setRelations(data.filter((r: Relation) => r.sourceEntityId === id));
        }
      } catch {
        console.error('Failed to fetch relations');
      }
    },
    [novelId]
  );

  useEffect(() => {
    if (entity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...entity,
        type: (entity as WorldEntity).type || 'character',
      } as EntityFormData);
      if (entity.id) fetchRelations(entity.id);
    } else {
      setFormData({
        novelId,
        type: isCharacter ? 'character' : 'location',
        name: '',
        description: '',
        content: '',
        appearance: '',
        personality: '',
        history: '',
        tags: [],
      });
      setRelations([]);
    }
  }, [entity, isOpen, novelId, isCharacter, fetchRelations]);

  const handleSave = async () => {
    if (!formData.name) return toast.error('Vui lòng nhập tên');
    setIsSaving(true);
    try {
      const isChar = isActuallyCharacter;
      const baseDir = isChar ? 'characters' : 'world';

      // Filter payload to match strict backend schema
      const payload = isChar
        ? {
            name: formData.name,
            appearance: formData.appearance,
            personality: formData.personality,
            history: formData.history,
            novelId: formData.novelId,
          }
        : {
            name: formData.name,
            type: formData.type,
            description: formData.description,
            content: formData.content,
            tags: formData.tags,
            novelId: formData.novelId,
          };

      const url = entity?.id
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${baseDir}/${entity.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/${baseDir}`;

      const response = await fetch(url, {
        method: entity?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(entity?.id ? 'Đã cập nhật' : 'Đã tạo mới');
      onSuccess();
      onClose();
    } catch {
      toast.error('Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const addRelation = async () => {
    if (!newRelation.targetId || !entity?.id) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/world/relations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceEntityId: entity.id,
            targetEntityId: newRelation.targetId,
            relationType: newRelation.type,
          }),
        }
      );
      if (res.ok) {
        fetchRelations(entity.id);
        setNewRelation({ targetId: '', type: 'belongs to' });
        toast.success('Đã thêm liên kết');
      }
    } catch {
      toast.error('Lỗi khi thêm liên kết');
    }
  };

  const deleteRelation = async (relId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/world/relations/${relId}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok && entity?.id) fetchRelations(entity.id);
    } catch {
      toast.error('Lỗi khi xóa liên kết');
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput] });
      setTagInput('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-[#d4d4d4] max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-zinc-800">
          <DialogTitle className="font-serif italic text-2xl text-white">
            {entity?.id
              ? `${isActuallyCharacter ? 'Hồ sơ nhân vật' : 'Thông tin thực thể'}: ${formData.name}`
              : `Thêm ${isActuallyCharacter ? 'nhân vật' : 'kiến thức'} mới`}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Tên {isActuallyCharacter ? 'nhân vật' : 'thực thể'}
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-zinc-950 border-zinc-800"
                  placeholder={
                    isActuallyCharacter
                      ? 'Vd: Alaric Thorne'
                      : 'Vd: Thành phố Valoria'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Loại</Label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm outline-none focus:ring-1 focus:ring-white/20"
                >
                  <option value="character">Nhân vật</option>
                  <option value="location">Địa điểm</option>
                  <option value="organization">Tổ chức</option>
                  <option value="lore">Lore / Truyền thuyết</option>
                  <option value="item">Vật phẩm</option>
                </select>
              </div>
            </div>

            {isActuallyCharacter ? (
              <>
                <div className="space-y-2">
                  <Label>Ngoại hình</Label>
                  <Textarea
                    value={formData.appearance || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, appearance: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 italic font-serif"
                    placeholder="Mô tả ngoại hình, trang phục..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tính cách & Đặc điểm</Label>
                  <Textarea
                    value={formData.personality || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, personality: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 font-serif"
                    placeholder="Tính cách, thói quen, mục tiêu..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tiểu sử / Lịch sử</Label>
                  <Textarea
                    value={formData.history || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, history: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 font-serif min-h-[100px]"
                    placeholder="Quá khứ và các sự kiện quan trọng..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Mô tả ngắn</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 italic font-serif"
                    placeholder="Tóm tắt ngắn gọn..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nội dung chi tiết</Label>
                  <Textarea
                    value={formData.content || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="bg-zinc-950 border-zinc-800 font-serif min-h-[200px]"
                    placeholder="Ghi chú chi tiết, lịch sử, đặc điểm..."
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Thẻ (Tags)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="bg-zinc-950 border-zinc-800"
                  placeholder="Thêm thẻ..."
                />
                <Button
                  variant="outline"
                  onClick={addTag}
                  className="border-zinc-800"
                >
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] uppercase tracking-widest font-bold text-zinc-400"
                  >
                    {tag}
                    <X
                      size={10}
                      className="cursor-pointer hover:text-white"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tags: formData.tags?.filter((t) => t !== tag),
                        })
                      }
                    />
                  </span>
                ))}
              </div>
            </div>

            {entity?.id && (
              <div className="space-y-4 pt-6 border-t border-zinc-800">
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold flex items-center gap-2">
                  <LinkIcon size={14} /> Liên kết thực thể
                </h3>

                <div className="flex gap-2">
                  <select
                    value={newRelation.type}
                    onChange={(e) =>
                      setNewRelation({ ...newRelation, type: e.target.value })
                    }
                    className="flex-1 h-9 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <option value="belongs to">Thuộc về</option>
                    <option value="is enemy of">Kẻ thù của</option>
                    <option value="located in">Nằm tại</option>
                    <option value="related to">Liên quan đến</option>
                    <option value="member of">Thành viên của</option>
                  </select>
                  <select
                    value={newRelation.targetId}
                    onChange={(e) =>
                      setNewRelation({
                        ...newRelation,
                        targetId: e.target.value,
                      })
                    }
                    className="flex-[2] h-9 px-2 rounded-md bg-zinc-950 border border-zinc-800 text-xs"
                  >
                    <option value="">Chọn thực thể...</option>
                    {allEntities
                      .filter((e) => e.id !== entity.id)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.type})
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={addRelation}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                <div className="space-y-2">
                  {relations.map((rel) => {
                    const target = allEntities.find(
                      (e) => e.id === rel.targetEntityId
                    );
                    return (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800"
                      >
                        <span className="text-xs">
                          <span className="text-zinc-500 italic">
                            {rel.relationType}
                          </span>{' '}
                          <span className="text-white font-medium">
                            {target?.name || 'Unknown'}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-zinc-600 hover:text-red-400"
                          onClick={() => deleteRelation(rel.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t border-zinc-800 bg-zinc-900">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-black hover:bg-white/90 font-bold px-8"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {entity?.id ? 'Lưu thay đổi' : 'Tạo thực thể'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
