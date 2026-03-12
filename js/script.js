import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
	addDoc,
	collection,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	query,
	serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Lista textual usada no marquee de serviços e no select do formulário.
const SERVICES = [
	"Instalação de sistema Multi Split",
	"Instalação de sistema Mono Split",
	"Instalação de Bombas de Calor",
	"Instalação Solar AQS",
	"Higienização de equipamentos",
	"Murais",
	"Cassetes de teto",
	"Unidades de condutas",
	"Reparação de ar condicionado",
];

// Galeria base de projetos; o preview e o lightbox são gerados a partir deste array.
const PROJECTS = [
	{
		src: "img/projetos/img1.jpeg",
		desc: "Instalação de unidade interior mural.",
	},
	{
		src: "img/projetos/img2.jpeg",
		desc: "Montagem de sistema Multi Split residencial.",
	},
	{
		src: "img/projetos/img3.jpeg",
		desc: "Higienização técnica de equipamento.",
	},
	{
		src: "img/projetos/img4.jpeg",
		desc: "Reparação de ar condicionado com teste final.",
	},
	{ src: "img/projetos/img5.jpeg", desc: "Instalação de cassete de teto." },
	{ src: "img/projetos/img6.jpeg", desc: "Trabalho em sistema com condutas." },
	{
		src: "img/projetos/img7.jpeg",
		desc: "Substituição de equipamento antigo.",
	},
	{
		src: "img/projetos/img8.jpeg",
		desc: "Instalação e ajuste de unidade exterior.",
	},
	{
		src: "img/projetos/img9.jpeg",
		desc: "Intervenção de manutenção preventiva.",
	},
	{
		src: "img/projetos/img10.jpeg",
		desc: "Finalização e validação de desempenho.",
	},
];

// Imagem remota de fallback caso alguma foto local falhe no carregamento.
const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=60";
// Número para onde o formulário comercial é encaminhado via WhatsApp.
const WHATSAPP_NUMBER = "351967722023";

// Referências para as áreas de projetos e modais.
const previewGrid = document.getElementById("preview-grid");
const galleryGrid = document.getElementById("gallery-grid");
const projectsSection = document.getElementById("projetos");
const lightbox = document.getElementById("lightbox");
const closeLightboxButton = document.getElementById("close-lightbox");
const photoLightbox = document.getElementById("photo-lightbox");
const closePhotoLightboxButton = document.getElementById(
	"close-photo-lightbox",
);
const photoLightboxImage = document.getElementById("photo-lightbox-image");
// Referências para os serviços e formulário de contacto.
const marqueeTrack = document.getElementById("marquee-track");
const serviceSelect = document.getElementById("servico-select");
const form = document.getElementById("contact-form");
// Referências do cabeçalho. O JS altera classes, atributos ARIA e o logótipo.
const siteHeader = document.querySelector(".site-header");
const themeToggle = document.getElementById("theme-toggle");
const brandLogo = document.getElementById("brand-logo");
const menuToggle = document.getElementById("menu-toggle");
const primaryNav = document.getElementById("primary-nav");
const navActions = document.querySelector(".nav-actions");

// Referências da área de avaliações.
const reviewForm = document.getElementById("review-form");
const reviewRatingRoot = document.getElementById("review-rating");
const reviewStarsField = document.getElementById("review_stars");
const reviewsList = document.getElementById("reviews-list");
const reviewsStatus = document.getElementById("reviews-status");

let db = null;
// O JS troca estas imagens em applyTheme() quando o utilizador alterna o tema.
const LOGO_LIGHT = "img/projetos/slogan.png";
const LOGO_DARK = "img/projetos/sloganVersao2.png";

// Cria o cartão visual de cada projeto, tanto no preview como dentro da galeria.
function createProjectCard(project, options = {}) {
	const { zoomable = false } = options;
	const card = document.createElement("article");
	card.className = "project-card";
	const imageMarkup = zoomable
		? `<button type="button" class="project-zoom" data-src="${project.src}" data-alt="${project.desc}" aria-label="Ampliar foto do projeto">
        <img src="${project.src}" alt="${project.desc}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
      </button>`
		: `<img src="${project.src}" alt="${project.desc}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />`;

	card.innerHTML = `
    ${imageMarkup}
    <div class="info">${project.desc}</div>
  `;
	return card;
}

