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
import { PROJECT_ALBUMS } from "./project-albums.js";

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

// Imagem remota de fallback caso alguma foto local falhe no carregamento.
const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=60";
// Número para onde o formulário comercial é encaminhado via WhatsApp.
const WHATSAPP_NUMBER = "351967722023";
// Lista de países com bandeira, prefixo e aliases para pesquisa flexível.
const PHONE_COUNTRIES = [
	{
		code: "PT",
		flag: "🇵🇹",
		dialCode: "+351",
		name: "Portugal",
		aliases: ["portugal", "portugalia", "portugese republic"],
	},
	{
		code: "ES",
		flag: "🇪🇸",
		dialCode: "+34",
		name: "Spain",
		aliases: ["espanha", "espana", "spain"],
	},
	{
		code: "FR",
		flag: "🇫🇷",
		dialCode: "+33",
		name: "France",
		aliases: ["franca", "france", "francia"],
	},
	{
		code: "DE",
		flag: "🇩🇪",
		dialCode: "+49",
		name: "Germany",
		aliases: ["alemanha", "germany", "deutschland"],
	},
	{
		code: "IT",
		flag: "🇮🇹",
		dialCode: "+39",
		name: "Italy",
		aliases: ["italia", "italy"],
	},
	{
		code: "GB",
		flag: "🇬🇧",
		dialCode: "+44",
		name: "United Kingdom",
		aliases: [
			"reino unido",
			"uk",
			"england",
			"great britain",
			"united kingdom",
		],
	},
	{
		code: "IE",
		flag: "🇮🇪",
		dialCode: "+353",
		name: "Ireland",
		aliases: ["irlanda", "ireland"],
	},
	{
		code: "NL",
		flag: "🇳🇱",
		dialCode: "+31",
		name: "Netherlands",
		aliases: ["paises baixos", "netherlands", "holland", "holanda"],
	},
	{
		code: "BE",
		flag: "🇧🇪",
		dialCode: "+32",
		name: "Belgium",
		aliases: ["belgica", "belgium", "belgique"],
	},
	{
		code: "LU",
		flag: "🇱🇺",
		dialCode: "+352",
		name: "Luxembourg",
		aliases: ["luxemburgo", "luxembourg"],
	},
	{
		code: "CH",
		flag: "🇨🇭",
		dialCode: "+41",
		name: "Switzerland",
		aliases: ["suica", "switzerland", "suisse", "schweiz"],
	},
	{
		code: "AT",
		flag: "🇦🇹",
		dialCode: "+43",
		name: "Austria",
		aliases: ["austria", "osterreich"],
	},
	{
		code: "SE",
		flag: "🇸🇪",
		dialCode: "+46",
		name: "Sweden",
		aliases: ["suecia", "sweden", "sverige"],
	},
	{
		code: "NO",
		flag: "🇳🇴",
		dialCode: "+47",
		name: "Norway",
		aliases: ["noruega", "norway", "norge"],
	},
	{
		code: "DK",
		flag: "🇩🇰",
		dialCode: "+45",
		name: "Denmark",
		aliases: ["dinamarca", "denmark", "danmark"],
	},
	{
		code: "FI",
		flag: "🇫🇮",
		dialCode: "+358",
		name: "Finland",
		aliases: ["finlandia", "finland", "suomi"],
	},
	{
		code: "PL",
		flag: "🇵🇱",
		dialCode: "+48",
		name: "Poland",
		aliases: ["polonia", "poland"],
	},
	{
		code: "CZ",
		flag: "🇨🇿",
		dialCode: "+420",
		name: "Czechia",
		aliases: ["republica checa", "czech republic", "czechia", "chequia"],
	},
	{
		code: "RO",
		flag: "🇷🇴",
		dialCode: "+40",
		name: "Romania",
		aliases: ["romenia", "romania"],
	},
	{
		code: "BG",
		flag: "🇧🇬",
		dialCode: "+359",
		name: "Bulgaria",
		aliases: ["bulgaria"],
	},
	{
		code: "GR",
		flag: "🇬🇷",
		dialCode: "+30",
		name: "Greece",
		aliases: ["grecia", "greece", "ellas"],
	},
	{
		code: "TR",
		flag: "🇹🇷",
		dialCode: "+90",
		name: "Turkey",
		aliases: ["turquia", "turkey", "turkiye"],
	},
	{
		code: "US",
		flag: "🇺🇸",
		dialCode: "+1",
		name: "United States",
		aliases: ["estados unidos", "usa", "us", "united states", "america"],
	},
	{
		code: "CA",
		flag: "🇨🇦",
		dialCode: "+1",
		name: "Canada",
		aliases: ["canada"],
	},
	{
		code: "MX",
		flag: "🇲🇽",
		dialCode: "+52",
		name: "Mexico",
		aliases: ["mexico", "méxico"],
	},
	{
		code: "BR",
		flag: "🇧🇷",
		dialCode: "+55",
		name: "Brazil",
		aliases: ["brasil", "brazil"],
	},
	{
		code: "AR",
		flag: "🇦🇷",
		dialCode: "+54",
		name: "Argentina",
		aliases: ["argentina"],
	},
	{
		code: "CL",
		flag: "🇨🇱",
		dialCode: "+56",
		name: "Chile",
		aliases: ["chile"],
	},
	{
		code: "CO",
		flag: "🇨🇴",
		dialCode: "+57",
		name: "Colombia",
		aliases: ["colombia"],
	},
	{
		code: "PE",
		flag: "🇵🇪",
		dialCode: "+51",
		name: "Peru",
		aliases: ["peru", "perú"],
	},
	{
		code: "VE",
		flag: "🇻🇪",
		dialCode: "+58",
		name: "Venezuela",
		aliases: ["venezuela"],
	},
	{
		code: "MA",
		flag: "🇲🇦",
		dialCode: "+212",
		name: "Morocco",
		aliases: ["marrocos", "morocco", "marruecos"],
	},
	{
		code: "DZ",
		flag: "🇩🇿",
		dialCode: "+213",
		name: "Algeria",
		aliases: ["argelia", "algeria", "algérie"],
	},
	{
		code: "TN",
		flag: "🇹🇳",
		dialCode: "+216",
		name: "Tunisia",
		aliases: ["tunisia", "tunisia", "tunisie"],
	},
	{
		code: "AO",
		flag: "🇦🇴",
		dialCode: "+244",
		name: "Angola",
		aliases: ["angola"],
	},
	{
		code: "MZ",
		flag: "🇲🇿",
		dialCode: "+258",
		name: "Mozambique",
		aliases: ["mozambique", "moçambique"],
	},
	{
		code: "CV",
		flag: "🇨🇻",
		dialCode: "+238",
		name: "Cape Verde",
		aliases: ["cabo verde", "cape verde"],
	},
	{
		code: "GW",
		flag: "🇬🇼",
		dialCode: "+245",
		name: "Guinea-Bissau",
		aliases: ["guine bissau", "guinea-bissau", "guine-bissau"],
	},
	{
		code: "ST",
		flag: "🇸🇹",
		dialCode: "+239",
		name: "Sao Tome and Principe",
		aliases: [
			"sao tome",
			"sao tome e principe",
			"são tomé",
			"são tomé e príncipe",
		],
	},
	{
		code: "ZA",
		flag: "🇿🇦",
		dialCode: "+27",
		name: "South Africa",
		aliases: ["africa do sul", "south africa"],
	},
	{
		code: "AE",
		flag: "🇦🇪",
		dialCode: "+971",
		name: "United Arab Emirates",
		aliases: [
			"emirados arabes unidos",
			"uae",
			"emirates",
			"united arab emirates",
		],
	},
	{
		code: "SA",
		flag: "🇸🇦",
		dialCode: "+966",
		name: "Saudi Arabia",
		aliases: ["arabia saudita", "saudi arabia"],
	},
	{
		code: "QA",
		flag: "🇶🇦",
		dialCode: "+974",
		name: "Qatar",
		aliases: ["qatar", "catar"],
	},
	{
		code: "IN",
		flag: "🇮🇳",
		dialCode: "+91",
		name: "India",
		aliases: ["india", "índia", "bharat"],
	},
	{
		code: "CN",
		flag: "🇨🇳",
		dialCode: "+86",
		name: "China",
		aliases: ["china", "zhongguo"],
	},
	{
		code: "JP",
		flag: "🇯🇵",
		dialCode: "+81",
		name: "Japan",
		aliases: ["japao", "japão", "japan", "nihon"],
	},
	{
		code: "KR",
		flag: "🇰🇷",
		dialCode: "+82",
		name: "South Korea",
		aliases: ["coreia do sul", "south korea", "korea"],
	},
	{
		code: "AU",
		flag: "🇦🇺",
		dialCode: "+61",
		name: "Australia",
		aliases: ["australia"],
	},
	{
		code: "NZ",
		flag: "🇳🇿",
		dialCode: "+64",
		name: "New Zealand",
		aliases: ["nova zelandia", "new zealand"],
	},
];

