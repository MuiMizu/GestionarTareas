const $ = (id) => document.getElementById(id);

const key = "tasky-tareas";

const columns = [
  { key: "En curso", title: "In Progress" },
  { key: "Completada", title: "Completed" },
  { key: "Retrasada", title: "Over-Due" }
];

const form = $("formularioTarea");
const board = $("tablero");
const modal = $("ventanaModal");
const modalTitle = $("tituloModal");

function dateShift(d) {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
}

let tasks = JSON.parse(localStorage.getItem(key) || "[]");

if (!tasks.length) {
  tasks = ["Retrasada", "En curso", "Completada"].map((s, i) => ({
    id: crypto.randomUUID(),
    title: ["User Flow", "Website Design", "API Docs"][i],
    description: [
      "Diseñar un dashboard claro.",
      "Diseñar landing con CTA.",
      "Documentar endpoints clave."
    ][i],
    subject: ["UX Design", "Development", "Backend"][i],
    priority: ["Alta", "Media", "Baja"][i],
    dueDate: dateShift(i - 1),
    status: s
  }));
}

const save = () => localStorage.setItem(key, JSON.stringify(tasks));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "2-digit"
  });

const score = (p) => ({ Alta: 3, Media: 2, Baja: 1 }[p] || 0);

const visible = () => {
  const txt = $("inputBusqueda").value.toLowerCase();
  const subj = $("filtroMateria").value.toLowerCase().trim();
  const prio = $("filtroPrioridad").value;
  const sort = $("selectorOrden").value;

  return tasks
    .filter(
      (t) =>
        (!txt || (t.title + t.description).toLowerCase().includes(txt)) &&
        (!subj || t.subject.toLowerCase().includes(subj)) &&
        (!prio || t.priority === prio)
    )
    .sort(
      sort === "prioridad"
        ? (a, b) => score(b.priority) - score(a.priority)
        : sort === "estado"
        ? (a, b) => a.status.localeCompare(b.status)
        : (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
    );
};

const pill = (text, cls = "") => {
  const s = document.createElement("span");
  s.className = `etiqueta ${cls}`.trim();
  s.textContent = text;
  return s;
};

function render() {
  board.innerHTML = "";
  const list = visible();

  columns.forEach((col) => {
    const c = document.createElement("section");
    c.className = "columna";
    c.innerHTML = `<header><span>${col.title}</span><span>(${tasks.filter(
      (t) => t.status === col.key
    ).length})</span></header>`;

    list
      .filter((t) => t.status === col.key)
      .forEach((t) => c.append(buildCard(t)));

    board.append(c);
  });
}

function buildCard(t) {
  const tpl = $("plantillaTarjeta").content.cloneNode(true);
  const card = tpl.querySelector(".tarjeta");
  const pills = tpl.querySelector(".grupo-etiquetas");

  card.dataset.id = t.id;

  pills.append(
    pill(
      t.priority,
      t.priority === "Alta" ? "red" : t.priority === "Media" ? "orange" : "green"
    ),
    pill(fmtDate(t.dueDate)),
    pill(t.subject)
  );

  tpl.querySelector(".titulo-tarjeta").textContent = t.title;

  const desc = tpl.querySelector(".descripcion-tarjeta");
  desc.textContent = t.description;

  tpl.querySelector(".boton-editar").onclick = () => open(t);
  tpl.querySelector(".boton-eliminar").onclick = () => del(t.id);
  tpl.querySelector(".boton-detalles").onclick = () =>
    alert(
      `${t.title}\n\nMateria: ${t.subject}\nPrioridad: ${t.priority}\nEstado: ${t.status}\nEntrega: ${t.dueDate}\n\n${t.description}`
    );
  tpl.querySelector(".boton-completar").onclick = () => setStatus(t.id, "Completada");

  return card;
}

function open(t) {
  modal.classList.remove("oculto");
  document.body.style.overflow = "hidden";

  modalTitle.textContent = t ? "Editar tarea" : "Nueva tarea";

  form.reset();
  form.idTarea.value = t?.id || "";
  form.fechaEntrega.value = t?.dueDate || dateShift(0);
  form.materia.value = t?.subject || "";
  form.prioridad.value = t?.priority || "Alta";
  form.estado.value = t?.status || "En curso";
  form.titulo.value = t?.title || "";
  form.descripcion.value = t?.description || "";
}

function close() {
  modal.classList.add("oculto");
  document.body.style.overflow = "";
}

function saveTask(data) {
  const exists = data.id && tasks.some((x) => x.id === data.id);

  if (!exists) data.id = crypto.randomUUID();

  tasks = exists
    ? tasks.map((t) => (t.id === data.id ? data : t))
    : [...tasks, data];

  save();
  render();
}

function del(id) {
  if (confirm("¿Eliminar la tarea?")) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }
}

function setStatus(id, status) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, status } : t));
  save();
  render();
}

$("botonAgregarTarea").onclick = () => open();
$("cerrarModal").onclick = $("botonCancelar").onclick = close;

modal.onclick = (e) => {
  if (e.target === modal) close();
};

["inputBusqueda", "filtroMateria", "filtroPrioridad", "selectorOrden"].forEach(
  (id) => ($(id).oninput = render)
);

form.onsubmit = (e) => {
  e.preventDefault();

  saveTask({
    id: form.idTarea.value || null,
    dueDate: form.fechaEntrega.value,
    subject: form.materia.value.trim(),
    priority: form.prioridad.value,
    status: form.estado.value,
    title: form.titulo.value.trim(),
    description: form.descripcion.value.trim()
  });

  close();
};

render();

