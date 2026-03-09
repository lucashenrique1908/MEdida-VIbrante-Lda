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

const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=60";
const WHATSAPP_NUMBER = "351900000000";

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
const marqueeTrack = document.getElementById("marquee-track");
const serviceSelect = document.getElementById("servico-select");
const form = document.getElementById("contact-form");
const siteHeader = document.querySelector(".site-header");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle ? themeToggle.querySelector(".theme-icon") : null;
const brandLogo = document.getElementById("brand-logo");

const reviewForm = document.getElementById("review-form");
const reviewRatingRoot = document.getElementById("review-rating");
const reviewStarsField = document.getElementById("review_stars");
const reviewsList = document.getElementById("reviews-list");
const reviewsStatus = document.getElementById("reviews-status");

let db = null;
const LOGO_LIGHT = "img/projetos/slogan.png";
const LOGO_DARK = "img/projetos/sloganVersao2.png";

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

function renderProjects() {
	previewGrid.innerHTML = "";
	PROJECTS.slice(0, 5).forEach((project) => {
		previewGrid.appendChild(createProjectCard(project));
	});
}

function openGallery() {
	galleryGrid.innerHTML = "";
	PROJECTS.forEach((project) =>
		galleryGrid.appendChild(createProjectCard(project, { zoomable: true })),
	);
	lightbox.classList.add("open");
	lightbox.setAttribute("aria-hidden", "false");
	updateBodyLock();
}

function closeGallery() {
	closePhotoLightbox();
	lightbox.classList.remove("open");
	lightbox.setAttribute("aria-hidden", "true");
	updateBodyLock();
}

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

function closePhotoLightbox() {
	if (!photoLightbox || !photoLightboxImage) {
		return;
	}
	photoLightbox.classList.remove("open");
	photoLightbox.setAttribute("aria-hidden", "true");
	photoLightboxImage.src = "";
	updateBodyLock();
}

function updateBodyLock() {
	const isGalleryOpen = lightbox.classList.contains("open");
	const isPhotoOpen = photoLightbox && photoLightbox.classList.contains("open");
	document.body.style.overflow = isGalleryOpen || isPhotoOpen ? "hidden" : "";
}

function updateHeaderState() {
	if (!siteHeader) {
		return;
	}
	siteHeader.classList.toggle("scrolled", window.scrollY > 10);
}

function setupHeaderScroll() {
	updateHeaderState();
	window.addEventListener("scroll", updateHeaderState, { passive: true });
}

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

	if (themeIcon) {
		themeIcon.textContent = isDark ? "🌙" : "☀️";
	}

	try {
		window.localStorage.setItem("theme", isDark ? "dark" : "light");
	} catch (_error) {}
}

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

function setupContactForm() {
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		const data = new FormData(form);

		const text = [
			"*Novo pedido Medida Vibrante*",
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

function drawStars(root, value) {
	root.querySelectorAll(".star").forEach((star) => {
		star.classList.toggle("active", Number(star.dataset.value) <= value);
	});
}

function setupReviewRating() {
	reviewRatingRoot.addEventListener("click", (event) => {
		const button = event.target.closest(".star");
		if (!button) return;
		const value = Number(button.dataset.value);
		reviewStarsField.value = String(value);
		drawStars(reviewRatingRoot, value);
	});
}

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
			if (photoLightbox && photoLightbox.classList.contains("open")) {
				closePhotoLightbox();
				return;
			}
			closeGallery();
		}
	});
}

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
	bindEvents();
	document.getElementById("year").textContent = new Date().getFullYear();
}

init();