// Referências para as áreas de projetos e modais.
const previewGrid = document.getElementById("preview-grid");
const galleryGrid = document.getElementById("gallery-grid");
// A secção continua referenciada como âncora estrutural da galeria na página inicial.
const projectsSection = document.getElementById("projetos");
const lightbox = document.getElementById("lightbox");
const closeLightboxButton = document.getElementById("close-lightbox");
const photoLightbox = document.getElementById("photo-lightbox");
const closePhotoLightboxButton = document.getElementById(
	"close-photo-lightbox",
);
const photoLightboxImage = document.getElementById("photo-lightbox-image");
const photoLightboxPrevButton = document.getElementById("photo-lightbox-prev");
const photoLightboxNextButton = document.getElementById("photo-lightbox-next");
const galleryTitle = document.getElementById("gallery-title");
const gallerySubtitle = document.getElementById("gallery-subtitle");
const galleryBackButton = document.getElementById("gallery-back");
const openFullGalleryButton = document.getElementById("open-full-gallery");
// Referências para os serviços e formulário de contacto.
const marqueeTrack = document.getElementById("marquee-track");
const serviceSelect = document.getElementById("servico-select");
const form = document.getElementById("contact-form");
const nifInput = document.getElementById("nif");
const nifFeedback = document.getElementById("nif-feedback");
const emailInput = document.getElementById("email");
const emailFeedback = document.getElementById("email-feedback");
const phoneField = document.getElementById("phone-field");
const phoneCountryButton = document.getElementById("phone-country-button");
const phoneCountryFlag = document.getElementById("phone-country-flag");
const phoneCountryCode = document.getElementById("phone-country-code");
const phoneCountryInput = document.getElementById("phone-country");
const phoneNumberInput = document.getElementById("phone-number");
const phoneHiddenInput = document.getElementById("telefone");
const phoneFeedback = document.getElementById("phone-feedback");
const phoneCountryPanel = document.getElementById("phone-country-panel");
const phoneCountrySearch = document.getElementById("phone-country-search");
const phoneCountryList = document.getElementById("phone-country-list");
// Referências do cabeçalho. O JS altera classes, atributos ARIA e o logótipo.
const siteHeader = document.querySelector(".site-header");
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
// Limita o home a cinco álbuns e define o texto padrão usado no modal da galeria.
const GALLERY_PREVIEW_LIMIT = 5;
const GALLERY_HOME_TITLE = "Galeria de Trabalhos";
const GALLERY_HOME_SUBTITLE = "Escolha um álbum para ver o trabalho completo.";
// Filtra o ficheiro de dados para garantir que só entram álbuns com fotos válidas.
const PROJECT_ALBUM_LIST = PROJECT_ALBUMS.filter(
	(album) => Array.isArray(album.photos) && album.photos.length,
);
// Guarda o álbum atualmente aberto dentro do modal para controlar navegação e estado.
let currentAlbumId = null;
// Guarda o índice da foto aberta no lightbox ampliado para ativar navegação por setas.
let currentPhotoIndex = -1;