// Renderiza apenas os primeiros projetos na secção de preview da página.
function renderProjects() {
	previewGrid.innerHTML = "";
	PROJECTS.slice(0, 5).forEach((project) => {
		previewGrid.appendChild(createProjectCard(project));
	});
}

// Abre o modal principal da galeria e popula todas as imagens disponíveis.
function openGallery() {
	galleryGrid.innerHTML = "";
	PROJECTS.forEach((project) =>
		galleryGrid.appendChild(createProjectCard(project, { zoomable: true })),
	);
	lightbox.classList.add("open");
	lightbox.setAttribute("aria-hidden", "false");
	updateBodyLock();
}

// Fecha o modal principal da galeria.
function closeGallery() {
	closePhotoLightbox();
	lightbox.classList.remove("open");
	lightbox.setAttribute("aria-hidden", "true");
	updateBodyLock();
}

// Abre a ampliação de uma foto específica clicada dentro da galeria.
function openPhotoLightbox(src, altText = "Foto do projeto ampliada") {
	if (!photoLightbox || !photoLightboxImage) {
		return;
	}
	photoLightboxImage.src = src;
	photoLightboxImage.alt = altText;
	photoLightbox.classList.add("open");
	photoLightbox.setAttribute("aria-hidden", "false");
	updateBodyLock();
}

// Fecha a ampliação da foto e limpa o src para evitar conteúdo residual.
function closePhotoLightbox() {
	if (!photoLightbox || !photoLightboxImage) {
		return;
	}
	photoLightbox.classList.remove("open");
	photoLightbox.setAttribute("aria-hidden", "true");
	photoLightboxImage.src = "";
	updateBodyLock();
}

// Centraliza o bloqueio de scroll do body.
// O JS chama esta função sempre que abre ou fecha galeria, foto ampliada ou menu mobile.
function updateBodyLock() {
	const isGalleryOpen = lightbox.classList.contains("open");
	const isPhotoOpen = photoLightbox && photoLightbox.classList.contains("open");
	const isMenuOpen =
		document.body.classList.contains("menu-open") && window.innerWidth <= 680;
	document.body.style.overflow =
		isGalleryOpen || isPhotoOpen || isMenuOpen ? "hidden" : "";
}

// Adiciona/remove a classe .scrolled no header para mudar o estilo após scroll.
function updateHeaderState() {
	if (!siteHeader) {
		return;
	}
	siteHeader.classList.toggle("scrolled", window.scrollY > 10);
}

// Escuta o scroll da janela e mantém o header visualmente coerente.
function setupHeaderScroll() {
	updateHeaderState();
	window.addEventListener("scroll", updateHeaderState, { passive: true });
}

// Aplica o tema global do site.
// Aqui o JS:
// 1) liga/desliga body.theme-dark, que altera cores via CSS;
// 2) troca o logótipo claro/escuro;
// 3) atualiza os atributos de acessibilidade do botão;
// 4) grava a preferência no localStorage.
function applyTheme(theme) {
	const isDark = theme === "dark";
	document.body.classList.toggle("theme-dark", isDark);

	if (brandLogo) {
		brandLogo.src = isDark ? LOGO_DARK : LOGO_LIGHT;
	}

	if (themeToggle) {
		themeToggle.setAttribute("aria-pressed", String(isDark));
		themeToggle.setAttribute(
			"aria-label",
			isDark ? "Ativar versão clara" : "Ativar versão escura",
		);
	}

	try {
		window.localStorage.setItem("theme", isDark ? "dark" : "light");
	} catch (_error) {}
}

// Fecha o menu mobile e repõe os atributos do botão hamburguer.
function closeMobileMenu() {
	if (!menuToggle || !primaryNav) {
		return;
	}
	document.body.classList.remove("menu-open");
	menuToggle.setAttribute("aria-expanded", "false");
	menuToggle.setAttribute("aria-label", "Abrir menu");
	updateBodyLock();
}

// Abre o menu mobile ao adicionar a classe body.menu-open.
function openMobileMenu() {
	if (!menuToggle || !primaryNav) {
		return;
	}
	document.body.classList.add("menu-open");
	menuToggle.setAttribute("aria-expanded", "true");
	menuToggle.setAttribute("aria-label", "Fechar menu");
	updateBodyLock();
}

