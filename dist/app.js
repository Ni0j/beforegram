const STORAGE_KEY = "beforegram-account-v1";

const icons = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5v10H15v-6H9v6H3z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7.5"/><path d="m16.5 16.5 4 4"/></svg>',
  create: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
  profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.4 3.2-6.5 7.5-6.5s6.8 2.1 7.5 6.5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.5 9.5 0 0 1-3.9-.9L3 20.5l1.5-4.7A8.4 8.4 0 1 1 21 11.5Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-9.6 20-2.1-8.3L2 10.3 22 2Z"/><path d="m10.3 13.7 4.8-4.8"/></svg>',
  save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14v18l-7-4-7 4z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18"/><path d="M3 10h18M10 3v18"/></svg>'
};

const defaultAccount = () => ({
  username: "yourfutureaccount",
  displayName: "Your Future Account",
  avatar: "",
  bio: "Add a bio to introduce your future account.",
  category: "Digital creator",
  link: "",
  posts: []
});

let account = loadAccount();
let view = "landing";
let route = "home";
let activePostId = null;
let dashboardOpen = false;
let createImage = "";

function loadAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.posts) ? { ...defaultAccount(), ...saved } : defaultAccount();
  } catch { return defaultAccount(); }
}

function saveAccount() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(account)); }
  catch { toast("That image is too large for this browser. Try a smaller file."); }
}

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function safeLink(value = "") {
  if (!value.trim()) return "";
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function initials() {
  return (account.displayName || account.username || "Y").split(/\s+/).slice(0, 2).map(x => x[0]).join("");
}

function avatar(size = "") {
  return account.avatar
    ? `<img class="avatar ${size}" src="${account.avatar}" alt="${esc(account.displayName)} avatar">`
    : `<div class="avatar avatar-fallback ${size}" aria-label="Avatar placeholder">${esc(initials())}</div>`;
}

function render() {
  const app = document.querySelector("#app");
  if (view === "landing") app.innerHTML = landingTemplate();
  if (view === "setup") app.innerHTML = setupTemplate();
  if (view === "simulator") app.innerHTML = simulatorTemplate();
  bindEvents();
}

function landingTemplate() {
  return `<section class="landing">
    <div class="landing-card">
      <div class="landing-mark" aria-hidden="true"></div>
      <h1>Build your Instagram before you launch it.</h1>
      <div class="landing-actions">
        <button class="primary" data-action="prepare">Start with my content</button>
        <button class="secondary" data-action="open-blank">Open blank Instagram</button>
      </div>
    </div>
  </section>`;
}

function setupTemplate() {
  return `<section class="setup"><div class="setup-panel">
    <header class="setup-head"><button class="icon-button" data-action="landing" aria-label="Back">${icons.back}</button><h1>Prepare your account</h1></header>
    <form id="setup-form">
      <div class="form-grid">
        ${field("Username", "username", account.username, "yourfutureaccount")}
        ${field("Display name", "displayName", account.displayName, "Your Future Account")}
        ${field("Category", "category", account.category, "Digital creator")}
        ${field("Link", "link", account.link, "yourwebsite.com")}
        <div class="field full"><label for="setup-bio">Bio</label><textarea id="setup-bio" name="bio" placeholder="What should people know?">${esc(account.bio)}</textarea></div>
        <div class="field"><label for="setup-avatar">Avatar</label><input id="setup-avatar" name="avatar" type="file" accept="image/*"></div>
        <div class="field"><label for="setup-posts">Post images</label><input id="setup-posts" name="posts" type="file" accept="image/*" multiple></div>
        <div class="field full"><label for="setup-captions">Captions</label><textarea id="setup-captions" name="captions" placeholder="One caption per image"></textarea><p class="hint">Captions are matched to images in order.</p></div>
      </div>
      <button class="primary setup-submit" type="submit">Generate my Instagram</button>
    </form>
  </div></section>`;
}

function field(label, name, value, placeholder) {
  return `<div class="field"><label for="setup-${name}">${label}</label><input id="setup-${name}" name="${name}" value="${esc(value)}" placeholder="${placeholder}"></div>`;
}

function simulatorTemplate() {
  return `<section class="workspace">
    <div class="stage">
      <div class="phone">
        <div class="status-bar"><span>9:41</span><span class="status-icons">● ◔ ▰</span></div>
        <div class="screen" id="screen">${routeTemplate()}</div>
        ${route === "comments" ? commentFormTemplate() : ""}
        ${navTemplate()}
      </div>
      <button class="edit-toggle" data-action="toggle-dashboard">Edit preview</button>
    </div>
    ${dashboardOpen ? dashboardTemplate() : ""}
  </section>`;
}

function routeTemplate() {
  if (route === "search") return searchTemplate();
  if (route === "create") return createTemplate();
  if (route === "profile") return profileTemplate();
  if (route === "post") return postDetailTemplate();
  if (route === "comments") return commentsTemplate();
  return homeTemplate();
}

function navTemplate() {
  const current = ["post", "comments"].includes(route) ? "profile" : route;
  return `<nav class="nav" aria-label="Instagram preview navigation">
    ${navButton("home", "Home", icons.home, current)}
    ${navButton("search", "Search", icons.search, current)}
    ${navButton("create", "Create", icons.create, current)}
    ${navButton("profile", "Profile", account.avatar ? avatar() : icons.profile, current)}
  </nav>`;
}

function navButton(name, label, icon, current) {
  return `<button data-route="${name}" class="${current === name ? "active" : ""}" aria-label="${label}">${icon}</button>`;
}

function homeTemplate() {
  return `<header class="screen-header home-header"><span class="wordmark">Instagram</span><div class="header-actions">${icons.heart}${icons.send}</div></header>
    <div class="stories"><button class="story" data-route="profile"><span class="story-ring">${avatar()}</span><span>Your story</span></button></div>
    ${account.posts.length ? [...account.posts].reverse().map(postCard).join("") : emptyFeedTemplate()}`;
}

function emptyFeedTemplate() {
  return `<div class="empty-feed"><div><div class="empty-icon">${icons.create}</div><h2>Your future feed starts here</h2><p>Create a post, then browse it as your audience would.</p><button class="primary" data-route="create">Create first post</button></div></div>`;
}

function postCard(post) {
  return `<article class="post-card">
    <div class="post-author">${avatar()}<button data-route="profile"><strong>${esc(account.username)}</strong><span>${esc(account.category)}</span></button></div>
    <img class="post-image" src="${post.image}" alt="Post by ${esc(account.username)}" data-post="${post.id}">
    <div class="action-row"><button aria-label="Like">${icons.heart}</button><button aria-label="Comment" data-comments="${post.id}">${icons.comment}</button><button aria-label="Share">${icons.send}</button><button class="save" aria-label="Save">${icons.save}</button></div>
    <div class="post-copy"><p><strong>${esc(account.username)}</strong> ${esc(post.caption)}</p><button data-comments="${post.id}">View ${post.comments?.length || 0} comments</button></div>
  </article>`;
}

function searchTemplate() {
  return `<div class="search-wrap"><input class="search-input" id="search-input" placeholder="Search" aria-label="Search accounts"></div>
    <div class="search-label">Accounts</div><div id="search-results">${searchResultTemplate("")}</div>`;
}

function searchResultTemplate(query) {
  const text = query.trim().toLowerCase();
  const matches = !text || account.username.toLowerCase().includes(text) || account.displayName.toLowerCase().includes(text);
  return matches ? `<button class="search-result" data-route="profile">${avatar()}<span><strong>${esc(account.username)}</strong><span>${esc(account.displayName)} · ${esc(account.category)}</span></span></button>` : `<div class="empty-feed"><div><h2>No accounts found</h2><p>Try searching for ${esc(account.username)}.</p></div></div>`;
}

function profileTemplate() {
  const link = safeLink(account.link);
  return `<header class="screen-header"><strong>${esc(account.username)}</strong><span class="header-right">${icons.more}</span></header>
    <section class="profile-head"><div class="profile-top">${avatar("large")}<div class="stats"><span><strong>${account.posts.length}</strong>posts</span><span><strong>0</strong>followers</span><span><strong>0</strong>following</span></div></div>
      <div class="profile-bio"><strong>${esc(account.displayName)}</strong><span>${esc(account.category)}</span><span>${esc(account.bio).replace(/\n/g, "<br>")}</span>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(account.link)}</a>` : ""}</div>
      <div class="profile-buttons"><button class="small-button" data-action="toggle-dashboard">Edit profile</button><button class="small-button" data-route="create">Add post</button></div>
    </section>
    <div class="profile-tabs"><button aria-label="Posts">${icons.grid}</button><button aria-label="Mentions">${icons.profile}</button></div>
    ${account.posts.length ? `<div class="profile-grid">${[...account.posts].reverse().map(p => `<button class="grid-post" data-post="${p.id}"><img src="${p.image}" alt="Open post"></button>`).join("")}</div>` : `<div class="empty-grid"><div><h3>No posts yet</h3><p>Create a post to see your future profile come alive.</p></div></div>`}`;
}

function createTemplate() {
  return `<header class="screen-header"><strong>New post</strong></header><form id="create-form" class="create-view">
    <h2>Create a post</h2><p>It will appear everywhere this account is shown.</p>
    <label class="upload-box" for="create-file">${createImage ? `<img class="upload-preview" src="${createImage}" alt="Selected post preview">` : `<span>${icons.create}<br><br>Choose a photo</span>`}</label>
    <input class="hidden" id="create-file" type="file" accept="image/*" ${createImage ? "" : "required"}>
    <div class="field"><label for="create-caption">Caption</label><textarea id="create-caption" placeholder="Write a caption…"></textarea></div>
    <button class="primary setup-submit" type="submit">Share to preview</button>
  </form>`;
}

function activePost() { return account.posts.find(p => String(p.id) === String(activePostId)); }

function postDetailTemplate() {
  const post = activePost();
  if (!post) { route = "profile"; return profileTemplate(); }
  return `<header class="screen-header"><span class="header-left"><button class="icon-button" data-route="profile" aria-label="Back">${icons.back}</button></span><strong>Post</strong><span class="header-right"><button class="icon-button" data-action="post-menu" aria-label="Post options">${icons.more}</button></span></header>${postCard(post)}`;
}

function commentsTemplate() {
  const post = activePost();
  if (!post) { route = "profile"; return profileTemplate(); }
  const comments = post.comments || [];
  return `<header class="screen-header"><span class="header-left"><button class="icon-button" data-post="${post.id}" aria-label="Back">${icons.back}</button></span><strong>Comments</strong><span class="header-right"></span></header>
    <div class="comments"><div class="comment">${avatar()}<div><p><strong>${esc(account.username)}</strong> ${esc(post.caption)}</p><div class="comment-time">Preview post</div></div></div>
      ${comments.map(c => `<div class="comment">${avatar()}<div><p><strong>${esc(account.username)}</strong> ${esc(c.text)}</p><div class="comment-time">Just now</div></div></div>`).join("")}
    </div>`;
}

function commentFormTemplate() {
  return `<form class="comment-form" id="comment-form"><input id="comment-input" placeholder="Add a comment…" aria-label="Add a comment"><button type="submit">Post</button></form>`;
}

function dashboardTemplate() {
  return `<aside class="dashboard" aria-label="Account editor"><header class="dashboard-head"><h2>Edit account</h2><button class="icon-button" data-action="toggle-dashboard" aria-label="Close editor">×</button></header>
    <div class="dashboard-avatar">${avatar()}<div><label for="dashboard-avatar">Change profile photo</label><input class="hidden" id="dashboard-avatar" type="file" accept="image/*"></div></div>
    ${dashboardField("Username", "username", account.username)}
    ${dashboardField("Display name", "displayName", account.displayName)}
    ${dashboardField("Category", "category", account.category)}
    ${dashboardField("Link", "link", account.link)}
    <div class="field"><label for="dash-bio">Bio</label><textarea id="dash-bio" data-account="bio">${esc(account.bio)}</textarea></div>
    <button class="primary setup-submit" data-action="close-dashboard">Done</button>
    <p class="dashboard-note">Changes are saved on this device and update every view in the simulator.</p>
  </aside>`;
}

function dashboardField(label, key, value) {
  return `<div class="field"><label for="dash-${key}">${label}</label><input id="dash-${key}" data-account="${key}" value="${esc(value)}"></div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach(el => el.addEventListener("click", handleAction));
  document.querySelectorAll("[data-route]").forEach(el => el.addEventListener("click", () => go(el.dataset.route)));
  document.querySelectorAll("[data-post]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.post; go("post"); }));
  document.querySelectorAll("[data-comments]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.comments; go("comments"); }));

  document.querySelector("#setup-form")?.addEventListener("submit", submitSetup);
  document.querySelector("#create-form")?.addEventListener("submit", submitPost);
  document.querySelector("#comment-form")?.addEventListener("submit", submitComment);
  document.querySelector("#create-file")?.addEventListener("change", async event => { createImage = await fileToDataUrl(event.target.files[0]); render(); });
  document.querySelector("#dashboard-avatar")?.addEventListener("change", async event => { account.avatar = await fileToDataUrl(event.target.files[0]); saveAccount(); render(); });
  document.querySelector("#search-input")?.addEventListener("input", event => { document.querySelector("#search-results").innerHTML = searchResultTemplate(event.target.value); document.querySelector("#search-results [data-route]")?.addEventListener("click", () => go("profile")); });
  document.querySelectorAll("[data-account]").forEach(input => input.addEventListener("input", event => { account[event.target.dataset.account] = event.target.value; saveAccount(); renderScreenOnly(); }));
}

function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  if (action === "prepare") { view = "setup"; render(); }
  if (action === "landing") { view = "landing"; render(); }
  if (action === "open-blank") { view = "simulator"; route = "home"; render(); }
  if (action === "toggle-dashboard") { dashboardOpen = !dashboardOpen; render(); }
  if (action === "close-dashboard") { dashboardOpen = false; render(); }
  if (action === "post-menu") editPost();
}

function go(nextRoute) {
  route = nextRoute;
  createImage = nextRoute === "create" ? createImage : "";
  render();
}

function renderScreenOnly() {
  const screen = document.querySelector("#screen");
  if (screen) screen.innerHTML = routeTemplate();
  document.querySelectorAll("#screen [data-route]").forEach(el => el.addEventListener("click", () => go(el.dataset.route)));
  document.querySelectorAll("#screen [data-post]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.post; go("post"); }));
  document.querySelectorAll("#screen [data-comments]").forEach(el => el.addEventListener("click", () => { activePostId = el.dataset.comments; go("comments"); }));
}

async function submitSetup(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  account.username = cleanUsername(form.get("username")) || defaultAccount().username;
  account.displayName = form.get("displayName").trim() || defaultAccount().displayName;
  account.bio = form.get("bio").trim();
  account.category = form.get("category").trim();
  account.link = form.get("link").trim();
  const avatarFile = form.get("avatar");
  if (avatarFile?.size) account.avatar = await fileToDataUrl(avatarFile);
  const files = form.getAll("posts").filter(file => file.size);
  const captions = form.get("captions").split("\n");
  for (let index = 0; index < files.length; index++) {
    account.posts.push({ id: crypto.randomUUID(), image: await fileToDataUrl(files[index]), caption: captions[index]?.trim() || "", comments: [] });
  }
  saveAccount();
  view = "simulator";
  route = "profile";
  render();
}

async function submitPost(event) {
  event.preventDefault();
  if (!createImage) return toast("Choose a photo first.");
  const caption = document.querySelector("#create-caption").value.trim();
  const post = { id: crypto.randomUUID(), image: createImage, caption, comments: [] };
  account.posts.push(post);
  activePostId = post.id;
  createImage = "";
  saveAccount();
  route = "post";
  render();
  toast("Post added to your preview");
}

function submitComment(event) {
  event.preventDefault();
  const input = document.querySelector("#comment-input");
  const text = input.value.trim();
  const post = activePost();
  if (!text || !post) return;
  post.comments = post.comments || [];
  post.comments.push({ id: crypto.randomUUID(), text });
  saveAccount();
  render();
}

function editPost() {
  const post = activePost();
  if (!post) return;
  const nextCaption = window.prompt("Edit the caption, or type DELETE to remove this post.", post.caption);
  if (nextCaption === null) return;
  if (nextCaption.trim() === "DELETE") return deletePost(post);
  post.caption = nextCaption.trim();
  saveAccount();
  render();
}

function deletePost(post) {
  if (!window.confirm("Delete this post from the preview?")) return;
  account.posts = account.posts.filter(item => item.id !== post.id);
  saveAccount();
  route = "profile";
  render();
}

function cleanUsername(value = "") { return value.trim().replace(/^@/, "").replace(/\s+/g, "").toLowerCase(); }

function fileToDataUrl(file) {
  if (!file) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .84));
      };
      image.onerror = () => resolve(reader.result);
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

render();
