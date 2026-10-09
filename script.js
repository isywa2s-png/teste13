/* =========================================================
   FANTASMAS — SISTEMA DE GERENCIAMENTO
   SCRIPT COMPLETO E ATUALIZADO (CORREÇÃO CLASSE MOBILE-OPEN)
========================================================= */

/* ---------------------------------------------------------
   1. CONFIGURAÇÕES & CONSTANTES DE REGRAS
--------------------------------------------------------- */
const CONFIG = {
    MIN_CHARS: 4,
    INTRO_FIRST_TIME: 1700,
    INTRO_SECOND_TIME: 1800,
    STORAGE_USER: "fantasmas_user",
    STORAGE_SESSION: "fantasmas_session"
};

// Mapeamento exato da Hierarquia BFE
const BFE_RANKS = [
    "〔CR〕CRIADOR",
    "〔2º CR〕SEGUNDO CRIADOR",
    "〔DN〕DONO",
    "〔CMT〕COMANDANTE",
    "〔SCMT〕SUBCOMANDANTE",
    "〔SUP-G〕SUPERVISOR GERAL",
    "〔SUP〕SUPERVISOR",
    "〔GEN〕GENERAL",
    "〔OF〕OFICIAL",
    "〔GD〕GRADUADO",
    "〔PR〕PRAÇA",
    "〔CANDT〕CANDIDATO"
];

// Mapeamento exato da Hierarquia SGB
const SGB_RANKS = [
    "@[CR] CRIADOR",
    "@[2° CR] SEGUNDO CRIADOR",
    "@[DR] DIRETOR",
    "@[MN-GR] MANAGER",
    "@[ADM] ADMINISTRADOR",
    "@[SCR] SUB CRIADOR",
    "@DONOS DO BFE",
    "@[ENC-G] ENCARREGADO GERAL",
    "@[SEC-G] SECRETARIO GERAL",
    "@[SEC-DEP] SECRETÁRIO DE DEPARTAMENTO",
    "@[CG-G] CORREGEDOR GERAL",
    "@[SGB-CG] CORREGEDOR",
    "@[SGB-CRD] COORDENADOR",
    "@[SGB-SUP] SUPERVISOR",
    "@[SGB-ANST] ANALISTA",
    "@[SGB-SÊN] SÊNIOR",
    "@[SGB-APR] APRENDIZ",
    "@[SGB-EST] ESTAGIÁRIOS"
];

// Mapeamento exato da Hierarquia JORNAL
const JORNAL_RANKS = [
    "@[CS] CHEFE SOMBRIO",
    "@[DS] DIRETOR SOMBRIO",
    "@[ES] ENCARREGADO SOMBRIO",
    "@[ED] EDITOR SOMBRIO",
    "@[OV] OBSERVADOR DO VÉU",
    "@[RS] REPÓRTER DAS SOMBRAS"
];

/* ---------------------------------------------------------
   2. ESTADO DA APLICAÇÃO & BANCO DE DADOS LOCAL
--------------------------------------------------------- */
const state = {
    currentUser: null,
    currentPage: "dashboard",
    sidebarOpen: false,

    bfe: {
        members: [],
        daily: [],
        weekly: [],
        punishments: [],
        warnings: [],
        inactivity: [],
        trainings: [],
        evaluations: []
    },
    sgb: {
        members: [],
        weekly: [],
        warnings: [],
        evaluations: []
    },
    jornal: {
        members: [],
        daily: [],
        weekly: [],
        evaluations: []
    },
    logs: []
};

/* ---------------------------------------------------------
   3. REFERÊNCIAS DOM
--------------------------------------------------------- */
const elements = {
    introScreen: document.getElementById("intro-screen"),
    introFirstMessage: document.getElementById("intro-first-message"),
    introSecondMessage: document.getElementById("intro-second-message"),

    authScreen: document.getElementById("auth-screen"),
    loginPanel: document.getElementById("login-panel"),
    registerPanel: document.getElementById("register-panel"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),

    loginUsername: document.getElementById("login-username"),
    loginPassword: document.getElementById("login-password"),
    registerUsername: document.getElementById("register-username"),
    registerPassword: document.getElementById("register-password"),
    registerConfirmPassword: document.getElementById("register-password-confirm"),

    loginMessage: document.getElementById("login-message"),
    registerMessage: document.getElementById("register-message"),
    showRegisterButton: document.getElementById("show-register"),
    showLoginButton: document.getElementById("show-login"),

    app: document.getElementById("app"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),

    mobileMenuButton: document.getElementById("mobile-menu-button"),
    mobileProfileButton: document.getElementById("mobile-profile-button"),
    logoutButton: document.getElementById("logout-button"),

    currentUsername: document.getElementById("current-user-name"),
    pageTitle: document.getElementById("page-title"),
    pageBreadcrumb: document.getElementById("page-breadcrumb"),

    toastContainer: document.getElementById("toast-container"),
    modal: document.getElementById("global-modal"),
    modalBody: document.getElementById("modal-body"),
    modalClose: document.getElementById("modal-close")
};

/* ---------------------------------------------------------
   4. INICIALIZAÇÃO
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

async function initializeApp() {
    setupIntro();
    setupAuthentication();
    setupNavigation();
    setupMobileMenu();
    setupLogout();
    setupModal();
    
    await fetchAllData();
    setupRealtimeSubscriptions();
    
    checkAutoResetDaily();
    checkAutoResetWeekly();
    setInterval(() => {
        checkAutoResetDaily();
        checkAutoResetWeekly();
    }, 60000);

    loadSavedSession();
}

/* ---------------------------------------------------------
   5. ANIMAÇÃO DE INTRO
--------------------------------------------------------- */
function setupIntro() {
    if (!elements.introScreen) {
        showAuthentication();
        return;
    }

    const firstMessage = elements.introFirstMessage;
    const secondMessage = elements.introSecondMessage;

    if (firstMessage) firstMessage.style.opacity = "1";
    if (secondMessage) {
        secondMessage.style.opacity = "0";
        secondMessage.style.display = "none";
    }

    setTimeout(() => {
        if (firstMessage) {
            firstMessage.style.transition = "opacity 900ms ease";
            firstMessage.style.opacity = "0";
        }
    }, CONFIG.INTRO_FIRST_TIME);

    setTimeout(() => {
        if (secondMessage) {
            secondMessage.style.display = "block";
            requestAnimationFrame(() => {
                secondMessage.style.opacity = "1";
            });
        }
    }, CONFIG.INTRO_FIRST_TIME + 900);

    setTimeout(() => {
        finishIntro();
    }, CONFIG.INTRO_FIRST_TIME + 900 + CONFIG.INTRO_SECOND_TIME);
}

function finishIntro() {
    if (!elements.introScreen) return;
    elements.introScreen.style.transition = "opacity 800ms ease, visibility 800ms ease";
    elements.introScreen.style.opacity = "0";
    elements.introScreen.style.visibility = "hidden";

    setTimeout(() => {
        elements.introScreen.classList.add("hidden");
        showAuthentication();
    }, 850);
}

/* ---------------------------------------------------------
   6. AUTENTICAÇÃO
--------------------------------------------------------- */
function setupAuthentication() {
    if (elements.showRegisterButton) {
        elements.showRegisterButton.addEventListener("click", showRegister);
    }
    if (elements.showLoginButton) {
        elements.showLoginButton.addEventListener("click", showLogin);
    }
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    if (elements.registerForm) {
        elements.registerForm.addEventListener("submit", handleRegister);
    }
}

function showAuthentication() {
    if (elements.authScreen) elements.authScreen.classList.remove("hidden");
    if (elements.app) elements.app.classList.add("hidden");
    showLogin();
}

function showLogin() {
    if (elements.loginPanel) elements.loginPanel.classList.remove("hidden");
    if (elements.registerPanel) elements.registerPanel.classList.add("hidden");
    clearMessage(elements.loginMessage);
    clearMessage(elements.registerMessage);
}

function showRegister() {
    if (elements.loginPanel) elements.loginPanel.classList.add("hidden");
    if (elements.registerPanel) elements.registerPanel.classList.remove("hidden");
    clearMessage(elements.loginMessage);
    clearMessage(elements.registerMessage);
}

function handleLogin(event) {
    event.preventDefault();
    const username = elements.loginUsername ? elements.loginUsername.value.trim() : "";
    const password = elements.loginPassword ? elements.loginPassword.value.trim() : "";

    clearMessage(elements.loginMessage);

    if (username.length <= 3 || password.length <= 3) {
        showMessage(elements.loginMessage, "Usuário ou senha está incorreto. Tente novamente!", "error");
        return;
    }

    const user = { username, loggedAt: new Date().toISOString() };
    state.currentUser = user;
    saveSession(user);

    showMessage(elements.loginMessage, "Login concluído com sucesso. Seja bem-vindo, Fantasmas!", "success");

    setTimeout(() => {
        openApplication();
    }, 700);
}

