 import { useState, useEffect } from "react";
 import { FileText, Check } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { useLanguage } from "@/contexts/LanguageContext";
 import { getAvailableTemplates } from "@/lib/pdfExport";
 import { cn } from "@/lib/utils";
 
 interface Template {
   id: string;
   name: string;
   primary_color: string;
   secondary_color: string;
   is_default: boolean;
 }
 
 interface ReportTemplateSelectorProps {
   onExport: (templateId?: string) => void;
   label?: string;
   disabled?: boolean;
 }
 
 export const ReportTemplateSelector = ({
   onExport,
   label,
   disabled,
 }: ReportTemplateSelectorProps) => {
   const { isRTL } = useLanguage();
   const [templates, setTemplates] = useState<Template[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchTemplates = async () => {
       const data = await getAvailableTemplates();
       setTemplates(data);
       setLoading(false);
     };
     fetchTemplates();
   }, []);
 
   // If no templates, just export with default settings
   if (!loading && templates.length === 0) {
     return (
       <Button
         variant="outline"
         size="sm"
         onClick={() => onExport()}
         disabled={disabled}
       >
         <FileText className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
         {label || (isRTL ? "تصدير HTML" : "Export HTML")}
       </Button>
     );
   }
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="outline" size="sm" disabled={disabled || loading}>
           <FileText className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
           {label || (isRTL ? "تصدير HTML" : "Export HTML")}
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
         <DropdownMenuLabel>
           {isRTL ? "اختر قالب التقرير" : "Select Report Template"}
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuItem onClick={() => onExport()}>
           <div className="flex items-center gap-2 w-full">
             <div
               className="w-4 h-4 rounded"
               style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}
             />
             <span className="flex-1">{isRTL ? "النمط الافتراضي" : "Default Style"}</span>
           </div>
         </DropdownMenuItem>
         {templates.map((template) => (
           <DropdownMenuItem
             key={template.id}
             onClick={() => onExport(template.id)}
           >
             <div className="flex items-center gap-2 w-full">
               <div
                 className="w-4 h-4 rounded"
                 style={{
                   background: `linear-gradient(135deg, ${template.primary_color}, ${template.secondary_color})`,
                 }}
               />
               <span className="flex-1">{template.name}</span>
               {template.is_default && (
                 <Check className="w-4 h-4 text-primary" />
               )}
             </div>
           </DropdownMenuItem>
         ))}
       </DropdownMenuContent>
     </DropdownMenu>
   );
 };