let db = null;
// O JS troca estas imagens em applyTheme() quando o utilizador alterna o tema.
const LOGO_LIGHT = "img/projetos/imgGerais/slogan.png";
const LOGO_DARK = "img/projetos/imgGerais/sloganVersao2.png";
let selectedPhoneCountry =
	PHONE_COUNTRIES.find((country) => country.code === "PT") ||
	PHONE_COUNTRIES[0];

// Normaliza texto para permitir pesquisa de países sem acentos e com nomes alternativos.
function normalizeText(value) {
	return String(value || "")
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();
}

// Mostra um feedback subtil por baixo de um campo validado pelo JavaScript.
function setFieldFeedback(element, message, state = "") {
	if (!element) {
		return;
	}
	element.textContent = message;
	element.classList.remove("is-valid", "is-invalid");
	if (state) {
		element.classList.add(state === "valid" ? "is-valid" : "is-invalid");
	}
}

// Validação algorítmica de NIF português com 9 dígitos e dígito de controlo.
function validarNIF(nif) {
	if (!/^\d{9}$/.test(nif)) return false;

	let total = 0;
	for (let index = 0; index < 8; index += 1) {
		total += Number(nif[index]) * (9 - index);
	}

	const resto = total % 11;
	let digito = 11 - resto;
	if (digito >= 10) digito = 0;

	return digito === Number(nif[8]);
}