function handleRegister(event) {
    event.preventDefault();

    const usernameInput = elements.registerUsername;
    const passwordInput = elements.registerPassword;
    const confirmInput = elements.registerPasswordConfirm;

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";
    const confirm = confirmInput ? confirmInput.value.trim() : "";

    clearRegisterErrors();
    let valid = true;

    if (username.length < 4) {
        showFieldError("register-username-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }
    if (password.length < 4) {
        showFieldError("register-password-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }
    if (confirm.length < 4) {
        showFieldError("register-confirm-error", "Este campo é obrigatório a ter mais de 4 caracteres.");
        valid = false;
    }

    if (!valid) return;

    if (password !== confirm) {
        showFieldError("register-confirm-error", "AS SENHAS NÃO COINCIDEM.");
        return;
    }

    showMessage(elements.registerMessage, "Conta criada com sucesso!", "success");

    setTimeout(() => {
        showLogin();
        if (elements.loginUsername) elements.loginUsername.value = username;
        if (elements.loginPassword) elements.loginPassword.value = password;
    }, 900);
}

function clearRegisterErrors() {
    ["register-username-error", "register-password-error", "register-confirm-error"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function showMessage(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `form-message ${type}`;
}

function clearMessage(el) {
    if (!el) return;
    el.textContent = "";
    el.className = "form-message";
}

/* ---------------------------------------------------------
   7. NAVEGAÇÃO & PAINEL PRINCIPAL
--------------------------------------------------------- */
function checkLogsAccess() {
    if (!state.currentUser || !state.currentUser.username) return false;
    const lower = state.currentUser.username.toLowerCase();
    return lower.includes("davi") || lower.includes("ana") || lower.includes("none");
}

function updateLogsVisibility() {
    const logsBtn = document.querySelector('.menu-item[data-page="logs"]');
    const hasAccess = checkLogsAccess();
    if (logsBtn) {
        const parent = logsBtn.closest('.menu-section') || logsBtn;
        parent.style.display = hasAccess ? "" : "none";
    }
}

function openApplication() {
    if (elements.authScreen) elements.authScreen.classList.add("hidden");
    if (elements.app) elements.app.classList.remove("hidden");

    if (state.currentUser && elements.currentUsername) {
        elements.currentUsername.textContent = state.currentUser.username;
    }

    updateLogsVisibility();
    navigateToPage("dashboard");
    renderDashboardCounters();
}

function setupNavigation() {
    document.querySelectorAll("[data-page]").forEach(btn => {
        const handleNav = (e) => {
            e.preventDefault();
            const page = btn.dataset.page;
            if (!page) return;
            
            if (page === "bfe") navigateToPage("bfe-members");
            else if (page === "sgb") navigateToPage("sgb-members");
            else if (page === "jornal") navigateToPage("jornal-members");
            else navigateToPage(page);

            closeMobileMenu();
        };

        btn.addEventListener("click", handleNav);
        btn.addEventListener("touchend", handleNav);
    });
}

function navigateToPage(pageName) {
    if (pageName !== "bfe-training") {
        localStorage.removeItem("fantasmas_last_training_report");
    }

    if (pageName === "logs" && !checkLogsAccess()) {
        showToast("ACESSO NEGADO", "VOCÊ NÃO TEM PERMISSÃO PARA VISUALIZAR OS LOGS.", "error");
        pageName = "dashboard";
    }

    state.currentPage = pageName;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.classList.add("active-page");
    }

    document.querySelectorAll(".menu-item").forEach(item => {
        if (item.dataset.page === pageName) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    renderPageContent(pageName);
    updateHeaderTitles(pageName);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateHeaderTitles(pageName) {
    const titles = {
        "dashboard": { title: "PAINEL GERAL 👋", breadcrumb: "FANTASMAS / PAINEL GERAL" },
        "bfe-members": { title: "BFE - ADICIONAR MEMBRO 👥", breadcrumb: "BFE / MEMBROS" },
        "bfe-hierarchy": { title: "BFE - HIERARQUIA 👑", breadcrumb: "BFE / HIERARQUIA" },
        "bfe-daily": { title: "BFE - COTA DIÁRIA 📅", breadcrumb: "BFE / COTA DIÁRIA" },
        "bfe-weekly": { title: "BFE - COTA SEMANAL 🗓️", breadcrumb: "BFE / COTA SEMANAL" },
        "bfe-ghosts": { title: "BFE - FANTASMAS EM TESTE 👻", breadcrumb: "BFE / EM TESTE" },
        "bfe-punishments": { title: "BFE - PUNIÇÃO ⚖️", breadcrumb: "BFE / PUNIÇÃO" },
        "bfe-warnings": { title: "BFE - ADVERTÊNCIA ⚠️", breadcrumb: "BFE / ADVERTÊNCIA" },
        "bfe-inactivity": { title: "BFE - INATIVIDADE 💤", breadcrumb: "BFE / INATIVIDADE" },
        "bfe-training": { title: "BFE - TREINOS 🎯", breadcrumb: "BFE / TREINOS" },
        "bfe-evaluation": { title: "BFE - AVAL 🛡️", breadcrumb: "BFE / AVAL" },

        "sgb-members": { title: "SGB - ADICIONAR MEMBRO 👥", breadcrumb: "SGB / MEMBROS" },
        "sgb-hierarchy": { title: "SGB - HIERARQUIA 👑", breadcrumb: "SGB / HIERARQUIA" },
        "sgb-evaluation": { title: "SGB - AVAL 🛡️", breadcrumb: "SGB / AVAL" },
        "sgb-weekly": { title: "SGB - COTA SEMANAL 🗓️", breadcrumb: "SGB / COTA SEMANAL" },
        "sgb-warnings": { title: "SGB - ADVERTÊNCIA ⚠️", breadcrumb: "SGB / ADVERTÊNCIA" },

        "jornal-members": { title: "JORNAL - ADICIONAR MEMBRO 👥", breadcrumb: "JORNAL / MEMBROS" },
        "jornal-hierarchy": { title: "JORNAL - HIERARQUIA 👑", breadcrumb: "JORNAL / HIERARQUIA" },
        "jornal-daily": { title: "JORNAL - COTA DIÁRIA 📅", breadcrumb: "JORNAL / COTA DIÁRIA" },
        "jornal-weekly": { title: "JORNAL - COTA SEMANAL 🗓️", breadcrumb: "JORNAL / COTA SEMANAL" },
        "jornal-evaluation": { title: "JORNAL - AVAL 🛡️", breadcrumb: "JORNAL / AVAL" },

        "logs": { title: "LOGS DO SISTEMA 📁", breadcrumb: "FANTASMAS / LOGS" }
    };

    const current = titles[pageName] || { title: pageName.toUpperCase(), breadcrumb: "FANTASMAS" };
    if (elements.pageTitle) elements.pageTitle.textContent = current.title;
    if (elements.pageBreadcrumb) elements.pageBreadcrumb.textContent = current.breadcrumb;
}

/* ---------------------------------------------------------
   8. MENU MOBILE (3 PAUZINHOS), MODAL & SESSÃO
--------------------------------------------------------- */
function setupMobileMenu() {
    if (elements.mobileMenuButton) {
        const toggleMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            state.sidebarOpen = !state.sidebarOpen;
            
            if (state.sidebarOpen) {
                if (elements.sidebar) elements.sidebar.classList.add("mobile-open");
                if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove("hidden");
            } else {
                closeMobileMenu();
            }
        };

        elements.mobileMenuButton.addEventListener("click", toggleMenu);
        elements.mobileMenuButton.addEventListener("touchend", toggleMenu);
    }

    if (elements.sidebarOverlay) {
        const closeOverlay = (e) => {
            e.preventDefault();
            closeMobileMenu();
        };
        elements.sidebarOverlay.addEventListener("click", closeOverlay);
        elements.sidebarOverlay.addEventListener("touchend", closeOverlay);
    }
}

function closeMobileMenu() {
    state.sidebarOpen = false;
    if (elements.sidebar) elements.sidebar.classList.remove("mobile-open");
    if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add("hidden");
}

function setupLogout() {
    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", () => {
            if (confirm("DESEJA REALMENTE SAIR?")) {
                localStorage.removeItem(CONFIG.STORAGE_USER);
                localStorage.removeItem(CONFIG.STORAGE_SESSION);
                state.currentUser = null;
                showAuthentication();
            }
        });
    }
}

function setupModal() {
    if (elements.modalClose) {
        elements.modalClose.addEventListener("click", closeModal);
    }
    if (elements.modal) {
        elements.modal.addEventListener("click", (e) => {
            if (e.target === elements.modal || e.target.classList.contains("modal-overlay")) {
                closeModal();
            }
        });
    }
}

function openModal(contentHtml) {
    if (elements.modalBody) {
        elements.modalBody.innerHTML = contentHtml;
    }
    if (elements.modal) {
        elements.modal.classList.remove("hidden");
        elements.modal.setAttribute("aria-hidden", "false");
    }
}

function closeModal() {
    if (elements.modal) {
        elements.modal.classList.add("hidden");
        elements.modal.setAttribute("aria-hidden", "true");
    }
}

function showToast(title, message, type = "info") {
    if (!elements.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function saveSession(user) {
    try {
        localStorage.setItem(CONFIG.STORAGE_USER, JSON.stringify(user));
        localStorage.setItem(CONFIG.STORAGE_SESSION, "true");
    } catch (e) {
        console.error(e);
    }
}

function loadSavedSession() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_USER);
        if (saved) {
            state.currentUser = JSON.parse(saved);
        }
    } catch (e) {
        console.error(e);
    }
}

/* ---------------------------------------------------------
   9. GERENCIAMENTO DE DADOS (SUPABASE + REALTIME)
--------------------------------------------------------- */
async function fetchAllData() {
    try {
        if (window.supabaseClient) {
            const { data: bfeMemb } = await window.supabaseClient.from("bfe_members").select("*");
            if (bfeMemb) {
                state.bfe.members = bfeMemb.map(m => ({
                    id: m.id, roblox: m.roblox, discord: m.discord, rank: m.rank, inTest: m.in_test ? "SIM" : "NÃO"
                }));
            }

            const { data: sgbMemb } = await window.supabaseClient.from("sgb_members").select("*");
            if (sgbMemb) {
                state.sgb.members = sgbMemb.map(m => ({
                    id: m.id, roblox: m.roblox, discord: m.discord, rank: m.rank, inTest: "NÃO"
                }));
            }

            const { data: jorMemb } = await window.supabaseClient.from("jornal_members").select("*");
            if (jorMemb) {
                state.jornal.members = jorMemb.map(m => ({
                    id: m.id, roblox: m.roblox, discord: m.discord, rank: m.rank, inTest: "NÃO"
                }));
            }

            const { data: evalsData } = await window.supabaseClient.from("evaluations").select("*");
            if (evalsData) {
                state.bfe.evaluations = evalsData.filter(e => e.divisao === "BFE").map(e => ({ roblox: e.roblox, startDate: e.start_date, endDate: e.end_date }));
                state.sgb.evaluations = evalsData.filter(e => e.divisao === "SGB").map(e => ({ roblox: e.roblox, startDate: e.start_date, endDate: e.end_date }));
                state.jornal.evaluations = evalsData.filter(e => e.divisao === "JORNAL").map(e => ({ roblox: e.roblox, startDate: e.start_date, endDate: e.end_date }));
            }

            const { data: logsData } = await window.supabaseClient.from("system_logs").select("*").order("created_at", { ascending: false });
            if (logsData) {
                state.logs = logsData.map(l => ({
                    id: l.id, user: l.usuario, action: l.acao, timestamp: new Date(l.created_at).toLocaleString("pt-BR")
                }));
            }

            loadLocalData();
            renderDashboardCounters();
            renderPageContent(state.currentPage);
        } else {
            loadLocalData();
        }
    } catch (err) {
        console.warn("Supabase indisponível, usando armazenamento local.", err);
        loadLocalData();
    }
}

function setupRealtimeSubscriptions() {
    if (!window.supabaseClient) return;

    const tables = ['bfe_members', 'sgb_members', 'jornal_members', 'cotas_diarias', 'cotas_semanais', 'system_logs', 'evaluations'];

    tables.forEach(tableName => {
        window.supabaseClient
            .channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, () => {
                fetchAllData();
            })
            .subscribe();
    });
}

function loadLocalData() {
    const local = localStorage.getItem("fantasmas_db");
    if (local) {
        const parsed = JSON.parse(local);
        if (!window.supabaseClient) {
            state.bfe.members = parsed.bfe?.members || [];
            state.sgb.members = parsed.sgb?.members || [];
            state.jornal.members = parsed.jornal?.members || [];
            state.logs = parsed.logs || [];
        }
        state.bfe.daily = parsed.bfe?.daily || [];
        state.bfe.weekly = parsed.bfe?.weekly || [];
        state.bfe.punishments = parsed.bfe?.punishments || [];
        state.bfe.warnings = parsed.bfe?.warnings || [];
        state.bfe.inactivity = parsed.bfe?.inactivity || [];
        state.bfe.trainings = parsed.bfe?.trainings || [];
        state.bfe.evaluations = parsed.bfe?.evaluations || [];

        state.sgb.weekly = parsed.sgb?.weekly || [];
        state.sgb.warnings = parsed.sgb?.warnings || [];
        state.sgb.evaluations = parsed.sgb?.evaluations || [];

        state.jornal.daily = parsed.jornal?.daily || [];
        state.jornal.weekly = parsed.jornal?.weekly || [];
        state.jornal.evaluations = parsed.jornal?.evaluations || [];
    }
}

function saveLocalData() {
    localStorage.setItem("fantasmas_db", JSON.stringify({
        bfe: state.bfe,
        sgb: state.sgb,
        jornal: state.jornal,
        logs: state.logs
    }));
    renderDashboardCounters();
}

async function addLog(action) {
    const user = state.currentUser ? state.currentUser.username : "SISTEMA";
    const act = action;
    const log = {
        id: Date.now(),
        user,
        action: act,
        timestamp: new Date().toLocaleString("pt-BR")
    };
    state.logs.unshift(log);
    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("system_logs").insert([{
            usuario: user,
            acao: act
        }]);
    }
}

function renderDashboardCounters() {
    const bfeCount = document.getElementById("bfe-member-count");
    const sgbCount = document.getElementById("sgb-member-count");
    const jorCount = document.getElementById("jornal-member-count");

    if (bfeCount) bfeCount.textContent = state.bfe.members.length;
    if (sgbCount) sgbCount.textContent = state.sgb.members.length;
    if (jorCount) jorCount.textContent = state.jornal.members.length;
}

/* ---------------------------------------------------------
   10. RESET AUTOMÁTICO DE COTA DIÁRIA (08:00 BRASÍLIA) E SEMANAL (DOMINGO 10:00)
--------------------------------------------------------- */
function getBrasiliaDate() {
    const now = new Date();
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const brasiliaStr = new Intl.DateTimeFormat('en-CA', options).format(now);
    const parts = brasiliaStr.split(' ');
    return {
        ymd: parts[0],
        time: parts[1],
        fullDate: new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    };
}

function checkAutoResetDaily() {
    const lastReset = localStorage.getItem("fantasmas_last_daily_reset");
    const { ymd, fullDate } = getBrasiliaDate();
    const todayEightAM = new Date(`${ymd}T08:00:00-03:00`);

    if (fullDate >= todayEightAM) {
        if (!lastReset || new Date(lastReset) < todayEightAM) {
            resetDailyQuotaData();
            localStorage.setItem("fantasmas_last_daily_reset", fullDate.toISOString());
        }
    }
}

function resetDailyQuotaData() {
    state.bfe.daily = state.bfe.daily.map(item => ({ ...item, inputVal: "0", result: "COTA DIÁRIA NÃO REALIZADA", punished: "SIM" }));
    state.jornal.daily = state.jornal.daily.map(item => ({ ...item, inputVal: "0", result: "COTA DIÁRIA NÃO REALIZADA" }));
    saveLocalData();
    addLog("RESET AUTOMÁTICO DAS COTAS DIÁRIAS EXECUTADO ÀS 08:00 (HORÁRIO DE BRASÍLIA).");
}

function checkAutoResetWeekly() {
    const lastReset = localStorage.getItem("fantasmas_last_weekly_reset");
    const { ymd, fullDate } = getBrasiliaDate();
    
    if (fullDate.getDay() === 0) { // Domingo
        const todayTenAM = new Date(`${ymd}T10:00:00-03:00`);
        if (fullDate >= todayTenAM) {
            if (!lastReset || new Date(lastReset) < todayTenAM) {
                resetWeeklyQuotaData();
                localStorage.setItem("fantasmas_last_weekly_reset", fullDate.toISOString());
            }
        }
    }
}

function resetWeeklyQuotaData() {
    state.bfe.weekly = state.bfe.weekly.map(item => ({ ...item, inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" }));
    state.sgb.weekly = state.sgb.weekly.map(item => ({ ...item, inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" }));
    state.jornal.weekly = state.jornal.weekly.map(item => ({ ...item, inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" }));
    saveLocalData();
    addLog("RESET AUTOMÁTICO DAS COTAS SEMANAIS EXECUTADO DOMINGO ÀS 10:00 (HORÁRIO DE BRASÍLIA).");
}

/* ---------------------------------------------------------
   11. RENDERIZAÇÃO DAS PÁGINAS
--------------------------------------------------------- */
function renderPageContent(pageName) {
    const container = document.getElementById(`page-${pageName}`);
    if (!container) return;

    switch (pageName) {
        case "dashboard":
            renderDashboardCounters();
            break;

        case "bfe-members":
            renderAddMemberPage(container, "BFE", BFE_RANKS, state.bfe.members, addBfeMember, deleteBfeMember);
            break;
        case "bfe-hierarchy":
            renderHierarchyPage(container, "BFE", BFE_RANKS, state.bfe.members);
            break;
        case "bfe-daily":
            renderBfeDailyPage(container);
            break;
        case "bfe-weekly":
            renderBfeWeeklyPage(container);
            break;
        case "bfe-ghosts":
            renderBfeGhostsPage(container);
            break;
        case "bfe-punishments":
            renderBfePunishmentsPage(container);
            break;
        case "bfe-warnings":
            renderBfeWarningsPage(container);
            break;
        case "bfe-inactivity":
            renderBfeInactivityPage(container);
            break;
        case "bfe-training":
            renderBfeTrainingPage(container);
            break;
        case "bfe-evaluation":
            renderEvaluationPage(container, "BFE", state.bfe.evaluations, saveBfeEval);
            break;

        case "sgb-members":
            renderAddMemberPage(container, "SGB", SGB_RANKS, state.sgb.members, addSgbMember, deleteSgbMember);
            break;
        case "sgb-hierarchy":
            renderHierarchyPage(container, "SGB", SGB_RANKS, state.sgb.members);
            break;
        case "sgb-evaluation":
            renderEvaluationPage(container, "SGB", state.sgb.evaluations, saveSgbEval);
            break;
        case "sgb-weekly":
            renderSgbWeeklyPage(container);
            break;
        case "sgb-warnings":
            renderSgbWarningsPage(container);
            break;

        case "jornal-members":
            renderAddMemberPage(container, "JORNAL", JORNAL_RANKS, state.jornal.members, addJornalMember, deleteJornalMember);
            break;
        case "jornal-hierarchy":
            renderHierarchyPage(container, "JORNAL", JORNAL_RANKS, state.jornal.members);
            break;
        case "jornal-daily":
            renderJornalDailyPage(container);
            break;
        case "jornal-weekly":
            renderJornalWeeklyPage(container);
            break;
        case "jornal-evaluation":
            renderEvaluationPage(container, "JORNAL", state.jornal.evaluations, saveJornalEval);
            break;

        case "logs":
            renderLogsPage(container);
            break;
    }
}

/* ---------------------------------------------------------
   12. PÁGINAS COMPARTILHADAS (MEMBROS)
--------------------------------------------------------- */
function renderAddMemberPage(container, dept, ranks, memberList, addFn, deleteFn) {
    const isBfe = dept === "BFE";
    
    container.innerHTML = `
        <div class="card-panel">
            <h2>ADICIONAR MEMBRO - ${dept} 👥</h2>
            <form id="form-add-member" class="styled-form">
                <div class="form-group">
                    <label>NOME ROBLOX:</label>
                    <input type="text" id="mb-roblox" placeholder="DIGITE O NICK NO ROBLOX" required>
                </div>
                <div class="form-group">
                    <label>NOME DISCORD:</label>
                    <input type="text" id="mb-discord" placeholder="DIGITE O USUÁRIO DO DISCORD" required>
                </div>
                <div class="form-group">
                    <label>PATENTE:</label>
                    <select id="mb-rank" required>
                        ${ranks.map(r => `<option value="${r}">${r}</option>`).join("")}
                    </select>
                </div>
                ${isBfe ? `
                <div class="form-group">
                    <label>FANTASMA EM TESTE?:</label>
                    <select id="mb-test">
                        <option value="NÃO">NÃO</option>
                        <option value="SIM">SIM</option>
                    </select>
                </div>` : ""}
                <button type="submit" class="main-button">ADICIONAR MEMBRO</button>
            </form>

            <div class="divider" style="margin: 20px 0;"></div>

            <h3>MEMBROS CADASTRADOS (${memberList.length})</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DISCORD</th>
                            <th>PATENTE</th>
                            ${isBfe ? "<th>EM TESTE</th>" : ""}
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${memberList.length === 0 ? `<tr><td colspan="${isBfe ? 5 : 4}">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        memberList.map((m, idx) => `
                            <tr>
                                <td><strong>${m.roblox}</strong></td>
                                <td>${m.discord}</td>
                                <td><span class="rank-tag">${m.rank}</span></td>${isBfe ? `<td>${m.inTest === "SIM" ? "👻 SIM" : "NÃO"}</td>` : ""}
                                <td>
                                    <button class="action-btn delete-btn" onclick="${deleteFn.name}(${idx})">EXCLUIR</button>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById("form-add-member").addEventListener("submit", (e) => {
        e.preventDefault();
        const roblox = document.getElementById("mb-roblox").value.trim();
        const discord = document.getElementById("mb-discord").value.trim();
        const rank = document.getElementById("mb-rank").value;
        const inTest = isBfe ? document.getElementById("mb-test").value : "NÃO";

        addFn({ id: Date.now(), roblox, discord, rank, inTest });
    });
}

async function addBfeMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("bfe_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank,
            in_test: member.inTest === "SIM"
        }]).select();

        if (error) {
            showToast("ERRO", "NÃO FOI POSSÍVEL SALVAR NO BANCO.", "error");
            return;
        }
        if (data && data[0]) member.id = data[0].id;
    }

    state.bfe.members.push(member);
    saveLocalData();
    await addLog(`ADICIONOU MEMBRO BFE: ${member.roblox}`);
    showToast("SUCESSO", "MEMBRO ADICIONADO AO BFE!", "success");
    navigateToPage("bfe-members");
}

async function deleteBfeMember(idx) {
    const removed = state.bfe.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        await window.supabaseClient.from("bfe_members").delete().eq("id", removed.id);
    }
    state.bfe.members.splice(idx, 1);
    saveLocalData();
    await addLog(`REMOVEU MEMBRO BFE: ${removed?.roblox}`);
    navigateToPage("bfe-members");
}

async function addSgbMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("sgb_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank
        }]).select();

        if (error) {
            showToast("ERRO", "NÃO FOI POSSÍVEL SALVAR NO BANCO.", "error");
            return;
        }
        if (data && data[0]) member.id = data[0].id;
    }

    state.sgb.members.push(member);
    saveLocalData();
    await addLog(`ADICIONOU MEMBRO SGB: ${member.roblox}`);
    showToast("SUCESSO", "MEMBRO ADICIONADO À SGB!", "success");
    navigateToPage("sgb-members");
}

async function deleteSgbMember(idx) {
    const removed = state.sgb.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        await window.supabaseClient.from("sgb_members").delete().eq("id", removed.id);
    }
    state.sgb.members.splice(idx, 1);
    saveLocalData();
    await addLog(`REMOVEU MEMBRO SGB: ${removed?.roblox}`);
    navigateToPage("sgb-members");
}

async function addJornalMember(member) {
    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from("jornal_members").insert([{
            roblox: member.roblox,
            discord: member.discord,
            rank: member.rank
        }]).select();

        if (error) {
            showToast("ERRO", "NÃO FOI POSSÍVEL SALVAR NO BANCO.", "error");
            return;
        }
        if (data && data[0]) member.id = data[0].id;
    }

    state.jornal.members.push(member);
    saveLocalData();
    await addLog(`ADICIONOU MEMBRO JORNAL: ${member.roblox}`);
    showToast("SUCESSO", "MEMBRO ADICIONADO AO JORNAL!", "success");
    navigateToPage("jornal-members");
}

async function deleteJornalMember(idx) {
    const removed = state.jornal.members[idx];
    if (removed && window.supabaseClient && removed.id) {
        await window.supabaseClient.from("jornal_members").delete().eq("id", removed.id);
    }
    state.jornal.members.splice(idx, 1);
    saveLocalData();
    await addLog(`REMOVEU MEMBRO JORNAL: ${removed?.roblox}`);
    navigateToPage("jornal-members");
}

/* ---------------------------------------------------------
   13. HIERARQUIA COM PALETA PRETO / VERMELHO ESCURO / BRANCO
--------------------------------------------------------- */
function renderHierarchyPage(container, dept, ranks, members) {
    container.innerHTML = `
        <div class="card-panel">
            <h2>HIERARQUIA DA CATEGORIA ${dept} 👑</h2>
            <div class="hierarchy-container" style="display: flex; flex-direction: column; gap: 20px;">
                ${ranks.map(rank => {
                    const assigned = members.filter(m => m.rank === rank);
                    return `
                        <div class="hierarchy-group" style="background: #0d0d0d; padding: 15px; border-radius: var(--radius-md); border: 1px solid #3a171b; margin-bottom: 10px;">
                            <div class="rank-header" style="font-weight: 800; font-size: 13px; margin-bottom: 10px; color: #ffffff; background: #8b101b; padding: 8px 12px; border-radius: 6px; text-transform: uppercase;">${rank}</div>
                            <div class="rank-members" style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${assigned.length === 0 ? `<span class="empty-rank" style="color: #888888;">NENHUM MEMBRO NESSA PATENTE</span>` : 
                                assigned.map(m => `<div class="rank-user" style="background: #111111; color: #ffffff; padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid #292929; text-transform: uppercase;">👤 ${m.roblox}</div>`).join("")}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

/* ---------------------------------------------------------
   14. BFE - COTA DIÁRIA (REGRAS EXATAS DE HORAS / TAFS)
--------------------------------------------------------- */
function renderBfeDailyPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - COTA DIÁRIA 📅</h2>
            <p class="muted">RESET DIÁRIO ÀS 08:00 (HORÁRIO DE BRASÍLIA). NÚMERO 0 = COTA NÃO CONCLUÍDA.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>REALIZADO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const data = state.bfe.daily.find(d => d.roblox === m.roblox) || {
                                result: "COTA DIÁRIA NÃO REALIZADA",
                                inputVal: "0"
                            };
                            const isOk = data.result && data.result.includes("CONCLUÍDA");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${data.inputVal !== undefined ? data.inputVal : '0'}</td>
                                    <td><span class="${isOk ? 'status-ok' : 'status-danger'}">${isOk ? "COTA DIÁRIA CONCLUÍDA" : "Cota diária não concluída"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeDaily('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeDaily(roblox) {
    const member = state.bfe.members.find(m => m.roblox === roblox);
    const data = state.bfe.daily.find(d => d.roblox === roblox) || {};

    openModal(`
        <h3>EDITAR COTA DIÁRIA BFE - ${roblox}</h3>
        <p><strong>PATENTE:</strong> ${member ? member.rank : ''}</p>
        <div class="form-group">
            <label>VALOR REALIZADO (EX: 0, 1H30M, 1.5H, 3 TAFS):</label>
            <input type="text" id="bfe-d-val" value="${data.inputVal !== undefined ? data.inputVal : '0'}" placeholder="EX: 0 OU 1H30M" oninput="autoCalcBfeDaily('${member ? member.rank : ''}')">
        </div>
        <div class="form-group">
            <label>STATUS:</label>
            <select id="bfe-d-res">
                <option value="COTA DIÁRIA CONCLUÍDA" ${data.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA DIÁRIA CONCLUÍDA</option>
                <option value="COTA DIÁRIA NÃO REALIZADA" ${!data.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA DIÁRIA NÃO REALIZADA</option>
            </select>
        </div>
        <button class="main-button" onclick="saveBfeDaily('${roblox}')">SALVAR</button>
    `);
}

function autoCalcBfeDaily(rank) {
    const valField = document.getElementById("bfe-d-val");
    const resSelect = document.getElementById("bfe-d-res");
    if (!valField || !resSelect) return;

    const val = valField.value.toLowerCase().trim();

    if (val === "" || val === "0" || val === "0h" || val === "0 tafs") {
        resSelect.value = "COTA DIÁRIA NÃO REALIZADA";
        return;
    }

    let isComplete = false;
    const num = parseFloat(val) || 0;

    if (rank.includes("CANDT")) {
        if (num >= 1.5 || val.includes("1h30") || val.includes("90")) isComplete = true;
    } else if (rank.includes("PR") || rank.includes("GD")) {
        if (num >= 1 || val.includes("1h") || val.includes("60")) isComplete = true;
    } else if (rank.includes("OF")) {
        if (num >= 3 || val.includes("3 taf") || val.includes("30m")) isComplete = true;
    } else if (rank.includes("GEN")) {
        if (num >= 2 || val.includes("2 taf") || val.includes("30m")) isComplete = true;
    } else if (rank.includes("SUP")) {
        if (num >= 1 || val.includes("1 taf") || val.includes("30m")) isComplete = true;
    }

    resSelect.value = isComplete ? "COTA DIÁRIA CONCLUÍDA" : "COTA DIÁRIA NÃO REALIZADA";
}

async function saveBfeDaily(roblox) {
    const inputVal = document.getElementById("bfe-d-val").value;
    const result = document.getElementById("bfe-d-res").value;

    const idx = state.bfe.daily.findIndex(d => d.roblox === roblox);
    const record = { roblox, inputVal, result };

    if (idx >= 0) state.bfe.daily[idx] = record;
    else state.bfe.daily.push(record);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_diarias").insert([{
            roblox,
            divisao: "BFE",
            status: result
        }]);
    }

    closeModal();
    navigateToPage("bfe-daily");
    showToast("SALVO", "COTA DIÁRIA ATUALIZADA!", "success");
}

/* ---------------------------------------------------------
   15. BFE - COTA SEMANAL (REGRAS EXATAS DE HORAS / TAFS)
--------------------------------------------------------- */
function renderBfeWeeklyPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - COTA SEMANAL 🗓️</h2>
            <p class="muted">RESET SEMANAL DOMINGO ÀS 10:00 (HORÁRIO DE BRASÍLIA). NÚMERO 0 = COTA NÃO CONCLUÍDA.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>VALOR REALIZADO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const w = state.bfe.weekly.find(x => x.roblox === m.roblox) || { inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" };
                            const ok = w.result && w.result.includes("CONCLUÍDA");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.inputVal !== undefined ? w.inputVal : '0'}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-danger'}">${ok ? "COTA SEMANAL CONCLUÍDA" : "Cota Semanal não está concluída!"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeWeekly('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeWeekly(roblox) {
    const member = state.bfe.members.find(m => m.roblox === roblox);
    const w = state.bfe.weekly.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA SEMANAL BFE - ${roblox}</h3>
        <p><strong>PATENTE:</strong> ${member ? member.rank : ''}</p>
        <div class="form-group">
            <label>VALOR REALIZADO (EX: 0, 10H, 11 TAFS, 7H):</label>
            <input type="text" id="bfe-w-val" value="${w.inputVal !== undefined ? w.inputVal : '0'}" placeholder="EX: 0, 10H OU 11 TAFS" oninput="autoCalcBfeWeekly('${member ? member.rank : ''}')">
        </div>
        <div class="form-group">
            <label>STATUS:</label>
            <select id="bfe-w-res">
                <option value="COTA SEMANAL CONCLUÍDA" ${w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL CONCLUÍDA</option>
                <option value="COTA SEMANAL NÃO REALIZADA" ${!w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL NÃO REALIZADA</option>
            </select>
        </div>
        <button class="main-button" onclick="saveBfeWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcBfeWeekly(rank) {
    const valField = document.getElementById("bfe-w-val");
    const resSelect = document.getElementById("bfe-w-res");
    if (!valField || !resSelect) return;

    const val = valField.value.toLowerCase().trim();

    if (val === "" || val === "0" || val === "0h") {
        resSelect.value = "COTA SEMANAL NÃO REALIZADA";
        return;
    }

    let isComplete = false;
    const num = parseFloat(val) || 0;

    if (rank.includes("CANDT")) {
        if (num >= 10 || val.includes("10h")) isComplete = true;
    } else if (rank.includes("PR")) {
        if (num >= 9 || val.includes("9h")) isComplete = true;
    } else if (rank.includes("GD")) {
        if (num >= 8 || val.includes("8h")) isComplete = true;
    } else if (rank.includes("OF")) {
        if (num >= 11 || val.includes("11 taf") || num >= 7 || val.includes("7h")) isComplete = true;
    } else if (rank.includes("GEN")) {
        if (num >= 8 || val.includes("8 taf") || num >= 6 || val.includes("6h")) isComplete = true;
    } else if (rank.includes("SUP")) {
        if (num >= 6 || val.includes("6 taf") || num >= 5 || val.includes("5h")) isComplete = true;
    }

    resSelect.value = isComplete ? "COTA SEMANAL CONCLUÍDA" : "COTA SEMANAL NÃO REALIZADA";
}

async function saveBfeWeekly(roblox) {
    const inputVal = document.getElementById("bfe-w-val").value;
    const result = document.getElementById("bfe-w-res").value;

    const idx = state.bfe.weekly.findIndex(x => x.roblox === roblox);
    const rec = { roblox, inputVal, result };

    if (idx >= 0) state.bfe.weekly[idx] = rec;
    else state.bfe.weekly.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "BFE",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("bfe-weekly");
    showToast("SUCESSO", "COTA SEMANAL SALVA!", "success");
}

/* ---------------------------------------------------------
   16. BFE - FANTASMAS EM TESTE
--------------------------------------------------------- */
function renderBfeGhostsPage(container) {
    const ghosts = state.bfe.members.filter(m => m.inTest === "SIM");

    container.innerHTML = `
        <div class="card-panel">
            <h2>FANTASMAS EM TESTE 👻</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DISCORD</th>
                            <th>PATENTE</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ghosts.length === 0 ? `<tr><td colspan="4">NENHUM FANTASMA EM TESTE NO MOMENTO.</td></tr>` : 
                        ghosts.map(g => `
                            <tr>
                                <td><strong>${g.roblox}</strong></td>
                                <td>${g.discord}</td>
                                <td>${g.rank}</td>
                                <td><button class="action-btn edit-btn" onclick="finishGhostTest('${g.roblox}')">✅ FINALIZAR AULA (REMOVER DE TESTE)</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function finishGhostTest(roblox) {
    const m = state.bfe.members.find(x => x.roblox === roblox);
    if (m) {
        if (window.supabaseClient && m.id) {
            await window.supabaseClient.from("bfe_members").update({ in_test: false }).eq("id", m.id);
        }
        m.inTest = "NÃO";
        saveLocalData();
        await addLog(`CONCLUIU AULA DO FANTASMA EM TESTE: ${roblox}`);
        showToast("SUCESSO", "STATUS ALTERADO PARA NÃO!", "success");
        navigateToPage("bfe-ghosts");
    }
}

/* ---------------------------------------------------------
   17. BFE - PUNIÇÃO COM BOTÃO DE "PUNIÇÃO PAGA!"
--------------------------------------------------------- */
function renderBfePunishmentsPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - PUNIÇÃO ⚖️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PUNIÇÃO?</th>
                            <th>QUANTIDADE</th>
                            <th>PRAZO</th>
                            <th>AÇÕES RÁPIDAS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const p = state.bfe.punishments.find(x => x.roblox === m.roblox) || { active: "NÃO", qty: "0", limit: "-" };
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${p.active === "SIM" ? "⚠️ SIM" : "NÃO"}</td>
                                    <td>${p.qty || 0}</td>
                                    <td>${p.limit || "-"}</td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="action-btn edit-btn" onclick="openEditBfePunishment('${m.roblox}')">✏️ EDITAR</button>
                                            <button class="action-btn" style="background: #35c978; color: #000; font-weight: 800;" onclick="resetPunishmentPaid('${m.roblox}')">⚡ PUNIÇÃO PAGA!</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function resetPunishmentPaid(roblox) {
    if (confirm(`DESEJA ZERAR TODAS AS PUNIÇÕES DE ${roblox} COMO "PUNIÇÃO PAGA!"?`)) {
        const idx = state.bfe.punishments.findIndex(x => x.roblox === roblox);
        const rec = { roblox, active: "NÃO", qty: "0", limitRaw: "", limit: "-" };
        if (idx >= 0) state.bfe.punishments[idx] = rec;
        else state.bfe.punishments.push(rec);

        saveLocalData();
        await addLog(`REGISTRADO PUNIÇÃO PAGA PARA: ${roblox}`);
        showToast("PUNIÇÃO PAGA", `Punições de ${roblox} zeradas com sucesso!`, "success");
        navigateToPage("bfe-punishments");
    }
}

function openEditBfePunishment(roblox) {
    const p = state.bfe.punishments.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>GERENCIAR PUNIÇÃO - ${roblox}</h3>
        <div class="form-group">
            <label>PUNIÇÃO?:</label>
            <select id="pun-active">
                <option value="NÃO" ${p.active === "NÃO" ? "selected" : ""}>NÃO</option>
                <option value="SIM" ${p.active === "SIM" ? "selected" : ""}>SIM</option>
            </select>
        </div>
        <div class="form-group">
            <label>QUANTIDADE (PERMITE 0):</label>
            <input type="number" id="pun-qty" value="${p.qty !== undefined ? p.qty : 0}" min="0">
        </div>
        <div class="form-group">
            <label>TEM ATÉ QUE DIA E HORA PARA PAGAR:</label>
            <input type="datetime-local" id="pun-limit" value="${p.limitRaw || ''}">
        </div>
        <button class="main-button" onclick="saveBfePunishment('${roblox}')">SALVAR PUNIÇÃO</button>
    `);
}

function saveBfePunishment(roblox) {
    const active = document.getElementById("pun-active").value;
    const qty = document.getElementById("pun-qty").value;
    const limitRaw = document.getElementById("pun-limit").value;
    const limit = limitRaw ? new Date(limitRaw).toLocaleString("pt-BR") : "-";

    const idx = state.bfe.punishments.findIndex(x => x.roblox === roblox);
    const rec = { roblox, active, qty, limitRaw, limit };

    if (idx >= 0) state.bfe.punishments[idx] = rec;
    else state.bfe.punishments.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-punishments");
}

/* ---------------------------------------------------------
   18. OUTRAS PÁGINAS BFE (ADVERTÊNCIA, INATIVIDADE, TREINOS)
--------------------------------------------------------- */
function renderBfeWarningsPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - ADVERTÊNCIA ⚠️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>ADVERTÊNCIAS (0 ACEITÁVEL)</th>
                            <th>AÇÃO RECOMENDADA</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const w = state.bfe.warnings.find(x => x.roblox === m.roblox) || { active: "NÃO", qty: "0" };
                            const qty = parseInt(w.qty || "0");
                            const isLowRank = m.rank.includes("CANDT") || m.rank.includes("PR");
                            
                            let actionMsg = "-";
                            if (qty >= 2) {
                                actionMsg = isLowRank ? "🚨 EXÍLIO" : "📉 REBAIXAMENTO";
                            }

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.active === "SIM" ? qty : 0}</td>
                                    <td><span class="status-danger"><strong>${actionMsg}</strong></span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditBfeWarning('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditBfeWarning(roblox) {
    const w = state.bfe.warnings.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>ADVERTÊNCIA - ${roblox}</h3>
        <div class="form-group">
            <label>ADVERTÊNCIA?:</label>
            <select id="warn-active">
                <option value="NÃO" ${w.active === "NÃO" ? "selected" : ""}>NÃO</option>
                <option value="SIM" ${w.active === "SIM" ? "selected" : ""}>SIM</option>
            </select>
        </div>
        <div class="form-group">
            <label>QUANTIDADE (0 A 3):</label>
            <select id="warn-qty">
                <option value="0" ${w.qty == 0 ? "selected" : ""}>0</option>
                <option value="1" ${w.qty == 1 ? "selected" : ""}>1</option>
                <option value="2" ${w.qty == 2 ? "selected" : ""}>2</option>
                <option value="3" ${w.qty == 3 ? "selected" : ""}>3</option>
            </select>
        </div>
        <button class="main-button" onclick="saveBfeWarning('${roblox}')">SALVAR ADVERTÊNCIA</button>
    `);
}

function saveBfeWarning(roblox) {
    const active = document.getElementById("warn-active").value;
    const qty = document.getElementById("warn-qty").value;

    const idx = state.bfe.warnings.findIndex(x => x.roblox === roblox);
    const rec = { roblox, active, qty };

    if (idx >= 0) state.bfe.warnings[idx] = rec;
    else state.bfe.warnings.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-warnings");
}

function renderBfeInactivityPage(container) {
    const members = state.bfe.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>BFE - INATIVIDADE 💤</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>DIAS OFF</th>
                            <th>CONSEQUÊNCIA</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="4">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const inat = state.bfe.inactivity.find(x => x.roblox === m.roblox) || { days: 0 };
                            const d = parseInt(inat.days || 0);

                            let msg = "NORMAL";
                            if (d >= 7) msg = "🚨 EXÍLIO";
                            else if (d >= 5) msg = "⚠️ ADVERTÊNCIA";
                            else if (d >= 2) msg = "💰 700 JJS";

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${d} DIA(S)</td>
                                    <td><span class="${d >= 2 ? 'status-danger' : 'status-ok'}">${msg}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditInactivity('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditInactivity(roblox) {
    const inat = state.bfe.inactivity.find(x => x.roblox === roblox) || { days: 0 };

    openModal(`
        <h3>INATIVIDADE - ${roblox}</h3>
        <div class="form-group">
            <label>DIAS OFF (PERMITE 0):</label>
            <input type="number" id="inat-days" min="0" max="30" value="${inat.days}">
        </div>
        <button class="main-button" onclick="saveInactivity('${roblox}')">SALVAR</button>
    `);
}

function saveInactivity(roblox) {
    const days = document.getElementById("inat-days").value;
    const idx = state.bfe.inactivity.findIndex(x => x.roblox === roblox);
    const rec = { roblox, days };

    if (idx >= 0) state.bfe.inactivity[idx] = rec;
    else state.bfe.inactivity.push(rec);

    saveLocalData();
    closeModal();
    navigateToPage("bfe-inactivity");
}

function renderBfeTrainingPage(container) {
    const savedReport = localStorage.getItem("fantasmas_last_training_report");

    container.innerHTML = `
        <div class="card-panel" style="margin-bottom: 25px;">
            <h2>BFE - REGISTRO DE TREINOS 🎯</h2>
            <form id="form-training" class="styled-form" onsubmit="event.preventDefault(); generateTrainingReport();">
                <div class="form-group">
                    <label>TIPO DE TREINO:</label>
                    <select id="tr-type">
                        <option value="OPERAÇÃO">OPERAÇÃO</option>
                        <option value="PATRULHAMENTO GERAL">PATRULHAMENTO GERAL</option>
                        <option value="TREINO PVP">TREINO PVP</option>
                        <option value="TREINO PARKUOR">TREINO PARKUOR</option>
                        <option value="RANQUEADO">RANQUEADO</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>QUEM ESTAVA NO TREINAMENTO (NICKS SEPARADOS POR VÍRGULA):</label>
                    <input type="text" id="tr-present" placeholder="EX: DAVI6796, 1DAVIZXX">
                </div>
                <div class="form-group">
                    <label>QUEM ESTAVA DE AVAL:</label>
                    <input type="text" id="tr-aval" placeholder="EX: KOEE_ANNAA">
                </div>
                <div class="form-group">
                    <label>QUEM JUSTIFICOU:</label>
                    <input type="text" id="tr-justified" placeholder="EX: PÃO BATATA">
                </div>
                <button type="submit" class="main-button">GERAR RELATÓRIO DE TREINO</button>
            </form>

            <div id="training-report" class="report-box ${savedReport ? '' : 'hidden'}" style="margin-top: 20px; padding: 15px; border-radius: var(--radius-md); background: rgba(0,0,0,0.5); border: 1px solid var(--border);">
                ${savedReport || ''}
            </div>
        </div>
    `;
}

async function generateTrainingReport() {
    const type = document.getElementById("tr-type").value;
    const presentList = document.getElementById("tr-present").value.split(",").map(x => x.trim()).filter(x => x);
    const avalList = document.getElementById("tr-aval").value.split(",").map(x => x.trim()).filter(x => x);
    const justList = document.getElementById("tr-justified").value.split(",").map(x => x.trim()).filter(x => x);

    const absentList = state.bfe.members.filter(m => {
        const nick = m.roblox;
        return !presentList.includes(nick) && !avalList.includes(nick) && !justList.includes(nick);
    }).map(m => m.roblox);

    const reportHtml = `
        <h3>RELATÓRIO DE TREINAMENTO (${type})</h3>
        <p><strong>PRESENTES:</strong> ${presentList.join(", ") || "NENHUM"}</p>
        <p><strong>AVAL:</strong> ${avalList.join(", ") || "NENHUM"}</p>
        <p><strong>JUSTIFICADOS:</strong> ${justList.join(", ") || "NENHUM"}</p>
        <hr style="margin: 10px 0; border-color: var(--border);">
        <p class="status-danger"><strong>LISTA DE FALTOSOS:</strong> ${absentList.join(", ") || "NINGUÉM FALTOU!"}</p>
    `;

    localStorage.setItem("fantasmas_last_training_report", reportHtml);

    const reportBox = document.getElementById("training-report");
    if (reportBox) {
        reportBox.innerHTML = reportHtml;
        reportBox.classList.remove("hidden");
    }

    await addLog(`REGISTROU TREINAMENTO BFE (${type}).`);
}

/* ---------------------------------------------------------
   19. AVAL COM CRONÔMETRO
--------------------------------------------------------- */
function renderEvaluationPage(container, dept, evalList, saveFn) {
    const members = state[dept.toLowerCase()].members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>${dept} - AVAL 🛡️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>INÍCIO</th>
                            <th>TÉRMINO</th>
                            <th>QUANTO TEMPO FALTA (CRONÔMETRO)</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="6">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const ev = evalList.find(x => x.roblox === m.roblox);
                            const active = ev && ev.endDate && new Date(ev.endDate) > new Date();
                            const expired = ev && ev.endDate && new Date(ev.endDate) <= new Date();

                            let statusHtml = "SEM AVAL";
                            let cronoId = `crono-${dept}-${m.roblox.replace(/[^a-zA-Z0-9]/g, '')}`;
                            let timeLeftText = "NENHUM AVAL ATIVO";

                            if (active) {
                                statusHtml = '<span class="status-warning">🛡️ EM AVAL</span>';
                                const diff = new Date(ev.endDate) - new Date();
                                timeLeftText = formatCountdown(diff);
                                startLiveCountdown(cronoId, new Date(ev.endDate).getTime());
                            } else if (expired) {
                                statusHtml = `<button class="action-btn finish-aval-btn" onclick="finishEval('${m.roblox}', '${dept}')">AVAL FINALIZADO</button>`;
                                timeLeftText = "ENCERRADO";
                            }

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${ev && ev.startDate ? new Date(ev.startDate).toLocaleString("pt-BR") : "-"}</td>
                                    <td>${ev && ev.endDate ? new Date(ev.endDate).toLocaleString("pt-BR") : "-"}</td>
                                    <td><span id="${cronoId}" class="aval-countdown" style="font-weight: 800; color: #72a9ff;">${timeLeftText}</span></td>
                                    <td>${statusHtml}</td>
                                    <td><button class="action-btn edit-btn" onclick="openEditEval('${m.roblox}', '${dept}')">✏️ CONFIGURAR AVAL</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function formatCountdown(ms) {
    if (ms <= 0) return "TEMPO ESGOTADO";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let res = "";
    if (days > 0) res += `${days}D `;
    res += `${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M ${String(seconds).padStart(2, '0')}S`;
    return res;
}

window.activeCountdowns = window.activeCountdowns || {};

function startLiveCountdown(elementId, endTimeMs) {
    if (window.activeCountdowns[elementId]) {
        clearInterval(window.activeCountdowns[elementId]);
    }

    window.activeCountdowns[elementId] = setInterval(() => {
        const now = Date.now();
        const diff = endTimeMs - now;
        const el = document.getElementById(elementId);
        if (!el) {
            clearInterval(window.activeCountdowns[elementId]);
            return;
        }
        if (diff <= 0) {
            el.textContent = "TEMPO ESGOTADO";
            clearInterval(window.activeCountdowns[elementId]);
        } else {
            el.textContent = formatCountdown(diff);
        }
    }, 1000);
}

async function finishEval(roblox, dept) {
    const key = dept.toLowerCase();
    const idx = state[key].evaluations.findIndex(x => x.roblox === roblox);
    if (idx >= 0) {
        state[key].evaluations.splice(idx, 1);
        saveLocalData();

        if (window.supabaseClient) {
            await window.supabaseClient.from("evaluations").delete().eq("roblox", roblox).eq("divisao", dept);
        }

        await addLog(`FINALIZOU AVAL DE ${roblox} NO ${dept}`);
        showToast("AVAL FINALIZADO", `AVAL DE ${roblox} RETORNADO AO PADRÃO.`, "success");
        navigateToPage(`${key}-evaluation`);
    }
}

function openEditEval(roblox, dept) {
    openModal(`
        <h3>CONFIGURAR AVAL - ${roblox} (${dept})</h3>
        <div class="form-group">
            <label>DIA QUE COMEÇA:</label>
            <input type="datetime-local" id="ev-start">
        </div>
        <div class="form-group">
            <label>DIA QUE FINALIZA:</label>
            <input type="datetime-local" id="ev-end">
        </div>
        <button class="main-button" onclick="saveEval('${roblox}', '${dept}')">SALVAR AVAL</button>
    `);
}

async function saveEval(roblox, dept) {
    const startDate = document.getElementById("ev-start").value;
    const endDate = document.getElementById("ev-end").value;

    const key = dept.toLowerCase();
    const idx = state[key].evaluations.findIndex(x => x.roblox === roblox);
    const rec = { roblox, startDate, endDate };

    if (idx >= 0) state[key].evaluations[idx] = rec;
    else state[key].evaluations.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("evaluations").delete().eq("roblox", roblox).eq("divisao", dept);
        await window.supabaseClient.from("evaluations").insert([{
            roblox,
            divisao: dept,
            start_date: startDate,
            end_date: endDate
        }]);
    }

    closeModal();
    navigateToPage(`${key}-evaluation`);
    showToast("AVAL ATUALIZADO", `AVAL DE ${roblox} CONFIGURADO COM SUCESSO!`, "success");
}

function saveBfeEval(roblox) { saveEval(roblox, "BFE"); }
function saveSgbEval(roblox) { saveEval(roblox, "SGB"); }
function saveJornalEval(roblox) { saveEval(roblox, "JORNAL"); }

/* ---------------------------------------------------------
   20. SGB - COTA SEMANAL (REGRAS EXATAS DE TICKETS / PUNIÇÕES)
--------------------------------------------------------- */
function renderSgbWeeklyPage(container) {
    const members = state.sgb.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>SGB - COTA SEMANAL 🗓️</h2>
            <p class="muted">RESET SEMANAL DOMINGO ÀS 10:00 (HORÁRIO DE BRASÍLIA). NÚMERO 0 = COTA NÃO CONCLUÍDA.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>VALOR REALIZADO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const w = state.sgb.weekly.find(x => x.roblox === m.roblox) || { inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" };
                            const ok = w.result && w.result.includes("CONCLUÍDA");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.inputVal !== undefined ? w.inputVal : '0'}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-danger'}">${ok ? "COTA SEMANAL CONCLUÍDA" : "Cota Semanal não está concluída!"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditSgbWeekly('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditSgbWeekly(roblox) {
    const member = state.sgb.members.find(m => m.roblox === roblox);
    const w = state.sgb.weekly.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA SEMANAL SGB - ${roblox}</h3>
        <p><strong>PATENTE:</strong> ${member ? member.rank : ''}</p>
        <div class="form-group">
            <label>VALOR REALIZADO (EX: 0, 10 TICKETS, 3 TICKETS + 2 PUNIÇÕES):</label>
            <input type="text" id="sgb-w-val" value="${w.inputVal !== undefined ? w.inputVal : '0'}" placeholder="EX: 0, 10 TICKETS" oninput="autoCalcSgbWeekly('${member ? member.rank : ''}')">
        </div>
        <div class="form-group">
            <label>STATUS:</label>
            <select id="sgb-w-res">
                <option value="COTA SEMANAL CONCLUÍDA" ${w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL CONCLUÍDA</option>
                <option value="COTA SEMANAL NÃO REALIZADA" ${!w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL NÃO REALIZADA</option>
            </select>
        </div>
        <button class="main-button" onclick="saveSgbWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcSgbWeekly(rank) {
    const valField = document.getElementById("sgb-w-val");
    const resSelect = document.getElementById("sgb-w-res");
    if (!valField || !resSelect) return;

    const val = valField.value.toLowerCase().trim();

    if (val === "" || val === "0") {
        resSelect.value = "COTA SEMANAL NÃO REALIZADA";
        return;
    }

    let isComplete = false;
    const num = parseInt(val) || 0;

    if (rank.includes("EST") || rank.includes("estagiários")) {
        if (num >= 10 || val.includes("10")) isComplete = true;
    } else if (rank.includes("APR") || rank.includes("aprendiz")) {
        if (num >= 3 || val.includes("3") || val.includes("punição")) isComplete = true;
    } else if (rank.includes("SÊN") || rank.includes("sênior") || rank.includes("ANST") || rank.includes("analista")) {
        if (num >= 1 || num >= 5 || val.includes("1") || val.includes("5") || val.includes("punição") || val.includes("ticket")) isComplete = true;
    } else if (rank.includes("SUP") || rank.includes("supervisor")) {
        if (num >= 3 || num >= 5 || val.includes("3") || val.includes("5") || val.includes("punição") || val.includes("ticket")) isComplete = true;
    } else if (rank.includes("CRD") || rank.includes("coordenador")) {
        if (num >= 2 || num >= 5 || val.includes("2") || val.includes("5") || val.includes("advertência") || val.includes("ticket")) isComplete = true;
    } else if (rank.includes("CG") || rank.includes("corregedor")) {
        if (num >= 1 || num >= 5 || val.includes("1") || val.includes("5") || val.includes("advertência") || val.includes("ticket")) isComplete = true;
    }

    resSelect.value = isComplete ? "COTA SEMANAL CONCLUÍDA" : "COTA SEMANAL NÃO REALIZADA";
}

async function saveSgbWeekly(roblox) {
    const inputVal = document.getElementById("sgb-w-val").value;
    const result = document.getElementById("sgb-w-res").value;

    const idx = state.sgb.weekly.findIndex(x => x.roblox === roblox);
    const rec = { roblox, inputVal, result };

    if (idx >= 0) state.sgb.weekly[idx] = rec;
    else state.sgb.weekly.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "SGB",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("sgb-weekly");
    showToast("SUCESSO", "COTA SEMANAL SGB SALVA!", "success");
}

function renderSgbWarningsPage(container) {
    const members = state.sgb.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>SGB - ADVERTÊNCIA ⚠️</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>ADVERTÊNCIAS (0 ACEITÁVEL)</th>
                            <th>AÇÃO</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const w = state.sgb.warnings.find(x => x.roblox === m.roblox) || { qty: 0 };
                            const qty = parseInt(w.qty || 0);
                            const isLow = m.rank.includes("EST") || m.rank.includes("APR");
                            let msg = "-";
                            if (qty >= 2) msg = isLow ? "🚨 EXÍLIO" : "📉 REBAIXAMENTO";

                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${qty}</td>
                                    <td><span class="status-danger">${msg}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditSgbWarn('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditSgbWarn(roblox) {
    openModal(`
        <h3>ADVERTÊNCIA SGB - ${roblox}</h3>
        <div class="form-group">
            <label>QUANTIDADE DE ADVERTÊNCIAS (0 A 3):</label>
            <select id="sgb-warn-qty">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
            </select>
        </div>
        <button class="main-button" onclick="saveSgbWarn('${roblox}')">SALVAR</button>
    `);
}

function saveSgbWarn(roblox) {
    const qty = document.getElementById("sgb-warn-qty").value;
    const idx = state.sgb.warnings.findIndex(x => x.roblox === roblox);
    if (idx >= 0) state.sgb.warnings[idx] = { roblox, qty };
    else state.sgb.warnings.push({ roblox, qty });

    saveLocalData();
    closeModal();
    navigateToPage("sgb-warnings");
}

/* ---------------------------------------------------------
   21. JORNAL - COTAS DIÁRIA E SEMANAL (REGRAS EXATAS)
--------------------------------------------------------- */
function renderJornalDailyPage(container) {
    const members = state.jornal.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>JORNAL - COTA DIÁRIA 📅</h2>
            <p class="muted">RESET DIÁRIO ÀS 08:00 (HORÁRIO DE BRASÍLIA). NÚMERO 0 = COTA NÃO CONCLUÍDA.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>REALIZADO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const d = state.jornal.daily.find(x => x.roblox === m.roblox) || { inputVal: "0", result: "COTA DIÁRIA NÃO REALIZADA" };
                            const ok = d.result && d.result.includes("CONCLUÍDA");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${d.inputVal !== undefined ? d.inputVal : '0'}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-danger'}">${ok ? "COTA DIÁRIA CONCLUÍDA" : "Cota diária não concluída"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditJornalDaily('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditJornalDaily(roblox) {
    const member = state.jornal.members.find(m => m.roblox === roblox);
    const d = state.jornal.daily.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA DIÁRIA JORNAL - ${roblox}</h3>
        <p><strong>PATENTE:</strong> ${member ? member.rank : ''}</p>
        <div class="form-group">
            <label>VALOR REALIZADO (EX: 0, 2 MATÉRIAS, 1 JORNAL, 1 APROVAÇÃO):</label>
            <input type="text" id="jor-d-val" value="${d.inputVal !== undefined ? d.inputVal : '0'}" placeholder="EX: 0 OU 2 MATÉRIAS" oninput="autoCalcJornalDaily('${member ? member.rank : ''}')">
        </div>
        <div class="form-group">
            <label>STATUS:</label>
            <select id="jor-d-res">
                <option value="COTA DIÁRIA CONCLUÍDA" ${d.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA DIÁRIA CONCLUÍDA</option>
                <option value="COTA DIÁRIA NÃO REALIZADA" ${!d.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA DIÁRIA NÃO REALIZADA</option>
            </select>
        </div>
        <button class="main-button" onclick="saveJornalDaily('${roblox}')">SALVAR</button>
    `);
}

function autoCalcJornalDaily(rank) {
    const valField = document.getElementById("jor-d-val");
    const resSelect = document.getElementById("jor-d-res");
    if (!valField || !resSelect) return;

    const val = valField.value.toLowerCase().trim();

    if (val === "" || val === "0") {
        resSelect.value = "COTA DIÁRIA NÃO REALIZADA";
        return;
    }

    let isComplete = false;
    const num = parseInt(val) || 0;

    if (rank.includes("RS") || rank.includes("repórter") || rank.includes("OV") || rank.includes("observador")) {
        if (num >= 2 || val.includes("2")) isComplete = true;
    } else if (rank.includes("ED") || rank.includes("editor") || rank.includes("ES") || rank.includes("encarregado") || rank.includes("DS") || rank.includes("diretor")) {
        if (num >= 1 || num >= 2 || val.includes("1") || val.includes("2") || val.includes("aprovar") || val.includes("postar")) isComplete = true;
    } else if (rank.includes("CS") || rank.includes("chefe")) {
        isComplete = true;
    }

    resSelect.value = isComplete ? "COTA DIÁRIA CONCLUÍDA" : "COTA DIÁRIA NÃO REALIZADA";
}

async function saveJornalDaily(roblox) {
    const inputVal = document.getElementById("jor-d-val").value;
    const result = document.getElementById("jor-d-res").value;

    const idx = state.jornal.daily.findIndex(x => x.roblox === roblox);
    const rec = { roblox, inputVal, result };

    if (idx >= 0) state.jornal.daily[idx] = rec;
    else state.jornal.daily.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_diarias").insert([{
            roblox,
            divisao: "JORNAL",
            status: result
        }]);
    }

    closeModal();
    navigateToPage("jornal-daily");
    showToast("SUCESSO", "COTA DIÁRIA JORNAL SALVA!", "success");
}

function renderJornalWeeklyPage(container) {
    const members = state.jornal.members;

    container.innerHTML = `
        <div class="card-panel">
            <h2>JORNAL - COTA SEMANAL 🗓️</h2>
            <p class="muted">RESET SEMANAL DOMINGO ÀS 10:00 (HORÁRIO DE BRASÍLIA). NÚMERO 0 = COTA NÃO CONCLUÍDA.</p>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ROBLOX</th>
                            <th>PATENTE</th>
                            <th>VALOR REALIZADO</th>
                            <th>STATUS</th>
                            <th>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.length === 0 ? `<tr><td colspan="5">NENHUM MEMBRO CADASTRADO.</td></tr>` : 
                        members.map(m => {
                            const w = state.jornal.weekly.find(x => x.roblox === m.roblox) || { inputVal: "0", result: "COTA SEMANAL NÃO REALIZADA" };
                            const ok = w.result && w.result.includes("CONCLUÍDA");
                            return `
                                <tr>
                                    <td><strong>${m.roblox}</strong></td>
                                    <td>${m.rank}</td>
                                    <td>${w.inputVal !== undefined ? w.inputVal : '0'}</td>
                                    <td><span class="${ok ? 'status-ok' : 'status-warning'}">${ok ? "COTA SEMANAL CONCLUÍDA" : "Cota Semanal não está concluída!"}</span></td>
                                    <td><button class="action-btn edit-btn" onclick="openEditJornalWeekly('${m.roblox}')">✏️ EDITAR</button></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openEditJornalWeekly(roblox) {
    const member = state.jornal.members.find(m => m.roblox === roblox);
    const w = state.jornal.weekly.find(x => x.roblox === roblox) || {};

    openModal(`
        <h3>COTA SEMANAL JORNAL - ${roblox}</h3>
        <p><strong>PATENTE:</strong> ${member ? member.rank : ''}</p>
        <div class="form-group">
            <label>VALOR REALIZADO (EX: 0, 14 MATÉRIAS, 5 JORNAIS + 5 APROVAÇÕES):</label>
            <input type="text" id="jor-w-val" value="${w.inputVal !== undefined ? w.inputVal : '0'}" placeholder="EX: 0, 14 MATÉRIAS" oninput="autoCalcJornalWeekly('${member ? member.rank : ''}')">
        </div>
        <div class="form-group">
            <label>STATUS:</label>
            <select id="jor-w-res">
                <option value="COTA SEMANAL CONCLUÍDA" ${w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL CONCLUÍDA</option>
                <option value="COTA SEMANAL NÃO REALIZADA" ${!w.result?.includes("CONCLUÍDA") ? "selected" : ""}>COTA SEMANAL NÃO REALIZADA</option>
            </select>
        </div>
        <button class="main-button" onclick="saveJornalWeekly('${roblox}')">SALVAR</button>
    `);
}

function autoCalcJornalWeekly(rank) {
    const valField = document.getElementById("jor-w-val");
    const resSelect = document.getElementById("jor-w-res");
    if (!valField || !resSelect) return;

    const val = valField.value.toLowerCase().trim();

    if (val === "" || val === "0") {
        resSelect.value = "COTA SEMANAL NÃO REALIZADA";
        return;
    }

    let isComplete = false;
    const num = parseInt(val) || 0;

    if (rank.includes("RS") || rank.includes("repórter")) {
        if (num >= 14 || val.includes("14")) isComplete = true;
    } else if (rank.includes("OV") || rank.includes("observador")) {
        if (num >= 12 || val.includes("12")) isComplete = true;
    } else if (rank.includes("ED") || rank.includes("editor")) {
        if (num >= 5 || num >= 9 || val.includes("5") || val.includes("9") || val.includes("jornal")) isComplete = true;
    } else if (rank.includes("ES") || rank.includes("encarregado")) {
        if (num >= 3 || num >= 10 || val.includes("3") || val.includes("10") || val.includes("jornal") || val.includes("aprovar")) isComplete = true;
    } else if (rank.includes("DS") || rank.includes("diretor")) {
        if (num >= 2 || val.includes("2") || val.includes("jornal")) isComplete = true;
    }

    resSelect.value = isComplete ? "COTA SEMANAL CONCLUÍDA" : "COTA SEMANAL NÃO REALIZADA";
}

async function saveJornalWeekly(roblox) {
    const inputVal = document.getElementById("jor-w-val").value;
    const result = document.getElementById("jor-w-res").value;

    const idx = state.jornal.weekly.findIndex(x => x.roblox === roblox);
    const rec = { roblox, inputVal, result };

    if (idx >= 0) state.jornal.weekly[idx] = rec;
    else state.jornal.weekly.push(rec);

    saveLocalData();

    if (window.supabaseClient) {
        await window.supabaseClient.from("cotas_semanais").insert([{
            roblox,
            divisao: "JORNAL",
            status: result,
            semana: new Date().toISOString().substring(0, 10)
        }]);
    }

    closeModal();
    navigateToPage("jornal-weekly");
    showToast("SUCESSO", "COTA SEMANAL JORNAL SALVA!", "success");
}

/* ---------------------------------------------------------
   22. LOGS DO SISTEMA
--------------------------------------------------------- */
function renderLogsPage(container) {
    container.innerHTML = `
        <div class="card-panel">
            <h2>LOGS DO SISTEMA 📁</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>DATA / HORA</th>
                            <th>USUÁRIO</th>
                            <th>AÇÃO REALIZADA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.logs.length === 0 ? `<tr><td colspan="3">NENHUM REGISTRO DE LOG ATÉ O MOMENTO.</td></tr>` : 
                        state.logs.map(log => `
                            <tr>
                                <td>${log.timestamp}</td>
                                <td><strong>${log.user}</strong></td>
                                <td>${log.action}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}