// Liga todo o comportamento do menu mobile.
// O JS abre/fecha no clique do botão, fecha ao tocar num link,
// fecha ao tocar fora do painel e também ao redimensionar para desktop.
function setupMobileMenu() {
	if (!menuToggle || !primaryNav) {
		return;
	}

	menuToggle.addEventListener("click", () => {
		const isOpen = document.body.classList.contains("menu-open");
		if (isOpen) {
			closeMobileMenu();
			return;
		}
		openMobileMenu();
	});

	primaryNav.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", () => {
			if (window.innerWidth <= 680) {
				closeMobileMenu();
			}
		});
	});

	if (navActions) {
		navActions.addEventListener("click", (event) => {
			if (event.target === navActions && window.innerWidth <= 680) {
				closeMobileMenu();
			}
		});
	}

	window.addEventListener("resize", () => {
		if (window.innerWidth > 680) {
			closeMobileMenu();
		} else {
			updateBodyLock();
		}
	});
}

// Recupera a preferência de tema guardada e liga o clique do botão de alternância.
function setupThemeToggle() {
	let savedTheme = "light";
	try {
		const stored = window.localStorage.getItem("theme");
		if (stored === "dark" || stored === "light") {
			savedTheme = stored;
		}
	} catch (_error) {
		savedTheme = "light";
	}

	applyTheme(savedTheme);

	if (themeToggle) {
		themeToggle.addEventListener("click", () => {
			const nextTheme = document.body.classList.contains("theme-dark")
				? "light"
				: "dark";
			applyTheme(nextTheme);
		});
	}
}

// Duplica a lista de serviços para criar a animação contínua do marquee.
function renderServices() {
	marqueeTrack.innerHTML = "";
	const doubled = [...SERVICES, ...SERVICES];
	doubled.forEach((item) => {
		const card = document.createElement("div");
		card.className = "service-card";
		card.textContent = item;
		marqueeTrack.appendChild(card);
	});
}

// Preenche dinamicamente o select de serviços do formulário de contacto.
function populateServiceSelect() {
	serviceSelect.innerHTML = "";
	const placeholder = document.createElement("option");
	placeholder.textContent = "Selecione";
	placeholder.value = "";
	placeholder.disabled = true;
	placeholder.selected = true;
	serviceSelect.appendChild(placeholder);

	SERVICES.forEach((service) => {
		const option = document.createElement("option");
		option.value = service;
		option.textContent = service;
		serviceSelect.appendChild(option);
	});
}

// Interceta o submit do formulário, valida os campos e abre a conversa no WhatsApp.
function setupContactForm() {
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		const data = new FormData(form);

		const text = [
			"Olá, gostaria de saber mais informações, meus dados são:",
			`Nome: ${data.get("nome")}`,
			`NIF: ${data.get("nif")}`,
			`Email: ${data.get("email")}`,
			`Telefone: ${data.get("telefone")}`,
			`Serviço desejado: ${data.get("servico")}`,
			`Marca de preferência: ${data.get("marca")}`,
		].join("\n");

		const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
		window.open(url, "_blank", "noopener");
		form.reset();
	});
}

// Atualiza visualmente as estrelas selecionadas no formulário de avaliações.
function drawStars(root, value) {
	root.querySelectorAll(".star").forEach((star) => {
		star.classList.toggle("active", Number(star.dataset.value) <= value);
	});
}

// Liga o clique nas estrelas para preencher o campo oculto review_stars.
function setupReviewRating() {
	reviewRatingRoot.addEventListener("click", (event) => {
		const button = event.target.closest(".star");
		if (!button) return;
		const value = Number(button.dataset.value);
		reviewStarsField.value = String(value);
		drawStars(reviewRatingRoot, value);
	});
}

// Cria cada item visual de comentário carregado do Firebase.
function createReviewItem(review) {
	const item = document.createElement("article");
	item.className = "review-item";
	item.innerHTML = `
    <strong>${review.nome}</strong>
    <p class="stars">${"★".repeat(review.estrelas)}${"☆".repeat(5 - review.estrelas)}</p>
    <p>${review.comentario}</p>
  `;
	return item;
}

