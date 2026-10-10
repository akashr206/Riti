import React, { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay, DialogPortal } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { createRecord, updateRecord, deleteRecord } from "../../api";
import { cn } from "cn";

export function EntityEditor({ open, setOpen, entityType, initialData, onSaved }) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);

  const isEdit = !!initialData?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      delete payload.id;
      delete payload.createdAt;
      
      if (isEdit) {
        await updateRecord(entityType, initialData.id, payload);
      } else {
        await createRecord(entityType, payload);
      }
      onSaved();
      setOpen(false);
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderFields = () => {
    if (entityType === "exams") {
      return (
        <>
          <div className="space-y-2">
            <Label>Course Code</Label>
            <Input value={formData.courseCode || ""} onChange={e => setFormData({...formData, courseCode: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Course Name</Label>
            <Input value={formData.courseName || ""} onChange={e => setFormData({...formData, courseName: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.examDate || ""} onChange={e => setFormData({...formData, examDate: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={formData.startTime || ""} onChange={e => setFormData({...formData, startTime: e.target.value})} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration (Hours)</Label>
            <Input type="number" step="0.5" value={formData.durationMinutes ? formData.durationMinutes / 60 : ""} onChange={e => setFormData({...formData, durationMinutes: e.target.value === "" ? "" : parseFloat(e.target.value) * 60})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Students</Label>
              <Input type="number" value={formData.totalStudents ?? ""} onChange={e => setFormData({...formData, totalStudents: e.target.value === "" ? "" : parseInt(e.target.value)})} required />
            </div>
            <div className="space-y-2">
              <Label>PWD Students (Accessible)</Label>
              <Input type="number" value={formData.pwdStudents ?? ""} onChange={e => setFormData({...formData, pwdStudents: e.target.value === "" ? "" : parseInt(e.target.value)})} />
            </div>
          </div>
        </>
      );
    }
    if (entityType === "rooms") {
      return (
        <>
          <div className="space-y-2">
            <Label>Room Name</Label>
            <Input value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Capacity</Label>
              <Input type="number" value={formData.capacity ?? ""} onChange={e => setFormData({...formData, capacity: e.target.value === "" ? "" : parseInt(e.target.value)})} required />
            </div>
            <div className="space-y-2">
              <Label>Accessible Seats</Label>
              <Input type="number" value={formData.accessibleSeats ?? ""} onChange={e => setFormData({...formData, accessibleSeats: e.target.value === "" ? "" : parseInt(e.target.value)})} />
            </div>
          </div>
        </>
      );
    }
    if (entityType === "faculty") {
      return (
        <>
          <div className="space-y-2">
            <Label>Faculty Name</Label>
            <Input value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={formData.department || ""} onChange={e => setFormData({...formData, department: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Taught Subjects (Comma separated)</Label>
            <Input placeholder="e.g. CS101,CS102" value={formData.taughtSubjects || ""} onChange={e => setFormData({...formData, taughtSubjects: e.target.value})} />
          </div>
        </>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Record" : "Add New Record"}</DialogTitle>
          <DialogDescription>Fill in the details below and save to update the database.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="max-h-[60vh] overflow-y-auto px-1 space-y-4">
            {renderFields()}
          </div>
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDelete({ open, setOpen, entityType, entityId, entityName, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!entityId) return;
    setDeleting(true);
    try {
      await deleteRecord(entityType, entityId);
      onDeleted();
      setOpen(false);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>4
          <DialogTitle className="text-center">Are you absolutely sure?</DialogTitle>
          <DialogDescription className="text-center">
            This action cannot be undone. This will permanently delete <strong>{entityName}</strong> from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Yes, delete it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