// Validação leve do email, conforme pedido, garantindo pelo menos estrutura básica com @.
function validarEmail(email) {
	return /^[^\s@]+@[^\s@]+$/.test(String(email || "").trim());
}

// Mantém apenas dígitos no NIF e impede mais de 9 caracteres.
function sanitizeNifInput() {
	if (!nifInput) {
		return;
	}
	nifInput.value = nifInput.value.replace(/\D/g, "").slice(0, 9);
}

// Apresenta o estado atual do NIF por baixo do campo sem usar alert().
function updateNifFeedback() {
	if (!nifInput) {
		return true;
	}

	sanitizeNifInput();
	const nif = nifInput.value.trim();

	if (!nif) {
		nifInput.setCustomValidity("Preencha o NIF.");
		setFieldFeedback(nifFeedback, "");
		return false;
	}

	if (validarNIF(nif)) {
		nifInput.setCustomValidity("");
		setFieldFeedback(nifFeedback, "✓ NIF válido", "valid");
		return true;
	}

	nifInput.setCustomValidity("NIF inválido.");
	setFieldFeedback(nifFeedback, "✕ NIF inválido", "invalid");
	return false;
}

// Apresenta o estado atual do email por baixo do campo com feedback discreto.
function updateEmailFeedback() {
	if (!emailInput) {
		return true;
	}

	const email = emailInput.value.trim();
	if (!email) {
		emailInput.setCustomValidity("Preencha o email.");
		setFieldFeedback(emailFeedback, "");
		return false;
	}

	if (validarEmail(email)) {
		emailInput.setCustomValidity("");
		setFieldFeedback(emailFeedback, "✓ Email válido", "valid");
		return true;
	}

	emailInput.setCustomValidity("Email inválido.");
	setFieldFeedback(emailFeedback, "✕ Email inválido", "invalid");
	return false;
}

// Atualiza o botão do país e o valor final do telefone enviado no formulário.
function syncPhoneValue() {
	if (!selectedPhoneCountry || !phoneCountryFlag || !phoneCountryCode) {
		return;
	}

	phoneCountryFlag.textContent = selectedPhoneCountry.flag;
	phoneCountryCode.textContent = selectedPhoneCountry.dialCode;
	phoneCountryInput.value = selectedPhoneCountry.code;

	const rawNumber = phoneNumberInput.value.replace(/[^\d\s()-]/g, "").trim();
	phoneNumberInput.value = rawNumber;
	phoneHiddenInput.value = rawNumber
		? `${selectedPhoneCountry.dialCode} ${rawNumber}`
		: "";
}

// Feedback subtil do telefone; exige país escolhido e número preenchido.
function updatePhoneFeedback() {
	if (!phoneNumberInput) {
		return true;
	}

	syncPhoneValue();
	const hasCountry = Boolean(selectedPhoneCountry);
	const hasPhone = Boolean(phoneNumberInput.value.trim());

	if (!hasCountry || !hasPhone) {
		phoneNumberInput.setCustomValidity(
			"Preencha o telefone e selecione o país.",
		);
		if (phoneNumberInput.value.trim()) {
			setFieldFeedback(
				phoneFeedback,
				"✕ Escolha o país e complete o número",
				"invalid",
			);
		} else {
			setFieldFeedback(phoneFeedback, "");
		}
		return false;
	}

	phoneNumberInput.setCustomValidity("");
	setFieldFeedback(
		phoneFeedback,
		`✓ Telefone pronto com ${selectedPhoneCountry.dialCode}`,
		"valid",
	);
	return true;
}

