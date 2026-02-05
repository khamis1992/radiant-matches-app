-- Create report_templates table for saving custom report styles
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  primary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  secondary_color TEXT NOT NULL DEFAULT '#a855f7',
  logo_url TEXT,
  company_name TEXT NOT NULL DEFAULT 'Glam',
  footer_text TEXT NOT NULL DEFAULT 'جميع الحقوق محفوظة',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Policies for admin access
CREATE POLICY "Admins can view all templates"
ON public.report_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create templates"
ON public.report_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update templates"
ON public.report_templates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete templates"
ON public.report_templates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to ensure only one default template
CREATE OR REPLACE FUNCTION public.ensure_single_default_template()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.report_templates
    SET is_default = false
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for single default
CREATE TRIGGER ensure_single_default_template_trigger
BEFORE INSERT OR UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_template();

-- Trigger for updated_at
CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();