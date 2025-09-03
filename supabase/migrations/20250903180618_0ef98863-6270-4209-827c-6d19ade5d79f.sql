-- Créer le compte admin principal
-- Nous ne pouvons pas créer directement dans auth.users, mais nous pouvons préparer l'assignation du rôle admin
-- Une fois que l'utilisateur frthefury@gmail.com se connectera, on pourra lui assigner le rôle admin

-- Fonction temporaire pour assigner le rôle admin au premier utilisateur avec email spécifique
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Rechercher l'utilisateur avec l'email admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'frthefury@gmail.com'
  LIMIT 1;
  
  -- Si l'utilisateur existe, lui assigner le rôle admin
  IF admin_user_id IS NOT NULL THEN
    -- Supprimer le rôle existant s'il y en a un
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Assigner le rôle admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Approuver automatiquement sa demande de compte s'il y en a une
    UPDATE public.account_requests
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = admin_user_id
    WHERE user_id = admin_user_id AND status = 'pending';
  END IF;
END;
$$;