// Filtra países pelo nome principal, aliases e variações sem acentos.
function getFilteredCountries(query) {
	const normalizedQuery = normalizeText(query);
	if (!normalizedQuery) {
		return PHONE_COUNTRIES;
	}

	return PHONE_COUNTRIES.filter((country) => {
		const haystack = normalizeText(
			`${country.name} ${country.aliases.join(" ")} ${country.dialCode} ${country.code}`,
		);
		return haystack.includes(normalizedQuery);
	});
}

// Desenha a lista clicável de países dentro do painel do telefone.
function renderPhoneCountryOptions(query = "") {
	if (!phoneCountryList) {
		return;
	}

	const countries = getFilteredCountries(query);
	phoneCountryList.innerHTML = "";

	if (!countries.length) {
		phoneCountryList.innerHTML =
			'<div class="phone-country-empty">Nenhum país encontrado.</div>';
		return;
	}

	countries.forEach((country) => {
		const option = document.createElement("button");
		option.type = "button";
		option.className = "phone-country-option";
		option.innerHTML = `
			<span>${country.flag}</span>
			<span>
				<strong>${country.name}</strong><br />
				<small>${country.code}</small>
			</span>
			<span class="phone-country-option-code">${country.dialCode}</span>
		`;
		option.addEventListener("click", () => {
			selectedPhoneCountry = country;
			syncPhoneValue();
			updatePhoneFeedback();
			closePhoneCountryPanel();
			phoneNumberInput.focus();
		});
		phoneCountryList.appendChild(option);
	});
}

function openPhoneCountryPanel() {
	if (!phoneCountryPanel || !phoneCountryButton) {
		return;
	}
	phoneCountryPanel.hidden = false;
	phoneCountryButton.setAttribute("aria-expanded", "true");
	renderPhoneCountryOptions(phoneCountrySearch.value);
	window.requestAnimationFrame(() => {
		phoneCountrySearch.focus();
	});
}

// Fecha o painel de países e devolve o campo composto ao estado normal do formulário.
function closePhoneCountryPanel() {
	if (!phoneCountryPanel || !phoneCountryButton) {
		return;
	}
	phoneCountryPanel.hidden = true;
	phoneCountryButton.setAttribute("aria-expanded", "false");
}

// Ativa o seletor pesquisável de país dentro do campo de telefone.
function setupPhoneField() {
	if (
		!phoneField ||
		!phoneCountryButton ||
		!phoneNumberInput ||
		!phoneCountryPanel ||
		!phoneCountrySearch ||
		!phoneCountryList
	) {
		return;
	}

	syncPhoneValue();
	renderPhoneCountryOptions();

	phoneCountryButton.addEventListener("click", () => {
		if (phoneCountryPanel.hidden) {
			openPhoneCountryPanel();
			return;
		}
		closePhoneCountryPanel();
	});

	phoneCountrySearch.addEventListener("input", () => {
		renderPhoneCountryOptions(phoneCountrySearch.value);
	});

	phoneCountrySearch.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closePhoneCountryPanel();
			phoneCountryButton.focus();
		}
	});

	phoneNumberInput.addEventListener("input", () => {
		updatePhoneFeedback();
	});

	document.addEventListener("click", (event) => {
		if (
			!phoneField.contains(event.target) &&
			!phoneCountryPanel.contains(event.target)
		) {
			closePhoneCountryPanel();
		}
	});
}

// Liga os eventos de validação subtil dos campos NIF, email e telefone.
function setupContactValidation() {
	if (nifInput) {
		nifInput.addEventListener("input", updateNifFeedback);
		nifInput.addEventListener("blur", updateNifFeedback);
	}

	if (emailInput) {
		emailInput.addEventListener("input", updateEmailFeedback);
		emailInput.addEventListener("blur", updateEmailFeedback);
	}
}

// Injeta um fallback remoto se alguma imagem local do projeto ou do álbum falhar ao carregar.
function setImageFallback(image) {
	image.onerror = () => {
		image.onerror = null;
		image.src = FALLBACK_IMAGE;
	};
}

