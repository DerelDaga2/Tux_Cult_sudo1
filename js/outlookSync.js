/**
 * SIGOD - Outlook Sync Module
 * Sincroniza correos usando Microsoft Graph y Supabase en el cliente
 */
const OutlookSync = (() => {
    // --- SUPABASE CONFIG ---
    const SUPABASE_URL = 'https://kctmikwyvpsfxbsgubjs.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_xMvwrUSzwdIEnDM-6QT0aQ_M28enOlj';
    
    let supabaseClient = null;

    function getSupabase() {
        if (!supabaseClient && window.supabase) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }

    /**
     * Inicia la sincronización de correos
     */
    async function syncMails(onProgress = console.log) {
        if (!AuthOutlook.isConnected()) {
            // Intentar silencioso
            await AuthOutlook.acquireTokenSilent();
            if (!AuthOutlook.isConnected()) {
                throw new Error("No hay conexión con Microsoft Outlook. Inicia sesión primero.");
            }
        }

        const token = AuthOutlook.getToken();
        const supabase = getSupabase();

        if (!supabase) throw new Error("Supabase no está disponible.");

        onProgress("Buscando correos recientes...");

        try {
            // 1. Obtener correos usando Graph API
            const response = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=10&$select=id,subject,bodyPreview,receivedDateTime&$orderby=receivedDateTime DESC", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Error obteniendo correos de Microsoft Graph.");
            
            const data = await response.json();
            const emails = data.value || [];

            if (emails.length === 0) {
                onProgress("No hay correos nuevos.");
                return { success: true, message: "No hay correos." };
            }

            let uploadedCount = 0;
            let skippedCount = 0;

            for (const mail of emails) {
                const subject = mail.subject || "Sin Asunto";
                const bodyPreview = mail.bodyPreview || "";
                const fullText = `${subject} ${bodyPreview}`;

                onProgress(`Analizando: ${subject}`);

                // Validar si ya existe en Supabase (evitar duplicados)
                const { data: existing } = await supabase
                    .from("tickets_emails")
                    .select("id")
                    .eq("outlook_id", mail.id)
                    .maybeSingle();

                if (existing) {
                    skippedCount++;
                    continue;
                }

                // Filtrar solo incidentes de seguridad (Opcional, según la lógica del backend original)
                // Si quieres que guarde TODOS los correos, puedes comentar esta validación:
                if (!TicketClassifier.isTicket(fullText)) {
                    // No es un ticket
                    continue;
                }

                onProgress(`Descargando EML/MSG de: ${subject}`);

                // Descargar el contenido MIME (raw email)
                const mimeResponse = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${mail.id}/$value`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!mimeResponse.ok) continue;

                const blob = await mimeResponse.blob();

                const safeSubject = subject.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
                const fileName = `${Date.now()}_${safeSubject}.msg`; // Subimos como .msg

                onProgress(`Subiendo a Supabase: ${fileName}`);

                // Subir a Supabase Storage (tickets-msg)
                const { error: uploadError } = await supabase.storage
                    .from("tickets-msg")
                    .upload(fileName, blob, {
                        contentType: "application/vnd.ms-outlook",
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Error subiendo archivo: ", uploadError);
                    continue;
                }

                // Guardar referencia en DB
                await supabase.from("tickets_emails").insert({
                    outlook_id: mail.id,
                    filename: fileName
                });

                uploadedCount++;
            }

            onProgress(`Sincronización completa: ${uploadedCount} subidos, ${skippedCount} omitidos.`);
            return { success: true, uploaded: uploadedCount, skipped: skippedCount };

        } catch (error) {
            console.error("Error de sincronización: ", error);
            throw error;
        }
    }

    return {
        syncMails
    };
})();
