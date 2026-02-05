 import { useState } from "react";
 import { Plus, Trash2, Star, Edit2, Copy, FileText } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { cn } from "@/lib/utils";
 import {
   useReportTemplates,
   useCreateReportTemplate,
   useUpdateReportTemplate,
   useDeleteReportTemplate,
   useSetDefaultTemplate,
   ReportTemplate,
   ReportTemplateInsert,
 } from "@/hooks/useReportTemplates";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 const defaultTemplate: ReportTemplateInsert = {
   name: "",
   description: "",
   primary_color: "#8b5cf6",
   secondary_color: "#a855f7",
   logo_url: null,
   company_name: "Glam",
   footer_text: "جميع الحقوق محفوظة",
   is_default: false,
 };
 
 export const ReportTemplatesManager = () => {
   const { isRTL } = useLanguage();
   const { data: templates = [], isLoading } = useReportTemplates();
   const createTemplate = useCreateReportTemplate();
   const updateTemplate = useUpdateReportTemplate();
   const deleteTemplate = useDeleteReportTemplate();
   const setDefaultTemplate = useSetDefaultTemplate();
 
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
   const [formData, setFormData] = useState<ReportTemplateInsert>(defaultTemplate);
   const [isUploading, setIsUploading] = useState(false);
 
   const handleOpenDialog = (template?: ReportTemplate) => {
     if (template) {
       setEditingTemplate(template);
       setFormData({
         name: template.name,
         description: template.description || "",
         primary_color: template.primary_color,
         secondary_color: template.secondary_color,
         logo_url: template.logo_url,
         company_name: template.company_name,
         footer_text: template.footer_text,
         is_default: template.is_default,
       });
     } else {
       setEditingTemplate(null);
       setFormData(defaultTemplate);
     }
     setIsDialogOpen(true);
   };
 
   const handleDuplicate = (template: ReportTemplate) => {
     setEditingTemplate(null);
     setFormData({
       name: `${template.name} (نسخة)`,
       description: template.description || "",
       primary_color: template.primary_color,
       secondary_color: template.secondary_color,
       logo_url: template.logo_url,
       company_name: template.company_name,
       footer_text: template.footer_text,
       is_default: false,
     });
     setIsDialogOpen(true);
   };
 
   const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     setIsUploading(true);
     try {
       const fileExt = file.name.split(".").pop();
       const fileName = `report-logo-${Date.now()}.${fileExt}`;
 
       const { error: uploadError } = await supabase.storage
         .from("banners")
         .upload(fileName, file, { upsert: true });
 
       if (uploadError) throw uploadError;
 
       const { data: urlData } = supabase.storage
         .from("banners")
         .getPublicUrl(fileName);
 
       setFormData((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
       toast.success("تم رفع الشعار بنجاح");
     } catch (error) {
       console.error("Error uploading logo:", error);
       toast.error("فشل رفع الشعار");
     } finally {
       setIsUploading(false);
     }
   };
 
   const handleSubmit = async () => {
     if (!formData.name.trim()) {
       toast.error("يرجى إدخال اسم القالب");
       return;
     }
 
     if (editingTemplate) {
       await updateTemplate.mutateAsync({ id: editingTemplate.id, ...formData });
     } else {
       await createTemplate.mutateAsync(formData);
     }
     setIsDialogOpen(false);
   };
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="flex items-center gap-2">
           <FileText className="w-5 h-5" />
           {isRTL ? "قوالب التقارير" : "Report Templates"}
         </CardTitle>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button onClick={() => handleOpenDialog()} size="sm">
               <Plus className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
               {isRTL ? "قالب جديد" : "New Template"}
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>
                 {editingTemplate
                   ? isRTL ? "تعديل القالب" : "Edit Template"
                   : isRTL ? "إنشاء قالب جديد" : "Create New Template"}
               </DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
               {/* Name */}
               <div className="space-y-2">
                 <Label>{isRTL ? "اسم القالب" : "Template Name"}</Label>
                 <Input
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   placeholder={isRTL ? "مثال: قالب رسمي" : "e.g., Official Template"}
                 />
               </div>
 
               {/* Description */}
               <div className="space-y-2">
                 <Label>{isRTL ? "الوصف" : "Description"}</Label>
                 <Textarea
                   value={formData.description || ""}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   placeholder={isRTL ? "وصف مختصر للقالب" : "Brief description"}
                   rows={2}
                 />
               </div>
 
               {/* Colors */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>{isRTL ? "اللون الأساسي" : "Primary Color"}</Label>
                   <div className="flex gap-2">
                     <Input
                       type="color"
                       value={formData.primary_color}
                       onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                       className="w-12 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={formData.primary_color}
                       onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                       className="flex-1"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>{isRTL ? "اللون الثانوي" : "Secondary Color"}</Label>
                   <div className="flex gap-2">
                     <Input
                       type="color"
                       value={formData.secondary_color}
                       onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                       className="w-12 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={formData.secondary_color}
                       onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                       className="flex-1"
                     />
                   </div>
                 </div>
               </div>
 
               {/* Logo */}
               <div className="space-y-2">
                 <Label>{isRTL ? "شعار التقرير" : "Report Logo"}</Label>
                 <div className="flex items-center gap-4">
                   {formData.logo_url && (
                     <img
                       src={formData.logo_url}
                       alt="Logo"
                       className="w-16 h-16 object-contain rounded border"
                     />
                   )}
                   <Input
                     type="file"
                     accept="image/*"
                     onChange={handleLogoUpload}
                     disabled={isUploading}
                   />
                 </div>
               </div>
 
               {/* Company Name */}
               <div className="space-y-2">
                 <Label>{isRTL ? "اسم الشركة" : "Company Name"}</Label>
                 <Input
                   value={formData.company_name}
                   onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                 />
               </div>
 
               {/* Footer */}
               <div className="space-y-2">
                 <Label>{isRTL ? "نص التذييل" : "Footer Text"}</Label>
                 <Input
                   value={formData.footer_text}
                   onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                 />
               </div>
 
               {/* Preview */}
               <div className="space-y-2">
                 <Label>{isRTL ? "معاينة الرأسية" : "Header Preview"}</Label>
                 <div
                   className="rounded-lg p-4 text-white flex items-center gap-3"
                   style={{
                     background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)`,
                   }}
                 >
                   {formData.logo_url && (
                     <img src={formData.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
                   )}
                   <span className="font-bold text-lg">{formData.company_name}</span>
                 </div>
               </div>
 
               <div className="flex justify-end gap-2 pt-4">
                 <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                   {isRTL ? "إلغاء" : "Cancel"}
                 </Button>
                 <Button
                   onClick={handleSubmit}
                   disabled={createTemplate.isPending || updateTemplate.isPending}
                 >
                   {editingTemplate
                     ? isRTL ? "حفظ التعديلات" : "Save Changes"
                     : isRTL ? "إنشاء القالب" : "Create Template"}
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="text-center py-8 text-muted-foreground">
             {isRTL ? "جاري التحميل..." : "Loading..."}
           </div>
         ) : templates.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
             <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p>{isRTL ? "لا توجد قوالب محفوظة" : "No saved templates"}</p>
             <p className="text-sm">
               {isRTL
                 ? "أنشئ قالبًا جديدًا لاستخدامه في التقارير"
                 : "Create a new template to use in reports"}
             </p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {templates.map((template) => (
               <Card key={template.id} className="relative overflow-hidden">
                 {/* Color Preview Header */}
                 <div
                   className="h-16 flex items-center gap-2 px-4"
                   style={{
                     background: `linear-gradient(135deg, ${template.primary_color} 0%, ${template.secondary_color} 100%)`,
                   }}
                 >
                   {template.logo_url && (
                     <img
                       src={template.logo_url}
                       alt="Logo"
                       className="w-8 h-8 object-contain"
                     />
                   )}
                   <span className="text-white font-semibold truncate">
                     {template.company_name}
                   </span>
                 </div>
                 <CardContent className="p-4">
                   <div className="flex items-start justify-between mb-2">
                     <div>
                       <h3 className="font-semibold flex items-center gap-2">
                         {template.name}
                         {template.is_default && (
                           <Badge variant="secondary" className="text-xs">
                             <Star className="w-3 h-3 fill-current mr-1" />
                             {isRTL ? "افتراضي" : "Default"}
                           </Badge>
                         )}
                       </h3>
                       {template.description && (
                         <p className="text-sm text-muted-foreground mt-1">
                           {template.description}
                         </p>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-2 mt-4">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleOpenDialog(template)}
                     >
                       <Edit2 className="w-3 h-3" />
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleDuplicate(template)}
                     >
                       <Copy className="w-3 h-3" />
                     </Button>
                     {!template.is_default && (
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setDefaultTemplate.mutate(template.id)}
                       >
                         <Star className="w-3 h-3" />
                       </Button>
                     )}
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="outline" size="sm" className="text-destructive">
                           <Trash2 className="w-3 h-3" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>
                             {isRTL ? "حذف القالب" : "Delete Template"}
                           </AlertDialogTitle>
                           <AlertDialogDescription>
                             {isRTL
                               ? "هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء."
                               : "Are you sure you want to delete this template? This action cannot be undone."}
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>
                             {isRTL ? "إلغاء" : "Cancel"}
                           </AlertDialogCancel>
                           <AlertDialogAction
                             onClick={() => deleteTemplate.mutate(template.id)}
                             className="bg-destructive text-destructive-foreground"
                           >
                             {isRTL ? "حذف" : "Delete"}
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 };