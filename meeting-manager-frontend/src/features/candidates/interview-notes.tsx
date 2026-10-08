"use client";

import { Loader2, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/client";
import { useCandidateStore } from "@/stores/candidate-store";
import { Section } from "./section";

export function InterviewNotes({ candidateId, notes }: { candidateId: string; notes: string }) {
  const saveNotes = useCandidateStore((s) => s.saveNotes);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);
  // Existing notes open read-only; with none yet, go straight to the editor.
  const [editing, setEditing] = useState(!notes.trim());
  const dirty = draft !== notes;

  const save = async () => {
    setSaving(true);
    try {
      await saveNotes(candidateId, draft);
      toast.success("Notes saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(notes);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Section
        title="Interview Notes"
        action={
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil />
            Edit
          </Button>
        }
      >
        <div className="rounded-xl bg-muted px-4 py-3 text-sm whitespace-pre-line wrap-break-word">{notes}</div>
      </Section>
    );
  }

  return (
    <Section
      title="Interview Notes"
      action={
        <div className="flex gap-2">
          {notes.trim() && (
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              <X />
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Save
          </Button>
        </div>
      }
    >
      <Textarea
        aria-label="Interview notes"
        rows={6}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Notes for recruiters and interviewers…"
      />
      {dirty && <p className="mt-2 text-xs text-warning">Unsaved changes</p>}
    </Section>
  );
}