// Cria a tag <img> base usada tanto no preview dos álbuns como nas fotos internas do lightbox.
function createProjectImage(photo) {
	const image = document.createElement("img");
	image.src = photo.src;
	image.alt = photo.alt;
	image.loading = "lazy";
	setImageFallback(image);
	return image;
}

// Procura um álbum pelo id vindo do botão clicado em renderProjects() ou renderAlbumList().
function getAlbumById(albumId) {
	return PROJECT_ALBUM_LIST.find((album) => album.id === albumId) || null;
}

// Devolve o álbum atualmente aberto no modal principal; serve de base à navegação da foto ampliada.
function getCurrentAlbum() {
	return currentAlbumId ? getAlbumById(currentAlbumId) : null;
}

// Separa as três primeiras fotos para compor a capa empilhada do álbum na home e no modal.
function getAlbumPreviewPhotos(album) {
	return album.photos.slice(0, 3);
}

// Atualiza os textos do topo do modal conforme o utilizador navega entre lista e álbum interno.
function updateGalleryHeader(title, subtitle, showBackButton = false) {
	if (galleryTitle) galleryTitle.textContent = title;
	if (gallerySubtitle) gallerySubtitle.textContent = subtitle;
	if (galleryBackButton) galleryBackButton.hidden = !showBackButton;
}

// Estado vazio reutilizável quando não existem álbuns ou fotos para apresentar.
function createEmptyGalleryState(message) {
	const emptyState = document.createElement("div");
	emptyState.className = "gallery-empty";
	emptyState.textContent = message;
	return emptyState;
}

// Monta cada cartão de álbum ligado ao CSS .album-stack e ao clique tratado em bindEvents().
function createAlbumCard(album) {
	const card = document.createElement("article");
	card.className = "project-card project-album-card";

	const trigger = document.createElement("button");
	trigger.type = "button";
	trigger.className = "project-album-trigger";
	trigger.dataset.albumId = album.id;
	trigger.setAttribute("aria-label", `Abrir álbum ${album.title}`);

	const stack = document.createElement("div");
	stack.className = "album-stack";

	getAlbumPreviewPhotos(album).forEach((photo) => {
		const layer = document.createElement("div");
		layer.className = "album-stack-photo";
		layer.appendChild(createProjectImage(photo));
		stack.appendChild(layer);
	});

	const info = document.createElement("div");
	info.className = "info";

	const meta = document.createElement("div");
	meta.className = "album-meta";

	const textWrap = document.createElement("div");

	const title = document.createElement("h3");
	title.textContent = album.title;

	const description = document.createElement("p");
	description.textContent = "Clique para abrir este álbum";

	textWrap.append(title, description);

	const count = document.createElement("span");
	count.className = "album-count";
	count.textContent = `${album.photos.length} fotos`;

	meta.append(textWrap, count);
	info.appendChild(meta);
	trigger.append(stack, info);
	card.appendChild(trigger);
	return card;
}

// Monta cada foto do álbum aberto; o CSS usa --photo-shift para espalhar lateralmente as cartas.
function createProjectPhotoCard(photo, index, album) {
	const card = document.createElement("article");
	card.className = "project-card project-photo-card";
	card.style.setProperty("--photo-shift", `${Math.min(index * 6, 30)}px`);

	const trigger = document.createElement("button");
	trigger.type = "button";
	trigger.className = "project-zoom";
	trigger.dataset.src = photo.src;
	trigger.dataset.alt = photo.alt;
	trigger.dataset.index = String(index);
	trigger.setAttribute("aria-label", `Ampliar ${photo.alt}`);
	trigger.appendChild(createProjectImage(photo));

	const info = document.createElement("div");
	info.className = "info";
	info.textContent = `Foto ${index + 1} de ${album.photos.length}`;

	card.append(trigger, info);
	return card;
}

// Renderiza apenas os cinco álbuns do preview da home dentro de #preview-grid.
function renderProjects() {
	previewGrid.innerHTML = "";
	const previewAlbums = PROJECT_ALBUM_LIST.slice(0, GALLERY_PREVIEW_LIMIT);
	if (!previewAlbums.length) {
		previewGrid.appendChild(
			createEmptyGalleryState(
				"Nenhum álbum de projetos disponível de momento.",
			),
		);
		return;
	}
	previewAlbums.forEach((album) => {
		previewGrid.appendChild(createAlbumCard(album));
	});
}

