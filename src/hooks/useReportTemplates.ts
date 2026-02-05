 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 export interface ReportTemplate {
   id: string;
   name: string;
   description: string | null;
   primary_color: string;
   secondary_color: string;
   logo_url: string | null;
   company_name: string;
   footer_text: string;
   is_default: boolean;
   created_by: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export type ReportTemplateInsert = Omit<ReportTemplate, "id" | "created_at" | "updated_at" | "created_by">;
 
 export const useReportTemplates = () => {
   return useQuery({
     queryKey: ["report-templates"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("report_templates")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       return data as ReportTemplate[];
     },
   });
 };
 
 export const useDefaultTemplate = () => {
   return useQuery({
     queryKey: ["report-templates", "default"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("report_templates")
         .select("*")
         .eq("is_default", true)
         .maybeSingle();
 
       if (error) throw error;
       return data as ReportTemplate | null;
     },
   });
 };
 
 export const useCreateReportTemplate = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (template: ReportTemplateInsert) => {
       const { data: user } = await supabase.auth.getUser();
       
       const { data, error } = await supabase
         .from("report_templates")
         .insert({
           ...template,
           created_by: user.user?.id,
         })
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["report-templates"] });
       toast.success("تم حفظ القالب بنجاح");
     },
     onError: (error) => {
       console.error("Error creating template:", error);
       toast.error("فشل حفظ القالب");
     },
   });
 };
 
 export const useUpdateReportTemplate = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async ({ id, ...template }: Partial<ReportTemplate> & { id: string }) => {
       const { data, error } = await supabase
         .from("report_templates")
         .update(template)
         .eq("id", id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["report-templates"] });
       toast.success("تم تحديث القالب بنجاح");
     },
     onError: (error) => {
       console.error("Error updating template:", error);
       toast.error("فشل تحديث القالب");
     },
   });
 };
 
 export const useDeleteReportTemplate = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from("report_templates")
         .delete()
         .eq("id", id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["report-templates"] });
       toast.success("تم حذف القالب بنجاح");
     },
     onError: (error) => {
       console.error("Error deleting template:", error);
       toast.error("فشل حذف القالب");
     },
   });
 };
 
 export const useSetDefaultTemplate = () => {
   const queryClient = useQueryClient();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { data, error } = await supabase
         .from("report_templates")
         .update({ is_default: true })
         .eq("id", id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["report-templates"] });
       toast.success("تم تعيين القالب الافتراضي");
     },
     onError: (error) => {
       console.error("Error setting default template:", error);
       toast.error("فشل تعيين القالب الافتراضي");
     },
   });
 };