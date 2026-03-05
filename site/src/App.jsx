import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
	BASE_MEDIA,
	COMPANY,
	DEFAULT_REVIEWS,
	KEYS,
	PRIVATE_ROUTE,
	SERVICES,
	initStore,
	nextAvailableDate,
	readJson,
	today,
	writeJson,
} from "./lib";

const PUBLIC_ROUTES = [
	{ path: "/", label: "Inicio" },
	{ path: "/sobre", label: "Sobre" },
	{ path: "/projetos", label: "Projetos" },
	{ path: "/galeria", label: "Galeria" },
	{ path: "/contacto", label: "Contacto" },
];

// ROTA PRIVADA DA EMPRESA:
// Acesse no navegador: /acesso-empresa-medida-virante-portal-privado

function App() {
	const [path, setPath] = useState(
		window.location.hash.replace("#", "") || "/",
	);
	const [theme, setTheme] = useState(
		localStorage.getItem(KEYS.theme) || "light",
	);
	const [users, setUsers] = useState([]);
	const [orders, setOrders] = useState([]);
	const [session, setSession] = useState(null);
	const [media, setMedia] = useState([]);
	const [reviews, setReviews] = useState(DEFAULT_REVIEWS);

	useEffect(() => {
		initStore();
		setUsers(readJson(KEYS.users, []));
		setOrders(readJson(KEYS.orders, []));
		setSession(readJson(KEYS.session, null));
		setMedia(readJson(KEYS.media, []));
		setReviews(readJson(KEYS.reviews, DEFAULT_REVIEWS));

		const onPop = () => setPath(window.location.pathname);
		const onStorage = () => {
			setOrders(readJson(KEYS.orders, []));
			setMedia(readJson(KEYS.media, []));
			setReviews(readJson(KEYS.reviews, DEFAULT_REVIEWS));
			setUsers(readJson(KEYS.users, []));
			setSession(readJson(KEYS.session, null));
		};

		window.addEventListener("popstate", onPop);
		window.addEventListener("storage", onStorage);
		return () => {
			window.removeEventListener("popstate", onPop);
			window.removeEventListener("storage", onStorage);
		};
	}, []);

	useEffect(() => {
		document.body.setAttribute("data-theme", theme);
		localStorage.setItem(KEYS.theme, theme);
	}, [theme]);

	const employees = useMemo(
		() => users.filter((u) => u.role === "empregado"),
		[users],
	);
	const gallery = useMemo(() => [...BASE_MEDIA, ...media], [media]);
	const isPrivate = path === PRIVATE_ROUTE;

	const nav = (to) => {
		if (to === path) return;
		window.history.pushState({}, "", to);
		setPath(to);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const saveOrders = (next) => {
		setOrders(next);
		writeJson(KEYS.orders, next);
	};

	const saveUsers = (next) => {
		setUsers(next);
		writeJson(KEYS.users, next);
	};

	const addSiteOrder = (payload) => {
		const suggested = nextAvailableDate(
			orders,
			payload.date,
			payload.durationDays,
		);
		if (suggested !== payload.date) return { ok: false, suggested };
		const order = {
			...payload,
			id: `ord-${Date.now()}`,
			source: "site",
			status: "novo",
			paid: false,
			assignedTo: "",
		};
		saveOrders([order, ...orders]);
		return { ok: true, order };
	};

	const addManualOrder = (payload) => {
		const suggested = nextAvailableDate(
			orders,
			payload.date,
			payload.durationDays,
		);
		if (suggested !== payload.date) return { ok: false, suggested };
		const order = {
			...payload,
			id: `ord-${Date.now()}`,
			source: "whatsapp",
			status: payload.assignedTo ? "atribuido" : "novo",
		};
		saveOrders([order, ...orders]);
		return { ok: true };
	};

	const patchOrder = (id, patch) => {
		const next = orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
		saveOrders(next);
	};

	const login = ({ username, password }) => {
		const user = users.find(
			(u) => u.username === username && u.password === password,
		);
		if (!user) return false;
		const s = { username: user.username, role: user.role };
		setSession(s);
		writeJson(KEYS.session, s);
		return true;
	};

	const register = (payload) => {
		if (users.some((u) => u.username === payload.username)) return false;
		saveUsers([...users, payload]);
		return true;
	};

	const logout = () => {
		setSession(null);
		localStorage.removeItem(KEYS.session);
	};

	const addReview = (review) => {
		const next = [review, ...reviews];
		setReviews(next);
		writeJson(KEYS.reviews, next);
	};

	const addGalleryFiles = async (fileList) => {
		const items = await Promise.all(
			Array.from(fileList).map(
				(file) =>
					new Promise((resolve) => {
						const reader = new FileReader();
						reader.onload = () =>
							resolve({
								id: `media-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
								type: file.type.startsWith("video/") ? "video" : "image",
								label: file.name,
								url: reader.result,
							});
						reader.readAsDataURL(file);
					}),
			),
		);

		setMedia((prev) => {
			const next = [...items, ...prev];
			writeJson(KEYS.media, next);
			return next;
		});
	};

	const publicPath = PUBLIC_ROUTES.some((r) => r.path === path) ? path : "/";

	return (
		<div className={`app ${theme}`}>
			{!isPrivate && (
				<header className="topbar">
					<button className="brand" onClick={() => nav("/")}>
						<img src="/img/logo.jpeg" alt="Logo" />
						<span>{COMPANY.name}</span>
					</button>
					<nav>
						{PUBLIC_ROUTES.map((route) => (
							<button
								key={route.path}
								className={path === route.path ? "active" : ""}
								onClick={() => nav(route.path)}
							>
								{route.label}
							</button>
						))}
					</nav>
					<button
						className="theme"
						onClick={() => setTheme(theme === "light" ? "dark" : "light")}
					>
						{theme === "light" ? "Modo Escuro" : "Modo Claro"}
					</button>
				</header>
			)}

			{isPrivate ? (
				<PrivateArea
					session={session}
					employees={employees}
					orders={orders}
					onLogin={login}
					onRegister={register}
					onLogout={logout}
					onAddManual={addManualOrder}
					onPatch={patchOrder}
					onUpload={addGalleryFiles}
				/>
			) : (
				<PublicArea
					route={publicPath}
					orders={orders}
					gallery={gallery}
					reviews={reviews}
					onCreateOrder={addSiteOrder}
					onCreateReview={addReview}
					onNavigate={nav}
				/>
			)}
		</div>
	);
}

function PublicArea({
	route,
	orders,
	gallery,
	reviews,
	onCreateOrder,
	onCreateReview,
	onNavigate,
}) {
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [form, setForm] = useState({
		name: "",
		phone: "",
		serviceType: SERVICES[0],
		message: "",
		street: "",
		number: "",
		floor: "",
		side: "",
		postalCode: "",
		date: today(),
		durationDays: 1,
		channel: "whatsapp",
	});
	const [review, setReview] = useState({ name: "", rating: 5, text: "" });

	const submitOrder = (e) => {
		e.preventDefault();
		setError("");
		setMessage("");
		const address = `${form.street}, ${form.number}, ${form.floor || "-"}, ${form.side || "-"}, ${form.postalCode}`;
		const payload = {
			customerName: form.name,
			customerPhone: form.phone,
			serviceType: form.serviceType,
			notes: form.message,
			address,
			date: form.date,
			durationDays: Number(form.durationDays),
		};

		const suggestion = nextAvailableDate(
			orders,
			form.date,
			payload.durationDays,
		);
		if (suggestion !== form.date) {
			setError(
				`Esse servico so vai ser possivel prosseguir a partir de ${suggestion}.`,
			);
			return;
		}

		if (form.channel === "whatsapp") {
			const txt = `Ola, meu nome e ${form.name}. Tenho interesse em ${form.serviceType}. ${form.message}`;
			window.open(
				`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(txt)}`,
				"_blank",
			);
			setMessage("A abrir WhatsApp da empresa.");
			return;
		}

		const result = onCreateOrder(payload);
		if (!result.ok) {
			setError(
				`Esse servico so vai ser possivel prosseguir a partir de ${result.suggested}.`,
			);
			return;
		}

		setMessage(
			`Pedido registado. SMS de confirmacao simulada para ${form.phone}.`,
		);
	};

	const submitReview = (e) => {
		e.preventDefault();
		if (!review.name || !review.text) return;
		onCreateReview({
			...review,
			id: `r-${Date.now()}`,
			rating: Number(review.rating),
		});
		setReview({ name: "", rating: 5, text: "" });
	};

	return (
		<main className="page">
			{(route === "/" || route === "/sobre") && (
				<section className="card hero">
					<div className="hero-copy">
						<p className="tag">Lisboa, Portugal</p>
						<h1>{COMPANY.slogan}</h1>
						<p>
							Mais de 20 anos em instalacao, manutencao, limpeza e reparacao
							residencial e comercial.
						</p>
						<div className="hero-actions">
							<button onClick={() => onNavigate("/contacto")}>
								Pedir Orcamento
							</button>
							<a
								href={`https://wa.me/${COMPANY.whatsapp}`}
								target="_blank"
								rel="noreferrer"
							>
								Falar no WhatsApp
							</a>
						</div>
					</div>
					<div className="hero-media">
						<img src="/img/arCondicional.jpeg" alt="Ar condicionado" />
					</div>
				</section>
			)}

			{route === "/" && (
				<section className="card">
					<h2>Servicos</h2>
					<div className="grid service-grid">
						{SERVICES.map((service) => (
							<article key={service} className="service-card">
								<h3>{service}</h3>
								<p>
									Execucao tecnica com foco em performance, conforto e
									durabilidade.
								</p>
							</article>
						))}
					</div>
				</section>
			)}

			{(route === "/" || route === "/projetos") && (
				<section className="card">
					<h2>Projetos</h2>
					<div className="grid">
						{gallery
							.slice(0, route === "/" ? 6 : 12)
							.map((m) =>
								m.type === "video" ? (
									<video key={m.id} controls src={m.url} />
								) : (
									<img key={m.id} src={m.url} alt={m.label} />
								),
							)}
					</div>
				</section>
			)}

			{(route === "/" || route === "/galeria") && (
				<section className="card">
					<h2>Galeria Completa</h2>
					<div className="grid">
						{gallery.map((m) =>
							m.type === "video" ? (
								<video key={m.id} controls src={m.url} />
							) : (
								<img key={m.id} src={m.url} alt={m.label} />
							),
						)}
					</div>
				</section>
			)}

			{(route === "/" || route === "/contacto") && (
				<section className="card">
					<h2>Pedido de Servico</h2>
					<form className="form" onSubmit={submitOrder}>
						{[
							["name", "Nome"],
							["phone", "Telefone"],
							["street", "Rua"],
							["number", "Numero"],
							["floor", "Andar"],
							["side", "Esquerdo / Direito"],
							["postalCode", "Codigo Postal"],
						].map(([field, label]) => (
							<label key={field}>
								{label}
								<input
									name={field}
									value={form[field]}
									onChange={(e) =>
										setForm({ ...form, [field]: e.target.value })
									}
									required={[
										"name",
										"phone",
										"street",
										"number",
										"postalCode",
									].includes(field)}
								/>
							</label>
						))}

						<label>
							Servico
							<select
								value={form.serviceType}
								onChange={(e) =>
									setForm({ ...form, serviceType: e.target.value })
								}
							>
								{SERVICES.map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</label>

						<label>
							Data pretendida
							<input
								type="date"
								value={form.date}
								onChange={(e) => setForm({ ...form, date: e.target.value })}
							/>
						</label>

						<label>
							Duracao em dias
							<input
								type="number"
								min="1"
								max="10"
								value={form.durationDays}
								onChange={(e) =>
									setForm({ ...form, durationDays: e.target.value })
								}
							/>
						</label>

						<label className="full">
							Mensagem
							<textarea
								value={form.message}
								onChange={(e) => setForm({ ...form, message: e.target.value })}
								rows={4}
							/>
						</label>

						<fieldset className="full chooser">
							<legend>Como prefere seguir?</legend>
							<label>
								<input
									type="radio"
									checked={form.channel === "whatsapp"}
									onChange={() => setForm({ ...form, channel: "whatsapp" })}
								/>
								Falar direto no WhatsApp
							</label>
							<label>
								<input
									type="radio"
									checked={form.channel === "site"}
									onChange={() => setForm({ ...form, channel: "site" })}
								/>
								Seguir com pedido pelo site
							</label>
						</fieldset>

						<button className="full" type="submit">
							Enviar pedido
						</button>
					</form>

					{message && <p className="ok">{message}</p>}
					{error && <p className="error">{error}</p>}

					<div className="links">
						<a href={`https://wa.me/${COMPANY.whatsapp}`}>WhatsApp</a>
						<a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
						<a href={COMPANY.instagram} target="_blank" rel="noreferrer">
							Instagram
						</a>
					</div>
				</section>
			)}

			{route === "/" && (
				<section className="card">
					<h2>Depoimentos</h2>
					<div className="grid reviews">
						{reviews.map((r) => (
							<article key={r.id} className="review-card">
								<h4>{r.name}</h4>
								<p>Nota: {r.rating}/5</p>
								<p>{r.text}</p>
							</article>
						))}
					</div>
					<form className="form mini" onSubmit={submitReview}>
						<input
							placeholder="Seu nome"
							value={review.name}
							onChange={(e) => setReview({ ...review, name: e.target.value })}
						/>
						<select
							value={review.rating}
							onChange={(e) => setReview({ ...review, rating: e.target.value })}
						>
							<option value={5}>5</option>
							<option value={4}>4</option>
							<option value={3}>3</option>
						</select>
						<textarea
							placeholder="Escreva seu comentario"
							value={review.text}
							onChange={(e) => setReview({ ...review, text: e.target.value })}
							rows={3}
						/>
						<button type="submit">Publicar avaliacao</button>
					</form>
				</section>
			)}
		</main>
	);
}

function PrivateArea({
	session,
	employees,
	orders,
	onLogin,
	onRegister,
	onLogout,
	onAddManual,
	onPatch,
	onUpload,
}) {
	const [auth, setAuth] = useState({
		username: "",
		password: "",
		role: "empregado",
	});
	const [msg, setMsg] = useState("");
	const [manual, setManual] = useState({
		customerName: "",
		customerPhone: "",
		serviceType: SERVICES[0],
		address: "",
		date: today(),
		durationDays: 1,
		paid: false,
		assignedTo: "",
		notes: "",
	});

	if (!session) {
		return (
			<main className="page private-page">
				<section className="card auth">
					<form
						className="form mini"
						onSubmit={(e) => {
							e.preventDefault();
							if (!onLogin(auth)) setMsg("Credenciais invalidas.");
						}}
					>
						<h2>Login da Empresa</h2>
						<p>Utilizador inicial: supervisor / super123</p>
						<input
							placeholder="Utilizador"
							value={auth.username}
							onChange={(e) => setAuth({ ...auth, username: e.target.value })}
						/>
						<input
							type="password"
							placeholder="Senha"
							value={auth.password}
							onChange={(e) => setAuth({ ...auth, password: e.target.value })}
						/>
						<button type="submit">Entrar</button>
					</form>

					<form
						className="form mini"
						onSubmit={(e) => {
							e.preventDefault();
							setMsg(
								onRegister(auth)
									? "Utilizador criado."
									: "Utilizador ja existe.",
							);
						}}
					>
						<h2>Criar Utilizador</h2>
						<input
							placeholder="Utilizador"
							value={auth.username}
							onChange={(e) => setAuth({ ...auth, username: e.target.value })}
						/>
						<input
							type="password"
							placeholder="Senha"
							value={auth.password}
							onChange={(e) => setAuth({ ...auth, password: e.target.value })}
						/>
						<select
							value={auth.role}
							onChange={(e) => setAuth({ ...auth, role: e.target.value })}
						>
							<option value="supervisor">Supervisor</option>
							<option value="empregado">Empregado</option>
						</select>
						<button type="submit">Cadastrar</button>
					</form>
				</section>
				{msg && <p className="ok">{msg}</p>}
			</main>
		);
	}

	if (session.role === "empregado") {
		return (
			<main className="page private-page">
				<section className="card row-head">
					<h2>Painel Empregado</h2>
					<button onClick={onLogout}>Sair</button>
				</section>
				<section className="card">
					<h3>Servicos atribuidos</h3>
					<div className="grid reviews">
						{orders
							.filter((o) => o.assignedTo === session.username)
							.map((o) => (
								<article className="review-card" key={o.id}>
									<p>
										<strong>{o.serviceType}</strong>
									</p>
									<p>{o.customerName}</p>
									<p>{o.address}</p>
									<p>{o.date}</p>
								</article>
							))}
					</div>
				</section>
			</main>
		);
	}

	return (
		<main className="page private-page">
			<section className="card row-head">
				<h2>Painel Supervisor</h2>
				<button onClick={onLogout}>Sair</button>
			</section>

			<section className="card">
				<h3>Novo servico manual (WhatsApp)</h3>
				<form
					className="form"
					onSubmit={(e) => {
						e.preventDefault();
						const r = onAddManual({
							...manual,
							durationDays: Number(manual.durationDays),
						});
						setMsg(
							r.ok
								? "Servico criado com sucesso."
								: `Sem vaga. Proxima data: ${r.suggested}`,
						);
					}}
				>
					<input
						placeholder="Nome do cliente"
						value={manual.customerName}
						onChange={(e) =>
							setManual({ ...manual, customerName: e.target.value })
						}
					/>
					<input
						placeholder="Telefone"
						value={manual.customerPhone}
						onChange={(e) =>
							setManual({ ...manual, customerPhone: e.target.value })
						}
					/>
					<input
						placeholder="Endereco"
						value={manual.address}
						onChange={(e) => setManual({ ...manual, address: e.target.value })}
					/>

					<label>
						Servico
						<select
							value={manual.serviceType}
							onChange={(e) =>
								setManual({ ...manual, serviceType: e.target.value })
							}
						>
							{SERVICES.map((s) => (
								<option key={s}>{s}</option>
							))}
						</select>
					</label>

					<label>
						Data
						<input
							type="date"
							value={manual.date}
							onChange={(e) => setManual({ ...manual, date: e.target.value })}
						/>
					</label>

					<label>
						Duracao em dias
						<input
							type="number"
							min="1"
							max="10"
							value={manual.durationDays}
							onChange={(e) =>
								setManual({ ...manual, durationDays: e.target.value })
							}
						/>
					</label>

					<label>
						Pago?
						<select
							value={String(manual.paid)}
							onChange={(e) =>
								setManual({ ...manual, paid: e.target.value === "true" })
							}
						>
							<option value="false">Nao</option>
							<option value="true">Sim</option>
						</select>
					</label>

					<label>
						Empregado
						<select
							value={manual.assignedTo}
							onChange={(e) =>
								setManual({ ...manual, assignedTo: e.target.value })
							}
						>
							<option value="">---</option>
							{employees.map((emp) => (
								<option key={emp.username} value={emp.username}>
									{emp.username}
								</option>
							))}
						</select>
					</label>

					<button type="submit">Inserir servico</button>
				</form>
				{msg && <p className="ok">{msg}</p>}
			</section>

			<section className="card">
				<h3>Pedidos</h3>
				<div className="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Cliente</th>
								<th>Servico</th>
								<th>Data</th>
								<th>Dias</th>
								<th>Pago</th>
								<th>Empregado</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o.id}>
									<td>{o.customerName}</td>
									<td>{o.serviceType}</td>
									<td>{o.date}</td>
									<td>{o.durationDays}</td>
									<td>
										<select
											value={String(o.paid)}
											onChange={(e) =>
												onPatch(o.id, { paid: e.target.value === "true" })
											}
										>
											<option value="false">Nao</option>
											<option value="true">Sim</option>
										</select>
									</td>
									<td>
										<select
											value={o.assignedTo || ""}
											onChange={(e) =>
												onPatch(o.id, { assignedTo: e.target.value })
											}
										>
											<option value="">---</option>
											{employees.map((emp) => (
												<option key={emp.username}>{emp.username}</option>
											))}
										</select>
									</td>
									<td>
										<select
											value={o.status}
											onChange={(e) =>
												onPatch(o.id, { status: e.target.value })
											}
										>
											<option value="novo">Novo</option>
											<option value="atribuido">Atribuido</option>
											<option value="concluido">Concluido</option>
										</select>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<section className="card">
				<h3>Upload de fotos e videos para galeria publica</h3>
				<input
					type="file"
					multiple
					accept="image/*,video/*"
					onChange={(e) => onUpload(e.target.files)}
				/>
			</section>
		</main>
	);
}

export default App;