// Mostra a lista completa de álbuns dentro do modal principal da galeria.
function renderAlbumList() {
	galleryGrid.innerHTML = "";
	galleryGrid.classList.remove("is-album-view");
	currentAlbumId = null;
	updateGalleryHeader(GALLERY_HOME_TITLE, GALLERY_HOME_SUBTITLE, false);

	if (!PROJECT_ALBUM_LIST.length) {
		galleryGrid.appendChild(
			createEmptyGalleryState("Ainda não existem álbuns publicados."),
		);
		return;
	}

	PROJECT_ALBUM_LIST.forEach((album) => {
		galleryGrid.appendChild(createAlbumCard(album));
	});
}

// Abre um álbum específico dentro do modal e substitui a lista por todas as fotos daquele trabalho.
function openAlbum(albumId) {
	const album = getAlbumById(albumId);
	if (!album) {
		renderAlbumList();
		return;
	}

	currentAlbumId = album.id;
	galleryGrid.innerHTML = "";
	galleryGrid.classList.add("is-album-view");
	updateGalleryHeader(
		album.title,
		`${album.photos.length} fotografias neste trabalho.`,
		true,
	);

	album.photos.forEach((photo, index) => {
		galleryGrid.appendChild(createProjectPhotoCard(photo, index, album));
	});
}

// Abre o modal principal da galeria e mostra os álbuns ou um álbum específico.
function openGallery(albumId = null) {
	lightbox.classList.add("open");
	lightbox.setAttribute("aria-hidden", "false");
	if (albumId) {
		openAlbum(albumId);
	} else {
		renderAlbumList();
	}
	updateBodyLock();
}

// Fecha o modal principal da galeria.
function closeGallery() {
	closePhotoLightbox();
	currentAlbumId = null;
	lightbox.classList.remove("open");
	lightbox.setAttribute("aria-hidden", "true");
	galleryGrid.classList.remove("is-album-view");
	updateBodyLock();
}

// Atualiza a visibilidade das setas da foto ampliada conforme a posição atual dentro do álbum.
function syncPhotoLightboxNavigation(album, index) {
	if (!photoLightboxPrevButton || !photoLightboxNextButton) {
		return;
	}

	const totalPhotos = album?.photos?.length || 0;
	photoLightboxPrevButton.hidden = index <= 0;
	photoLightboxNextButton.hidden = index < 0 || index >= totalPhotos - 1;
}

// Troca a foto ampliada para um índice específico do álbum aberto sem fechar o lightbox.
function showPhotoAtIndex(index) {
	const album = getCurrentAlbum();
	if (!album || !photoLightboxImage) {
		return;
	}

	if (index < 0 || index >= album.photos.length) {
		return;
	}

	const photo = album.photos[index];
	currentPhotoIndex = index;
	photoLightboxImage.src = photo.src;
	photoLightboxImage.alt = photo.alt;
	syncPhotoLightboxNavigation(album, index);
}

// Abre a ampliação de uma foto específica clicada dentro da galeria.
function openPhotoLightbox(index, src, altText = "Foto do projeto ampliada") {
	if (!photoLightbox || !photoLightboxImage) {
		return;
	}
	photoLightbox.classList.add("open");
	photoLightbox.setAttribute("aria-hidden", "false");
	const numericIndex = Number(index);
	if (Number.isInteger(numericIndex) && numericIndex >= 0) {
		showPhotoAtIndex(numericIndex);
	} else {
		currentPhotoIndex = -1;
		photoLightboxImage.src = src;
		photoLightboxImage.alt = altText;
		syncPhotoLightboxNavigation(null, -1);
	}
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
	currentPhotoIndex = -1;
	syncPhotoLightboxNavigation(null, -1);
	updateBodyLock();
}