// Liga a secção de avaliações ao Firestore e redesenha a lista em tempo real.
function setupFirebaseReviews() {
	const firebaseConfig = window.FIREBASE_CONFIG;
	if (!firebaseConfig || !firebaseConfig.apiKey) {
		reviewsStatus.textContent =
			"Firebase não configurado. Preencha js/firebase-config.js para ativar as avaliações.";
		return;
	}

	const app = initializeApp(firebaseConfig);
	db = getFirestore(app);

	const reviewsQuery = query(
		collection(db, "avaliacoes"),
		orderBy("createdAt", "desc"),
		limit(50),
	);

	onSnapshot(reviewsQuery, (snapshot) => {
		reviewsList.innerHTML = "";
		// A lista é recriada do zero sempre que chegam alterações da base de dados.
		snapshot.forEach((docSnap) => {
			const data = docSnap.data();
			reviewsList.appendChild(
				createReviewItem({
					nome: data.nome || "Cliente",
					comentario: data.comentario || "",
					estrelas: Number(data.estrelas) || 1,
				}),
			);
		});
	});
}

// Publica uma nova avaliação no Firestore depois de validar os dados do formulário.
function setupReviewForm() {
	reviewForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		if (!db) {
			reviewsStatus.textContent =
				"Não foi possível publicar: Firebase não está ativo.";
			return;
		}

		const data = new FormData(reviewForm);
		const estrelas = Number(data.get("review_stars"));
		if (!estrelas || estrelas < 1 || estrelas > 5) {
			reviewsStatus.textContent = "Escolha uma avaliação entre 1 e 5 estrelas.";
			return;
		}

		const payload = {
			nome: String(data.get("review_nome") || "").trim(),
			comentario: String(data.get("review_comentario") || "").trim(),
			estrelas,
			createdAt: serverTimestamp(),
		};

		if (!payload.nome || !payload.comentario) {
			reviewsStatus.textContent = "Preencha nome e comentário.";
			return;
		}

		try {
			await addDoc(collection(db, "avaliacoes"), payload);
			reviewsStatus.textContent = "Avaliação publicada com sucesso.";
			reviewForm.reset();
			reviewStarsField.value = "0";
			drawStars(reviewRatingRoot, 0);
		} catch (error) {
			reviewsStatus.textContent =
				"Erro ao publicar avaliação. Verifique as regras do Firebase.";
		}
	});
}

// Concentra todos os listeners globais ligados à galeria e ao teclado.
function bindEvents() {
	projectsSection.addEventListener("click", (event) => {
		if (event.target.closest("a, button, input, select, textarea, label"))
			return;
		openGallery();
	});

	projectsSection.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			openGallery();
		}
	});

	closeLightboxButton.addEventListener("click", closeGallery);

	lightbox.addEventListener("click", (event) => {
		if (event.target === lightbox) closeGallery();
	});

	galleryGrid.addEventListener("click", (event) => {
		const trigger = event.target.closest(".project-zoom");
		if (!trigger) return;
		openPhotoLightbox(trigger.dataset.src, trigger.dataset.alt);
	});

	if (closePhotoLightboxButton) {
		closePhotoLightboxButton.addEventListener("click", closePhotoLightbox);
	}

	if (photoLightbox) {
		photoLightbox.addEventListener("click", (event) => {
			if (event.target === photoLightbox) closePhotoLightbox();
		});
	}

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			// Fecha primeiro o menu mobile se estiver aberto.
			if (document.body.classList.contains("menu-open")) {
				closeMobileMenu();
			}
			// Se a foto ampliada estiver aberta, fecha antes da galeria.
			if (photoLightbox && photoLightbox.classList.contains("open")) {
				closePhotoLightbox();
				return;
			}
			closeGallery();
		}
	});
}

// Ponto de arranque do site.
// Aqui o JS inicializa todas as áreas dinâmicas e atualiza o ano do rodapé.
function init() {
	renderProjects();
	renderServices();
	populateServiceSelect();
	setupContactForm();
	setupReviewRating();
	setupFirebaseReviews();
	setupReviewForm();
	setupThemeToggle();
	setupHeaderScroll();
	setupMobileMenu();
	bindEvents();
	document.getElementById("year").textContent = new Date().getFullYear();
}

init();