// Avança ou recua no álbum atual a partir da foto já aberta no visualizador ampliado.
function stepPhotoLightbox(direction) {
	const album = getCurrentAlbum();
	if (!album || currentPhotoIndex < 0) {
		return;
	}

	const nextIndex = currentPhotoIndex + direction;
	if (nextIndex < 0 || nextIndex >= album.photos.length) {
		return;
	}

	showPhotoAtIndex(nextIndex);
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
// 1) liga body.theme-dark, que altera cores via CSS;
// 2) troca o logótipo para o escuro.
function applyTheme() {
	document.body.classList.add("theme-dark");

	if (brandLogo) {
		brandLogo.src = LOGO_DARK;
	}
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
		const nifValid = updateNifFeedback();
		const emailValid = updateEmailFeedback();
		const phoneValid = updatePhoneFeedback();

		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		if (!nifValid || !emailValid || !phoneValid) {
			form.reportValidity();
			return;
		}

		syncPhoneValue();
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
		selectedPhoneCountry =
			PHONE_COUNTRIES.find((country) => country.code === "PT") ||
			PHONE_COUNTRIES[0];
		nifInput.setCustomValidity("");
		emailInput.setCustomValidity("");
		phoneNumberInput.setCustomValidity("");
		syncPhoneValue();
		setFieldFeedback(nifFeedback, "");
		setFieldFeedback(emailFeedback, "");
		setFieldFeedback(phoneFeedback, "");
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
	previewGrid.addEventListener("click", (event) => {
		const albumTrigger = event.target.closest(".project-album-trigger");
		if (!albumTrigger) return;
		openGallery(albumTrigger.dataset.albumId);
	});

	// O CTA abaixo dos cinco álbuns abre o modal com a lista completa de trabalhos.
	if (openFullGalleryButton) {
		openFullGalleryButton.addEventListener("click", () => {
			openGallery();
		});
	}

	closeLightboxButton.addEventListener("click", closeGallery);

	lightbox.addEventListener("click", (event) => {
		if (event.target === lightbox) closeGallery();
	});

	galleryGrid.addEventListener("click", (event) => {
		const albumTrigger = event.target.closest(".project-album-trigger");
		if (albumTrigger) {
			openAlbum(albumTrigger.dataset.albumId);
			return;
		}
		const trigger = event.target.closest(".project-zoom");
		if (!trigger) return;
		openPhotoLightbox(
			trigger.dataset.index,
			trigger.dataset.src,
			trigger.dataset.alt,
		);
	});

	if (galleryBackButton) {
		galleryBackButton.addEventListener("click", () => {
			renderAlbumList();
		});
	}

	if (closePhotoLightboxButton) {
		closePhotoLightboxButton.addEventListener("click", closePhotoLightbox);
	}

	if (photoLightboxPrevButton) {
		photoLightboxPrevButton.addEventListener("click", () => {
			stepPhotoLightbox(-1);
		});
	}

	if (photoLightboxNextButton) {
		photoLightboxNextButton.addEventListener("click", () => {
			stepPhotoLightbox(1);
		});
	}

	if (photoLightbox) {
		photoLightbox.addEventListener("click", (event) => {
			if (event.target === photoLightbox) closePhotoLightbox();
		});
	}

	document.addEventListener("keydown", (event) => {
		if (
			photoLightbox &&
			photoLightbox.classList.contains("open") &&
			event.key === "ArrowLeft"
		) {
			stepPhotoLightbox(-1);
			return;
		}

		if (
			photoLightbox &&
			photoLightbox.classList.contains("open") &&
			event.key === "ArrowRight"
		) {
			stepPhotoLightbox(1);
			return;
		}

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
	setupPhoneField();
	setupContactValidation();
	setupContactForm();
	setupReviewRating();
	setupFirebaseReviews();
	setupReviewForm();
	applyTheme();
	setupHeaderScroll();
	setupMobileMenu();
	bindEvents();
	document.getElementById("year").textContent = new Date().getFullYear();
}

// Animação automática das features do flyer promocional
const promoCards = document.querySelectorAll(".promo-card");

promoCards.forEach((card) => {
	const features = card.querySelectorAll(".feature");

	if (!features.length) {
		return;
	}

	let index = 0;

	features.forEach((feature, featureIndex) => {
		feature.classList.toggle("active", featureIndex === 0);
	});

	setInterval(() => {
		features[index].classList.remove("active");

		index = (index + 1) % features.length;

		features[index].classList.add("active");
	}, 2000);
});

init();
